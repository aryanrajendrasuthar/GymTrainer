"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface WaterState {
  todayIntakeMl: number;
  lastResetDate: string;
  dailyGoalMl: number;
  logWater: (ml: number) => void;
  setGoal: (ml: number) => void;
  reset: () => void;
}

function today(): string {
  return new Date().toISOString().split("T")[0];
}

export const useWaterStore = create<WaterState>()(
  persist(
    (set) => ({
      todayIntakeMl: 0,
      lastResetDate: today(),
      dailyGoalMl: 2500,

      logWater: (ml) => {
        const t = today();
        set((state) => ({
          todayIntakeMl: (state.lastResetDate === t ? state.todayIntakeMl : 0) + ml,
          lastResetDate: t,
        }));
      },

      setGoal: (ml) => set({ dailyGoalMl: ml }),

      reset: () => set({ todayIntakeMl: 0, lastResetDate: today() }),
    }),
    { name: "trainer-water" }
  )
);
