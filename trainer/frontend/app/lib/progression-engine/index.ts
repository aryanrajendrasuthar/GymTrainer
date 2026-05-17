import {
  type Exercise,
  type ExerciseLog,
  type SetLog,
  type ProgressionSuggestion,
  type OverloadAmount,
  type FitnessGoal,
} from "@/app/types";
import { getExerciseById } from "@/app/data/exercises";

// ─── Types ────────────────────────────────────────────────────────────────────

export type ProgressionTrigger =
  | "rep-ceiling-reached"
  | "consistent-rpe-low"
  | "double-progression-complete"
  | "no-progression-needed"
  | "insufficient-data"
  | "deload-recommended";

export interface ProgressionAnalysis {
  exerciseId: string;
  trigger: ProgressionTrigger;
  suggestion: ProgressionSuggestion | null;
  deloadRecommended: boolean;
  sessionsAnalysed: number;
  averageRpe: number | null;
  repComplianceRate: number;
}

export interface DeloadSignal {
  detected: boolean;
  reason: string;
  affectedExercises: string[];
}

// ─── Constants ────────────────────────────────────────────────────────────────

const SESSIONS_REQUIRED = 2;
const RPE_CEILING_FOR_PROGRESSION = 8.5;
const RPE_FLOOR_FOR_EASY_PROGRESSION = 7.0;
const DELOAD_RPE_THRESHOLD = 9.0;
const DELOAD_SESSION_COUNT = 3;
const REP_COMPLIANCE_THRESHOLD = 0.85;

// ─── Weight Increment Calculation ─────────────────────────────────────────────

function getBaseIncrement(
  exercise: Exercise,
  amount: OverloadAmount
): number {
  const bodyRegion = inferBodyRegion(exercise);
  const base = exercise.suggestedWeightIncreaseKg[bodyRegion];

  const multiplier: Record<OverloadAmount, number> = {
    conservative: 0.5,
    standard: 1.0,
    aggressive: 1.5,
  };

  const raw = base * multiplier[amount];

  // Round to nearest practical increment (0.5 kg for upper, 1.25 kg for lower)
  const step = bodyRegion === "lower" ? 1.25 : 0.5;
  return Math.round(raw / step) * step;
}

function inferBodyRegion(
  exercise: Exercise
): keyof Exercise["suggestedWeightIncreaseKg"] {
  const lower = [
    "legs",
    "glutes",
  ] as const;
  const isolation = [
    "arms",
    "core",
    "mobility",
    "warmup-cooldown",
    "cardio",
  ] as const;

  if ((lower as readonly string[]).includes(exercise.category)) return "lower";
  if ((isolation as readonly string[]).includes(exercise.category)) return "isolation";
  if (exercise.movementType === "isolation") return "isolation";
  return "upper";
}

// ─── Rep Compliance ────────────────────────────────────────────────────────────

function calcRepCompliance(sets: SetLog[], repsMax: number): number {
  if (!sets.length) return 0;
  const compliant = sets.filter((s) => s.repsCompleted >= repsMax).length;
  return compliant / sets.length;
}

function allSetsHitCeiling(sets: SetLog[], repsMax: number): boolean {
  return sets.every((s) => s.repsCompleted >= repsMax);
}

// ─── RPE Analysis ─────────────────────────────────────────────────────────────

function averageRpe(logs: ExerciseLog[]): number | null {
  const rpeSets = logs
    .flatMap((l) => l.sets)
    .filter((s): s is SetLog & { rpe: number } => s.rpe != null);

  if (!rpeSets.length) return null;
  return rpeSets.reduce((sum, s) => sum + s.rpe, 0) / rpeSets.length;
}

function currentWeight(log: ExerciseLog): number {
  const weights = log.sets.map((s) => s.weightUsed).filter((w) => w > 0);
  if (!weights.length) return 0;
  return Math.max(...weights);
}

// ─── Single-Exercise Progression Analysis ────────────────────────────────────

export function analyseExercise(
  exerciseId: string,
  recentLogs: ExerciseLog[],
  goal: FitnessGoal,
  overloadAmount: OverloadAmount
): ProgressionAnalysis {
  const exercise = getExerciseById(exerciseId);

  if (!exercise) {
    return {
      exerciseId,
      trigger: "insufficient-data",
      suggestion: null,
      deloadRecommended: false,
      sessionsAnalysed: 0,
      averageRpe: null,
      repComplianceRate: 0,
    };
  }

  const logs = recentLogs
    .filter((l) => l.exerciseId === exerciseId)
    .sort((a, b) => new Date(b.loggedAt).getTime() - new Date(a.loggedAt).getTime());

  if (logs.length < SESSIONS_REQUIRED) {
    return {
      exerciseId,
      trigger: "insufficient-data",
      suggestion: null,
      deloadRecommended: false,
      sessionsAnalysed: logs.length,
      averageRpe: null,
      repComplianceRate: 0,
    };
  }

  const goalKeyMap: Record<FitnessGoal, keyof Exercise["repRanges"]> = {
    "muscle-gain": "muscleGain",
    "fat-loss": "fatLoss",
    strength: "strength",
    recomp: "recomp",
    "greek-god": "greekGod",
    calisthenics: "muscleGain",
    "general-fitness": "recomp",
  };

  const repRange = exercise.repRanges[goalKeyMap[goal]];
  const latestLog = logs[0];
  const avgRpe = averageRpe(logs.slice(0, SESSIONS_REQUIRED));
  const lastWeight = currentWeight(latestLog);

  // Deload detection: RPE >= threshold across DELOAD_SESSION_COUNT sessions
  if (logs.length >= DELOAD_SESSION_COUNT) {
    const recentRpes = logs
      .slice(0, DELOAD_SESSION_COUNT)
      .flatMap((l) => l.sets)
      .filter((s) => s.rpe != null)
      .map((s) => s.rpe as number);

    if (
      recentRpes.length >= DELOAD_SESSION_COUNT * 2 &&
      recentRpes.every((r) => r >= DELOAD_RPE_THRESHOLD)
    ) {
      return {
        exerciseId,
        trigger: "deload-recommended",
        suggestion: null,
        deloadRecommended: true,
        sessionsAnalysed: logs.length,
        averageRpe: avgRpe,
        repComplianceRate: calcRepCompliance(latestLog.sets, repRange.repsMax),
      };
    }
  }

  // Check last two sessions both hit the rep ceiling
  const recentTwoSessions = logs.slice(0, SESSIONS_REQUIRED);
  const bothHitCeiling = recentTwoSessions.every((log) =>
    allSetsHitCeiling(log.sets, repRange.repsMax)
  );

  const repCompliance = calcRepCompliance(latestLog.sets, repRange.repsMax);

  if (!bothHitCeiling && repCompliance < REP_COMPLIANCE_THRESHOLD) {
    return {
      exerciseId,
      trigger: "no-progression-needed",
      suggestion: null,
      deloadRecommended: false,
      sessionsAnalysed: logs.length,
      averageRpe: avgRpe,
      repComplianceRate: repCompliance,
    };
  }

  // RPE-gated: only suggest increase if the effort was sustainable
  if (avgRpe !== null && avgRpe > RPE_CEILING_FOR_PROGRESSION) {
    return {
      exerciseId,
      trigger: "no-progression-needed",
      suggestion: null,
      deloadRecommended: false,
      sessionsAnalysed: logs.length,
      averageRpe: avgRpe,
      repComplianceRate: repCompliance,
    };
  }

  const increment = getBaseIncrement(exercise, overloadAmount);

  // RPE very low — allow aggressive jump if on "aggressive" setting
  const trigger: ProgressionTrigger =
    avgRpe !== null && avgRpe <= RPE_FLOOR_FOR_EASY_PROGRESSION
      ? "consistent-rpe-low"
      : "rep-ceiling-reached";

  const suggestedWeight =
    lastWeight + (trigger === "consistent-rpe-low" ? increment * 2 : increment);

  const suggestion: ProgressionSuggestion = {
    exerciseId,
    currentWeight: lastWeight,
    suggestedWeight,
    reason:
      trigger === "rep-ceiling-reached"
        ? `Hit the top of the rep range (${repRange.repsMax} reps) in ${SESSIONS_REQUIRED} consecutive sessions. Increase weight by ${increment} kg.`
        : `All sets completed well below RPE ${RPE_FLOOR_FOR_EASY_PROGRESSION}. Double increment applied.`,
    increaseAmountKg: suggestedWeight - lastWeight,
  };

  return {
    exerciseId,
    trigger,
    suggestion,
    deloadRecommended: false,
    sessionsAnalysed: logs.length,
    averageRpe: avgRpe,
    repComplianceRate: repCompliance,
  };
}

// ─── Multi-Exercise Routine Analysis ─────────────────────────────────────────

export function analyseRoutine(
  exerciseIds: string[],
  recentLogs: ExerciseLog[],
  goal: FitnessGoal,
  overloadAmount: OverloadAmount
): ProgressionAnalysis[] {
  return exerciseIds.map((id) =>
    analyseExercise(id, recentLogs, goal, overloadAmount)
  );
}

export function getPendingSuggestions(
  analyses: ProgressionAnalysis[]
): ProgressionSuggestion[] {
  return analyses
    .filter((a) => a.suggestion !== null)
    .map((a) => a.suggestion as ProgressionSuggestion);
}

// ─── Deload Signal Detection ──────────────────────────────────────────────────

export function detectDeloadSignal(
  analyses: ProgressionAnalysis[]
): DeloadSignal {
  const deloadExercises = analyses
    .filter((a) => a.deloadRecommended)
    .map((a) => a.exerciseId);

  if (!deloadExercises.length) {
    return { detected: false, reason: "", affectedExercises: [] };
  }

  return {
    detected: true,
    reason: `RPE consistently above ${DELOAD_RPE_THRESHOLD} for ${DELOAD_SESSION_COUNT} sessions on ${deloadExercises.length} exercise(s). A deload week is recommended.`,
    affectedExercises: deloadExercises,
  };
}

// ─── Estimated 1RM Calculator ─────────────────────────────────────────────────

export function estimateOneRepMax(weightKg: number, reps: number): number {
  if (reps === 1) return weightKg;
  if (reps <= 0) return 0;
  // Epley formula: weight × (1 + reps / 30)
  return Math.round(weightKg * (1 + reps / 30) * 10) / 10;
}

// ─── Volume Calculator ────────────────────────────────────────────────────────

export function calcSessionVolume(log: ExerciseLog): number {
  return log.sets.reduce(
    (total, set) => total + set.repsCompleted * set.weightUsed,
    0
  );
}

export function calcTotalSessionVolume(logs: ExerciseLog[]): number {
  return logs.reduce((sum, log) => sum + calcSessionVolume(log), 0);
}

// ─── Weight Unit Conversion ───────────────────────────────────────────────────

export function kgToLb(kg: number): number {
  return Math.round(kg * 2.20462 * 4) / 4; // rounds to nearest 0.25 lb
}

export function lbToKg(lb: number): number {
  return Math.round((lb / 2.20462) * 4) / 4;
}

export function formatWeight(
  kg: number,
  unit: "kg" | "lb"
): string {
  if (unit === "lb") return `${kgToLb(kg)} lb`;
  return `${kg} kg`;
}
