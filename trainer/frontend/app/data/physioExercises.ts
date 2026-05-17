import { type PhysioExercise, type PhysioCondition, type PhysioPhase } from "@/app/types";
import { shoulderPhysioExercises } from "./physio-exercises-shoulder";
import { neckPhysioExercises } from "./physio-exercises-neck";
import { thoracicPhysioExercises } from "./physio-exercises-thoracic";
import { lumbarPhysioExercises } from "./physio-exercises-lumbar";
import { hipPhysioExercises } from "./physio-exercises-hip";
import { lowerLimbPhysioExercises } from "./physio-exercises-lower-limb";

export const allPhysioExercises: PhysioExercise[] = [
  ...shoulderPhysioExercises,
  ...neckPhysioExercises,
  ...thoracicPhysioExercises,
  ...lumbarPhysioExercises,
  ...hipPhysioExercises,
  ...lowerLimbPhysioExercises,
];

export const physioExerciseMap: Record<string, PhysioExercise> = Object.fromEntries(
  allPhysioExercises.map((ex) => [ex.id, ex])
);

export function getPhysioExerciseById(id: string): PhysioExercise | undefined {
  return physioExerciseMap[id];
}

export function getPhysioExercisesByCondition(
  condition: PhysioCondition
): PhysioExercise[] {
  return allPhysioExercises.filter((ex) => ex.condition === condition);
}

export function getPhysioExercisesByPhase(
  condition: PhysioCondition,
  phase: PhysioPhase
): PhysioExercise[] {
  return allPhysioExercises.filter(
    (ex) => ex.condition === condition && ex.phase.includes(phase)
  );
}

export function getPhysioExercisesBySessionType(
  condition: PhysioCondition,
  sessionType: PhysioExercise["sessionType"]
): PhysioExercise[] {
  return allPhysioExercises.filter(
    (ex) =>
      ex.condition === condition &&
      (ex.sessionType === sessionType || ex.sessionType === "both")
  );
}

export function getPhysioExercisesByPainTolerance(
  condition: PhysioCondition,
  currentPainLevel: number
): PhysioExercise[] {
  return allPhysioExercises.filter(
    (ex) => ex.condition === condition && ex.painLevelMax >= currentPainLevel
  );
}

export function getPhysioProgression(exerciseId: string): PhysioExercise | undefined {
  const exercise = physioExerciseMap[exerciseId];
  if (!exercise?.progressionExercise) return undefined;
  return physioExerciseMap[exercise.progressionExercise];
}

export function searchPhysioExercises(query: string): PhysioExercise[] {
  const q = query.toLowerCase();
  return allPhysioExercises.filter(
    (ex) =>
      ex.name.toLowerCase().includes(q) ||
      ex.condition.toLowerCase().includes(q)
  );
}

export {
  shoulderPhysioExercises,
  neckPhysioExercises,
  thoracicPhysioExercises,
  lumbarPhysioExercises,
  hipPhysioExercises,
  lowerLimbPhysioExercises,
};
