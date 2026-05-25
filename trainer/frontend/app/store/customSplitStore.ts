"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { userScopedStorage } from "@/app/lib/userScopedStorage";
import type { WorkoutSplit, SplitDay } from "@/app/types";

interface CustomSplitState {
  customSplits: WorkoutSplit[];
  addCustomSplit: (split: WorkoutSplit) => void;
  updateCustomSplit: (id: string, patch: Partial<WorkoutSplit>) => void;
  removeCustomSplit: (id: string) => void;
}

export const useCustomSplitStore = create<CustomSplitState>()(
  persist(
    (set) => ({
      customSplits: [],

      addCustomSplit: (split) =>
        set((state) => ({ customSplits: [...state.customSplits, split] })),

      updateCustomSplit: (id, patch) =>
        set((state) => ({
          customSplits: state.customSplits.map((s) =>
            s.id === id ? { ...s, ...patch } : s
          ),
        })),

      removeCustomSplit: (id) =>
        set((state) => ({
          customSplits: state.customSplits.filter((s) => s.id !== id),
        })),
    }),
    { name: "trainer-custom-splits", storage: userScopedStorage }
  )
);

export function makeCustomSplitId(): string {
  return `custom-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function buildEmptyDay(name: string): SplitDay {
  return { dayName: name, muscleGroups: [], isRestDay: false, exercises: [] };
}
