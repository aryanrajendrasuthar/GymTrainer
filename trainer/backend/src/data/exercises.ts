export interface Exercise {
  id: string;
  name: string;
  alternativeNames?: string[];
  category: string;
  subcategory?: string;
  equipment: string[];
  location?: string[];
  difficulty: "beginner" | "intermediate" | "advanced";
  primaryMuscles: string[];
  secondaryMuscles?: string[];
  movementType?: string;
  forceType?: string;
  instructions?: string[];
  formCues?: string[];
  commonMistakes?: string[];
}

export const allExercises: Exercise[] = [];

export function searchExercises(q: string): Exercise[] {
  const lower = q.toLowerCase();
  return allExercises.filter(
    (ex) =>
      ex.name.toLowerCase().includes(lower) ||
      ex.id.toLowerCase().includes(lower) ||
      (ex.alternativeNames ?? []).some((n) => n.toLowerCase().includes(lower))
  );
}

export function getExercisesByCategory(category: string): Exercise[] {
  return allExercises.filter((ex) => ex.category === category);
}

export function getExercisesByMuscle(muscle: string): Exercise[] {
  return allExercises.filter(
    (ex) =>
      ex.primaryMuscles.includes(muscle) ||
      (ex.secondaryMuscles ?? []).includes(muscle)
  );
}
