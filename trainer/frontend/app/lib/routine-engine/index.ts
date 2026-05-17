import {
  type Exercise,
  type Equipment,
  type FitnessGoal,
  type FitnessLevel,
  type UserInjury,
  type RepRange,
  type SplitDay,
} from "@/app/types";
import { exerciseMap, getExerciseById } from "@/app/data/exercises";
import { getSplitById } from "@/app/data/splits";
import {
  getWarmupForSession,
  getCooldownForSession,
  type SessionTag,
} from "@/app/data/protocols";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface RoutineOptions {
  splitId: string;
  dayIndex: number;
  fitnessGoal: FitnessGoal;
  fitnessLevel: FitnessLevel;
  availableEquipment: Equipment[];
  injuries: UserInjury[];
  excludeExerciseIds?: string[];
}

export interface RoutineExercise {
  exercise: Exercise;
  repRange: RepRange;
  orderIndex: number;
  isCompound: boolean;
  substitutedFrom?: string;
}

export interface GeneratedRoutine {
  splitId: string;
  dayName: string;
  focusMuscleGroups: string[];
  exercises: RoutineExercise[];
  estimatedDurationMinutes: number;
  warmupProtocolId: string | null;
  cooldownProtocolId: string | null;
  skippedExerciseIds: string[];
}

// ─── Muscle Group → Session Tag Mapping ──────────────────────────────────────

const MUSCLE_GROUP_TO_SESSION_TAG: Record<string, SessionTag> = {
  chest: "chest",
  shoulders: "shoulders",
  triceps: "push",
  back: "back",
  lats: "back",
  "rear-delts": "pull",
  biceps: "pull",
  quads: "legs",
  hamstrings: "legs",
  glutes: "legs",
  calves: "legs",
  legs: "legs",
  arms: "arms",
  core: "core",
  "full-body": "full-body",
  hiit: "hiit",
  cardio: "cardio",
};

function inferSessionTag(muscleGroups: string[]): SessionTag {
  const groups = muscleGroups.map((g) => g.toLowerCase());

  if (groups.some((g) => ["quads", "hamstrings", "glutes", "calves", "legs"].includes(g))) {
    return "legs";
  }
  if (groups.includes("chest") && groups.includes("shoulders")) return "push";
  if (groups.includes("chest")) return "chest";
  if (groups.includes("back") && groups.includes("biceps")) return "pull";
  if (groups.includes("back")) return "back";
  if (groups.includes("shoulders")) return "shoulders";
  if (groups.includes("arms") || groups.includes("biceps") || groups.includes("triceps")) return "arms";
  if (groups.includes("core")) return "core";
  if (groups.includes("full-body")) return "full-body";
  if (groups.includes("cardio") || groups.includes("hiit")) return "cardio";

  return "full-body";
}

// ─── Equipment Compatibility ──────────────────────────────────────────────────

function hasRequiredEquipment(
  exercise: Exercise,
  available: Equipment[]
): boolean {
  if (exercise.equipment.length === 0) return true;
  if (exercise.equipment.includes("none")) return true;
  if (exercise.equipment.includes("bodyweight") && !available.includes("bodyweight")) {
    return available.length > 0;
  }
  return exercise.equipment.some((eq) => available.includes(eq));
}

// ─── Injury Contraindication Check ───────────────────────────────────────────

function isContraindicated(exercise: Exercise, injuries: UserInjury[]): boolean {
  if (!injuries.length) return false;

  const injuredRegions = injuries.map((inj) =>
    inj.bodyRegion.toLowerCase()
  );

  return exercise.contraindications.some((contra) =>
    injuredRegions.some((region) =>
      contra.toLowerCase().includes(region) ||
      region.includes(contra.toLowerCase())
    )
  );
}

// ─── Difficulty Gating ────────────────────────────────────────────────────────

function isExerciseSuitableForLevel(
  exercise: Exercise,
  level: FitnessLevel
): boolean {
  if (level === "beginner") return exercise.difficulty === "beginner";
  if (level === "intermediate") {
    return exercise.difficulty === "beginner" || exercise.difficulty === "intermediate";
  }
  return true;
}

// ─── Rep Range Selection ──────────────────────────────────────────────────────

function selectRepRange(exercise: Exercise, goal: FitnessGoal): RepRange {
  const map: Record<FitnessGoal, keyof Exercise["repRanges"]> = {
    "muscle-gain": "muscleGain",
    "fat-loss": "fatLoss",
    strength: "strength",
    recomp: "recomp",
    "greek-god": "greekGod",
    calisthenics: "muscleGain",
    "general-fitness": "recomp",
  };
  return exercise.repRanges[map[goal]];
}

// ─── Exercise Resolver ────────────────────────────────────────────────────────

function resolveExercise(
  exerciseId: string,
  options: {
    availableEquipment: Equipment[];
    fitnessLevel: FitnessLevel;
    injuries: UserInjury[];
  }
): { exercise: Exercise | null; substitutedFrom?: string } {
  const exercise = getExerciseById(exerciseId);
  if (!exercise) return { exercise: null };

  const equipmentOk = hasRequiredEquipment(exercise, options.availableEquipment);
  const levelOk = isExerciseSuitableForLevel(exercise, options.fitnessLevel);
  const notContraindicated = !isContraindicated(exercise, options.injuries);

  if (equipmentOk && levelOk && notContraindicated) {
    return { exercise };
  }

  // Try regression first for level issues
  if (!levelOk && exercise.regressionExercise) {
    const regression = getExerciseById(exercise.regressionExercise);
    if (
      regression &&
      hasRequiredEquipment(regression, options.availableEquipment) &&
      !isContraindicated(regression, options.injuries)
    ) {
      return { exercise: regression, substitutedFrom: exerciseId };
    }
  }

  // Try alternate for equipment or contraindication issues
  if (exercise.alternateExerciseId) {
    const alternate = getExerciseById(exercise.alternateExerciseId);
    if (
      alternate &&
      hasRequiredEquipment(alternate, options.availableEquipment) &&
      isExerciseSuitableForLevel(alternate, options.fitnessLevel) &&
      !isContraindicated(alternate, options.injuries)
    ) {
      return { exercise: alternate, substitutedFrom: exerciseId };
    }
  }

  // Return null — exercise will be skipped
  return { exercise: null };
}

// ─── Duration Estimator ───────────────────────────────────────────────────────

function estimateDurationMinutes(exercises: RoutineExercise[]): number {
  let totalSeconds = 0;

  for (const { exercise, repRange } of exercises) {
    const avgReps = Math.ceil((repRange.repsMin + repRange.repsMax) / 2);
    const secondsPerRep = exercise.movementType === "compound" ? 4 : 3;
    const setTime = avgReps * secondsPerRep;
    const restSeconds = parseRestToSeconds(repRange.restSuggestion);
    totalSeconds += repRange.sets * (setTime + restSeconds);
  }

  // Add ~5 minutes buffer (water, transitions, ramp sets)
  return Math.round(totalSeconds / 60) + 5;
}

function parseRestToSeconds(rest: string): number {
  // Parses strings like "90 seconds", "2–3 minutes", "60–90 seconds"
  const minMatch = rest.match(/(\d+)\s*min/i);
  if (minMatch) return parseInt(minMatch[1]) * 60;
  const secMatch = rest.match(/(\d+)/);
  if (secMatch) return parseInt(secMatch[1]);
  return 90;
}

// ─── Core Engine ──────────────────────────────────────────────────────────────

export function buildRoutine(options: RoutineOptions): GeneratedRoutine | null {
  const split = getSplitById(options.splitId);
  if (!split) return null;

  const splitDay: SplitDay | undefined = split.days[options.dayIndex];
  if (!splitDay) return null;

  if (splitDay.isRestDay) {
    return {
      splitId: options.splitId,
      dayName: splitDay.dayName,
      focusMuscleGroups: [],
      exercises: [],
      estimatedDurationMinutes: 0,
      warmupProtocolId: null,
      cooldownProtocolId: null,
      skippedExerciseIds: [],
    };
  }

  const exerciseIds = splitDay.exercises ?? [];
  const excluded = new Set(options.excludeExerciseIds ?? []);
  const skippedExerciseIds: string[] = [];
  const routineExercises: RoutineExercise[] = [];

  for (const id of exerciseIds) {
    if (excluded.has(id)) {
      skippedExerciseIds.push(id);
      continue;
    }

    const { exercise, substitutedFrom } = resolveExercise(id, {
      availableEquipment: options.availableEquipment,
      fitnessLevel: options.fitnessLevel,
      injuries: options.injuries,
    });

    if (!exercise) {
      skippedExerciseIds.push(id);
      continue;
    }

    routineExercises.push({
      exercise,
      repRange: selectRepRange(exercise, options.fitnessGoal),
      orderIndex: routineExercises.length,
      isCompound: exercise.movementType === "compound",
      substitutedFrom,
    });
  }

  // Sort: compounds first, then isolation
  routineExercises.sort((a, b) => {
    if (a.isCompound && !b.isCompound) return -1;
    if (!a.isCompound && b.isCompound) return 1;
    return a.orderIndex - b.orderIndex;
  });

  // Re-index after sort
  routineExercises.forEach((ex, i) => {
    ex.orderIndex = i;
  });

  const sessionTag = inferSessionTag(splitDay.muscleGroups);
  const warmup = getWarmupForSession(sessionTag);
  const cooldown = getCooldownForSession(sessionTag);

  return {
    splitId: options.splitId,
    dayName: splitDay.dayName,
    focusMuscleGroups: splitDay.muscleGroups,
    exercises: routineExercises,
    estimatedDurationMinutes: estimateDurationMinutes(routineExercises),
    warmupProtocolId: warmup?.id ?? null,
    cooldownProtocolId: cooldown?.id ?? null,
    skippedExerciseIds,
  };
}

// ─── Swap Helpers ─────────────────────────────────────────────────────────────

export function swapExercise(
  routine: GeneratedRoutine,
  orderIndex: number,
  newExerciseId: string
): GeneratedRoutine {
  const exercise = exerciseMap[newExerciseId];
  if (!exercise) return routine;

  const updatedExercises = routine.exercises.map((re) => {
    if (re.orderIndex !== orderIndex) return re;
    return {
      ...re,
      exercise,
      substitutedFrom: re.exercise.id,
    };
  });

  return {
    ...routine,
    exercises: updatedExercises,
    estimatedDurationMinutes: estimateDurationMinutes(updatedExercises),
  };
}

export function reorderExercises(
  routine: GeneratedRoutine,
  fromIndex: number,
  toIndex: number
): GeneratedRoutine {
  const exercises = [...routine.exercises];
  const [moved] = exercises.splice(fromIndex, 1);
  exercises.splice(toIndex, 0, moved);

  const reindexed = exercises.map((ex, i) => ({ ...ex, orderIndex: i }));

  return {
    ...routine,
    exercises: reindexed,
    estimatedDurationMinutes: estimateDurationMinutes(reindexed),
  };
}

export function addExercise(
  routine: GeneratedRoutine,
  exerciseId: string,
  goal: FitnessGoal
): GeneratedRoutine {
  const exercise = exerciseMap[exerciseId];
  if (!exercise) return routine;

  const newEntry: RoutineExercise = {
    exercise,
    repRange: selectRepRange(exercise, goal),
    orderIndex: routine.exercises.length,
    isCompound: exercise.movementType === "compound",
  };

  const exercises = [...routine.exercises, newEntry];

  return {
    ...routine,
    exercises,
    estimatedDurationMinutes: estimateDurationMinutes(exercises),
  };
}

export function removeExercise(
  routine: GeneratedRoutine,
  orderIndex: number
): GeneratedRoutine {
  const exercises = routine.exercises
    .filter((ex) => ex.orderIndex !== orderIndex)
    .map((ex, i) => ({ ...ex, orderIndex: i }));

  return {
    ...routine,
    exercises,
    estimatedDurationMinutes: estimateDurationMinutes(exercises),
  };
}

// ─── Query Helpers ────────────────────────────────────────────────────────────

export function getCompoundExercises(routine: GeneratedRoutine): RoutineExercise[] {
  return routine.exercises.filter((ex) => ex.isCompound);
}

export function getIsolationExercises(routine: GeneratedRoutine): RoutineExercise[] {
  return routine.exercises.filter((ex) => !ex.isCompound);
}

export function getTotalSets(routine: GeneratedRoutine): number {
  return routine.exercises.reduce((sum, ex) => sum + ex.repRange.sets, 0);
}
