"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface BodyWeightEntry {
  date: string; // YYYY-MM-DD
  weightKg: number;
}

interface ProgressState {
  bodyWeightLogs: BodyWeightEntry[];
  addWeightLog: (weightKg: number) => void;
}

export const useProgressStore = create<ProgressState>()(
  persist(
    (set) => ({
      bodyWeightLogs: [],

      addWeightLog: (weightKg) => {
        const today = new Date().toISOString().split("T")[0];
        set((state) => {
          const filtered = state.bodyWeightLogs.filter((l) => l.date !== today);
          return {
            bodyWeightLogs: [{ date: today, weightKg }, ...filtered].slice(0, 365),
          };
        });
      },
    }),
    { name: "trainer-progress" }
  )
);
