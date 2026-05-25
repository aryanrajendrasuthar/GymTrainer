"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { userScopedStorage } from "@/app/lib/userScopedStorage";

export interface SleepEntry {
  date: string; // YYYY-MM-DD
  hoursSlept: number;
  quality: 1 | 2 | 3 | 4 | 5; // 1=terrible, 5=excellent
}

interface SleepState {
  logs: SleepEntry[];
  logSleep: (hoursSlept: number, quality: SleepEntry["quality"]) => void;
  getToday: () => SleepEntry | null;
  getLast: (days: number) => SleepEntry[];
}

function today(): string {
  return new Date().toISOString().split("T")[0];
}

export const useSleepStore = create<SleepState>()(
  persist(
    (set, get) => ({
      logs: [],

      logSleep: (hoursSlept, quality) => {
        const date = today();
        set((state) => {
          const existing = state.logs.findIndex((l) => l.date === date);
          if (existing !== -1) {
            const updated = [...state.logs];
            updated[existing] = { date, hoursSlept, quality };
            return { logs: updated };
          }
          return { logs: [{ date, hoursSlept, quality }, ...state.logs].slice(0, 90) };
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
        return get().logs
          .filter((l) => l.date >= cutStr)
          .sort((a, b) => b.date.localeCompare(a.date));
      },
    }),
    { name: "trainer-sleep", storage: userScopedStorage }
  )
);
