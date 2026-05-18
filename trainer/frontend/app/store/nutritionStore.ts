"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface DailyMacroLog {
  date: string; // ISO date "YYYY-MM-DD"
  proteinG: number;
  carbsG: number;
  fatG: number;
  calories: number;
}

interface NutritionState {
  logs: DailyMacroLog[];
  logMacros: (entry: Omit<DailyMacroLog, "date">) => void;
  getToday: () => DailyMacroLog | null;
  getLast: (days: number) => DailyMacroLog[];
}

function today(): string {
  return new Date().toISOString().split("T")[0];
}

export const useNutritionStore = create<NutritionState>()(
  persist(
    (set, get) => ({
      logs: [],

      logMacros: (entry) => {
        const date = today();
        set((state) => {
          const existing = state.logs.findIndex((l) => l.date === date);
          if (existing !== -1) {
            const updated = [...state.logs];
            updated[existing] = { date, ...entry };
            return { logs: updated };
          }
          return { logs: [{ date, ...entry }, ...state.logs].slice(0, 90) };
        });
      },

      getToday: () => {
        const date = today();
        return get().logs.find((l) => l.date === date) ?? null;
      },

      getLast: (days) => {
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - days);
        const cutStr = cutoff.toISOString().split("T")[0];
        return get().logs.filter((l) => l.date >= cutStr).sort((a, b) => b.date.localeCompare(a.date));
      },
    }),
    { name: "trainer-nutrition" }
  )
);
