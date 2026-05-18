import {
  type PhysioExercise,
  type PhysioCondition,
  type PhysioPhase,
  type UserInjury,
} from "@/app/types";
import {
  physioExerciseMap,
  getPhysioExercisesByCondition,
} from "@/app/data/physioExercises";

// ─── Types ────────────────────────────────────────────────────────────────────

export type PhysioSessionSlot = "morning" | "evening";

export interface PhysioSessionOptions {
  condition: PhysioCondition;
  phase: PhysioPhase;
  slot: PhysioSessionSlot;
  currentPainLevel: number;
  completedExerciseIds?: string[];
  maxExercises?: number;
}

export interface PhysioSessionExercise {
  exercise: PhysioExercise;
  orderIndex: number;
  isProgression: boolean;
}

export interface PhysioSession {
  condition: PhysioCondition;
  phase: PhysioPhase;
  slot: PhysioSessionSlot;
  exercises: PhysioSessionExercise[];
  estimatedDurationMinutes: number;
  redFlagsToWatch: string[];
}

export interface PhaseGateResult {
  canProgress: boolean;
  reason: string;
  currentPhase: PhysioPhase;
  suggestedPhase: PhysioPhase | null;
}

export interface PhysioSessionLog {
  condition: PhysioCondition;
  phase: PhysioPhase;
  completedExerciseIds: string[];
  painBefore: number;
  painAfter: number;
  loggedAt: string;
}

// ─── Phase Order ──────────────────────────────────────────────────────────────

const PHASE_ORDER: PhysioPhase[] = ["acute", "subacute", "chronic", "maintenance"];

export function getNextPhase(current: PhysioPhase): PhysioPhase | null {
  const idx = PHASE_ORDER.indexOf(current);
  if (idx === -1 || idx === PHASE_ORDER.length - 1) return null;
  return PHASE_ORDER[idx + 1];
}

export function getPreviousPhase(current: PhysioPhase): PhysioPhase | null {
  const idx = PHASE_ORDER.indexOf(current);
  if (idx <= 0) return null;
  return PHASE_ORDER[idx - 1];
}

// ─── Pain Level Gate ──────────────────────────────────────────────────────────

function isPainSafe(exercise: PhysioExercise, currentPainLevel: number): boolean {
  return currentPainLevel <= exercise.painLevelMax;
}

// ─── Session Type Gate ────────────────────────────────────────────────────────

function matchesSlot(
  exercise: PhysioExercise,
  slot: PhysioSessionSlot
): boolean {
  return exercise.sessionType === "both" || exercise.sessionType === slot;
}

// ─── Phase Gate ───────────────────────────────────────────────────────────────

function matchesPhase(exercise: PhysioExercise, phase: PhysioPhase): boolean {
  return exercise.phase.includes(phase);
}

// ─── Session Builder ──────────────────────────────────────────────────────────

export function buildPhysioSession(
  options: PhysioSessionOptions
): PhysioSession {
  const {
    condition,
    phase,
    slot,
    currentPainLevel,
    completedExerciseIds = [],
    maxExercises = 6,
  } = options;

  const allForCondition = getPhysioExercisesByCondition(condition);

  const eligible = allForCondition.filter(
    (ex) =>
      matchesPhase(ex, phase) &&
      matchesSlot(ex, slot) &&
      isPainSafe(ex, currentPainLevel)
  );

  // Prioritise exercises not yet completed today
  const completed = new Set(completedExerciseIds);
  const fresh = eligible.filter((ex) => !completed.has(ex.id));
  const repeated = eligible.filter((ex) => completed.has(ex.id));

  const pool = [...fresh, ...repeated].slice(0, maxExercises);

  const sessionExercises: PhysioSessionExercise[] = pool.map((ex, i) => ({
    exercise: ex,
    orderIndex: i,
    isProgression: isProgressionExercise(ex, allForCondition),
  }));

  const redFlags = Array.from(
    new Set(pool.flatMap((ex) => ex.redFlags))
  );

  return {
    condition,
    phase,
    slot,
    exercises: sessionExercises,
    estimatedDurationMinutes: estimatePhysioDuration(pool),
    redFlagsToWatch: redFlags,
  };
}

function isProgressionExercise(
  exercise: PhysioExercise,
  conditionExercises: PhysioExercise[]
): boolean {
  return conditionExercises.some(
    (ex) => ex.progressionExercise === exercise.id
  );
}

function estimatePhysioDuration(exercises: PhysioExercise[]): number {
  return exercises.reduce((total, ex) => {
    const holdSecs = ex.holdTime ?? 0;
    const reps = ex.reps ?? 10;
    const sets = ex.sets ?? 3;
    const repTime = ex.holdTime ? holdSecs * sets : reps * 3 * sets;
    const restTime = sets * 30;
    return total + Math.ceil((repTime + restTime) / 60);
  }, 0);
}

// ─── Phase Gate Assessment ────────────────────────────────────────────────────

export function assessPhaseGate(
  recentLogs: PhysioSessionLog[],
  condition: PhysioCondition,
  currentPhase: PhysioPhase
): PhaseGateResult {
  const conditionLogs = recentLogs.filter((l) => l.condition === condition);

  if (conditionLogs.length < 3) {
    return {
      canProgress: false,
      reason: "Insufficient session history. Complete at least 3 sessions before phase progression is assessed.",
      currentPhase,
      suggestedPhase: null,
    };
  }

  const recent = conditionLogs
    .sort((a, b) => new Date(b.loggedAt).getTime() - new Date(a.loggedAt).getTime())
    .slice(0, 5);

  const avgPainAfter =
    recent.reduce((sum, l) => sum + l.painAfter, 0) / recent.length;

  const avgPainBefore =
    recent.reduce((sum, l) => sum + l.painBefore, 0) / recent.length;

  const painImproving = avgPainAfter < avgPainBefore;
  const painLow = avgPainAfter <= 2;

  // Regression: if pain is consistently high, recommend stepping back
  if (avgPainAfter >= 6) {
    const prevPhase = getPreviousPhase(currentPhase);
    return {
      canProgress: false,
      reason: `Average post-session pain is ${avgPainAfter.toFixed(1)}/10. Consider returning to ${prevPhase ?? "acute"} phase protocols and consulting your physiotherapist.`,
      currentPhase,
      suggestedPhase: prevPhase,
    };
  }

  const nextPhase = getNextPhase(currentPhase);

  if (!nextPhase) {
    return {
      canProgress: false,
      reason: "You are in the maintenance phase. Continue current exercises to preserve function.",
      currentPhase,
      suggestedPhase: null,
    };
  }

  if (painLow && painImproving) {
    return {
      canProgress: true,
      reason: `Pain is consistently low (avg ${avgPainAfter.toFixed(1)}/10 after sessions) and improving. You may be ready to progress to the ${nextPhase} phase.`,
      currentPhase,
      suggestedPhase: nextPhase,
    };
  }

  return {
    canProgress: false,
    reason: `Pain after sessions (avg ${avgPainAfter.toFixed(1)}/10) needs to be ≤ 2/10 consistently before progressing to the ${nextPhase} phase.`,
    currentPhase,
    suggestedPhase: null,
  };
}

// ─── Red Flag Screener ────────────────────────────────────────────────────────

export interface RedFlagAlert {
  conditionId: PhysioCondition;
  flags: string[];
  requiresImmediateAttention: boolean;
}

const IMMEDIATE_RED_FLAGS = [
  "bladder",
  "bowel",
  "saddle",
  "bilateral leg",
  "foot drop",
  "rapidly progressive",
  "rupture",
  "fracture",
];

export function screenRedFlags(
  reportedSymptoms: string[],
  condition: PhysioCondition
): RedFlagAlert {
  const exercises = getPhysioExercisesByCondition(condition);
  const allFlags = Array.from(
    new Set(exercises.flatMap((ex) => ex.redFlags))
  );

  const matchedFlags = allFlags.filter((flag) =>
    reportedSymptoms.some((symptom) =>
      flag.toLowerCase().includes(symptom.toLowerCase()) ||
      symptom.toLowerCase().includes(flag.toLowerCase())
    )
  );

  const requiresImmediateAttention = matchedFlags.some((flag) =>
    IMMEDIATE_RED_FLAGS.some((critical) =>
      flag.toLowerCase().includes(critical)
    )
  );

  return {
    conditionId: condition,
    flags: matchedFlags,
    requiresImmediateAttention,
  };
}

// ─── Multi-Condition Session Builder ─────────────────────────────────────────

export function buildMultiConditionSession(
  injuries: UserInjury[],
  slot: PhysioSessionSlot,
  currentPainLevels: Record<PhysioCondition, number>,
  maxExercisesTotal = 8
): PhysioSession[] {
  const perCondition = Math.max(
    2,
    Math.floor(maxExercisesTotal / injuries.length)
  );

  return injuries.map((injury) =>
    buildPhysioSession({
      condition: injury.condition,
      phase: injury.phase,
      slot,
      currentPainLevel: currentPainLevels[injury.condition] ?? 0,
      maxExercises: perCondition,
    })
  );
}

// ─── Exercise Progression Lookup ─────────────────────────────────────────────

export function getPhysioProgressionChain(
  startExerciseId: string
): PhysioExercise[] {
  const chain: PhysioExercise[] = [];
  let current = physioExerciseMap[startExerciseId];

  while (current) {
    chain.push(current);
    if (!current.progressionExercise) break;
    const next = physioExerciseMap[current.progressionExercise];
    if (!next || chain.includes(next)) break;
    current = next;
  }

  return chain;
}

// ─── Condition Summary ────────────────────────────────────────────────────────

export function getConditionExerciseSummary(condition: PhysioCondition): {
  totalExercises: number;
  byPhase: Record<PhysioPhase, number>;
  hasMorning: boolean;
  hasEvening: boolean;
} {
  const exercises = getPhysioExercisesByCondition(condition);

  const byPhase = PHASE_ORDER.reduce(
    (acc, phase) => ({
      ...acc,
      [phase]: exercises.filter((ex) => ex.phase.includes(phase)).length,
    }),
    {} as Record<PhysioPhase, number>
  );

  return {
    totalExercises: exercises.length,
    byPhase,
    hasMorning: exercises.some(
      (ex) => ex.sessionType === "morning" || ex.sessionType === "both"
    ),
    hasEvening: exercises.some(
      (ex) => ex.sessionType === "evening" || ex.sessionType === "both"
    ),
  };
}
