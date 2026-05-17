import { type Exercise } from "@/app/types";
import { chestExercises } from "./exercises-chest";
import { backExercises } from "./exercises-back";
import { legsGlutesExercises } from "./exercises-legs-glutes";
import { shouldersAndArmsExercises } from "./exercises-shoulders-arms";
import { coreExercises } from "./exercises-core";

export const allExercises: Exercise[] = [
  ...chestExercises,
  ...backExercises,
  ...legsGlutesExercises,
  ...shouldersAndArmsExercises,
  ...coreExercises,
];

export const exerciseMap: Record<string, Exercise> = Object.fromEntries(
  allExercises.map((ex) => [ex.id, ex])
);

export function getExerciseById(id: string): Exercise | undefined {
  return exerciseMap[id];
}

export function getExercisesByCategory(category: Exercise["category"]): Exercise[] {
  return allExercises.filter((ex) => ex.category === category);
}

export function getExercisesByEquipment(equipment: Exercise["equipment"][number]): Exercise[] {
  return allExercises.filter((ex) => ex.equipment.includes(equipment));
}

export function getExercisesByMuscle(muscle: Exercise["primaryMuscles"][number]): Exercise[] {
  return allExercises.filter(
    (ex) => ex.primaryMuscles.includes(muscle) || ex.secondaryMuscles.includes(muscle)
  );
}

export function getExercisesByDifficulty(difficulty: Exercise["difficulty"]): Exercise[] {
  return allExercises.filter((ex) => ex.difficulty === difficulty);
}

export function getAlternateExercise(exerciseId: string): Exercise | undefined {
  const exercise = exerciseMap[exerciseId];
  if (!exercise?.alternateExerciseId) return undefined;
  return exerciseMap[exercise.alternateExerciseId];
}

export function getProgressionExercise(exerciseId: string): Exercise | undefined {
  const exercise = exerciseMap[exerciseId];
  if (!exercise?.progressionExercise) return undefined;
  return exerciseMap[exercise.progressionExercise];
}

export function getRegressionExercise(exerciseId: string): Exercise | undefined {
  const exercise = exerciseMap[exerciseId];
  if (!exercise?.regressionExercise) return undefined;
  return exerciseMap[exercise.regressionExercise];
}

export function searchExercises(query: string): Exercise[] {
  const q = query.toLowerCase();
  return allExercises.filter(
    (ex) =>
      ex.name.toLowerCase().includes(q) ||
      ex.alternativeNames.some((n) => n.toLowerCase().includes(q)) ||
      ex.tags.some((t) => t.toLowerCase().includes(q))
  );
}

export {
  chestExercises,
  backExercises,
  legsGlutesExercises,
  shouldersAndArmsExercises,
  coreExercises,
};
