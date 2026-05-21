"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Exercise, ExerciseCategory, Equipment, MuscleGroup } from "@/app/types";

export interface CustomExercise extends Exercise {
  isCustom: true;
}

// Shared default repRanges so every custom exercise is valid Exercise
const DEFAULT_REP_RANGES: Exercise["repRanges"] = {
  muscleGain: { sets: 3, repsMin: 8,  repsMax: 12, restSuggestion: "60–90 s" },
  fatLoss:    { sets: 3, repsMin: 12, repsMax: 20, restSuggestion: "30–60 s" },
  strength:   { sets: 5, repsMin: 3,  repsMax: 5,  restSuggestion: "3–5 min" },
  recomp:     { sets: 4, repsMin: 8,  repsMax: 15, restSuggestion: "60–90 s" },
  greekGod:   { sets: 4, repsMin: 8,  repsMax: 12, restSuggestion: "90 s"    },
  endurance:  { sets: 2, repsMin: 15, repsMax: 25, restSuggestion: "30 s"    },
};

export function buildCustomExercise(
  name: string,
  category: ExerciseCategory,
  primaryMuscles: MuscleGroup[],
  equipment: Equipment[],
  difficulty: "beginner" | "intermediate" | "advanced",
  movementType: "compound" | "isolation" | "cardio"
): CustomExercise {
  const id = `custom-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  return {
    id,
    name: name.trim(),
    alternativeNames: [],
    category,
    subcategory: "custom",
    equipment,
    location: ["gym", "home"],
    difficulty,
    primaryMuscles,
    secondaryMuscles: [],
    gripVariations: [],
    movementType,
    forceType: "push",
    mechanic: "bilateral",
    instructions: [],
    formCues: [],
    commonMistakes: [],
    breathingPattern: "",
    youtubeId: "",
    repRanges: DEFAULT_REP_RANGES,
    suggestedWeightIncreaseKg: { upper: 2.5, lower: 5, isolation: 1.25 },
    contraindications: [],
    tags: ["custom"],
    isCustom: true,
  };
}

interface CustomExerciseState {
  customExercises: CustomExercise[];
  addCustomExercise: (ex: CustomExercise) => void;
  removeCustomExercise: (id: string) => void;
}

export const useCustomExerciseStore = create<CustomExerciseState>()(
  persist(
    (set) => ({
      customExercises: [],

      addCustomExercise: (ex) =>
        set((state) => ({ customExercises: [ex, ...state.customExercises] })),

      removeCustomExercise: (id) =>
        set((state) => ({
          customExercises: state.customExercises.filter((e) => e.id !== id),
        })),
    }),
    { name: "trainer-custom-exercises" }
  )
);
