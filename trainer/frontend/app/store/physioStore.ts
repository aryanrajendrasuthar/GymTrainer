"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  type PhysioCondition,
  type PhysioPhase,
  type UserInjury,
} from "@/app/types";
import { userScopedStorage } from "@/app/lib/userScopedStorage";

interface PainEntry {
  condition: PhysioCondition;
  level: number;
  loggedAt: string;
}

interface PhysioSessionRecord {
  id: string;
  condition: PhysioCondition;
  phase: PhysioPhase;
  slot: "morning" | "evening";
  painBefore: number;
  painAfter: number;
  completedExerciseIds: string[];
  completedAt: string;
}

interface PhysioState {
  activeInjuries: UserInjury[];
  sessionHistory: PhysioSessionRecord[];
  painHistory: PainEntry[];
  todayCompletedSlots: Record<string, ("morning" | "evening")[]>;

  setInjuries: (injuries: UserInjury[]) => void;
  updateInjuryPhase: (condition: PhysioCondition, phase: PhysioPhase) => void;
  addSession: (session: PhysioSessionRecord) => void;
  logPain: (condition: PhysioCondition, level: number) => void;
  markSlotComplete: (
    condition: PhysioCondition,
    slot: "morning" | "evening"
  ) => void;
  getLatestPain: (condition: PhysioCondition) => number | null;
  getRecentSessions: (
    condition: PhysioCondition,
    count?: number
  ) => PhysioSessionRecord[];
  resetDailySlots: () => void;
}

export const usePhysioStore = create<PhysioState>()(
  persist(
    (set, get) => ({
      activeInjuries: [],
      sessionHistory: [],
      painHistory: [],
      todayCompletedSlots: {},

      setInjuries: (injuries) => set({ activeInjuries: injuries }),

      updateInjuryPhase: (condition, phase) =>
        set((state) => ({
          activeInjuries: state.activeInjuries.map((inj) =>
            inj.condition === condition ? { ...inj, phase } : inj
          ),
        })),

      addSession: (session) =>
        set((state) => ({
          sessionHistory: [session, ...state.sessionHistory].slice(0, 200),
        })),

      logPain: (condition, level) =>
        set((state) => ({
          painHistory: [
            { condition, level, loggedAt: new Date().toISOString() },
            ...state.painHistory,
          ].slice(0, 500),
        })),

      markSlotComplete: (condition, slot) =>
        set((state) => {
          const key = condition;
          const existing = state.todayCompletedSlots[key] ?? [];
          if (existing.includes(slot)) return state;
          return {
            todayCompletedSlots: {
              ...state.todayCompletedSlots,
              [key]: [...existing, slot],
            },
          };
        }),

      getLatestPain: (condition) => {
        const entry = get().painHistory.find(
          (p) => p.condition === condition
        );
        return entry?.level ?? null;
      },

      getRecentSessions: (condition, count = 5) =>
        get()
          .sessionHistory.filter((s) => s.condition === condition)
          .slice(0, count),

      resetDailySlots: () => set({ todayCompletedSlots: {} }),
    }),
    {
      name: "trainer-physio",
      storage: userScopedStorage,
      partialize: (state) => ({
        activeInjuries: state.activeInjuries,
        sessionHistory: state.sessionHistory.slice(0, 100),
        painHistory: state.painHistory.slice(0, 200),
        todayCompletedSlots: state.todayCompletedSlots,
      }),
    }
  )
);
