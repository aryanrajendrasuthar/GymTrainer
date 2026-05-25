"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { userScopedStorage } from "@/app/lib/userScopedStorage";

export interface HabitDef {
  id: string;
  name: string;
  emoji: string;
  enabled: boolean;
  isCustom?: boolean;
}

interface HabitCompletion {
  date: string;        // YYYY-MM-DD
  completedIds: string[];
}

interface HabitState {
  habits: HabitDef[];
  completions: HabitCompletion[];
  toggleEnabled: (id: string) => void;
  markDone: (id: string) => void;
  markUndone: (id: string) => void;
  getTodayCompleted: () => string[];
  getStreak: (id: string) => number;
  addHabit: (name: string, emoji: string) => void;
  removeHabit: (id: string) => void;
}

const DEFAULT_HABITS: HabitDef[] = [
  { id: "stretch",    name: "Stretch",        emoji: "🧘", enabled: true  },
  { id: "foam-roll",  name: "Foam roll",      emoji: "🪵", enabled: true  },
  { id: "protein",    name: "Hit protein",    emoji: "🥩", enabled: true  },
  { id: "hydrate",    name: "Stay hydrated",  emoji: "💧", enabled: false },
  { id: "sleep",      name: "Sleep 7h+",      emoji: "🌙", enabled: false },
  { id: "steps",      name: "10k steps",      emoji: "👟", enabled: false },
];

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

export const useHabitStore = create<HabitState>()(
  persist(
    (set, get) => ({
      habits: DEFAULT_HABITS,
      completions: [],

      toggleEnabled: (id) =>
        set((state) => ({
          habits: state.habits.map((h) =>
            h.id === id ? { ...h, enabled: !h.enabled } : h
          ),
        })),

      markDone: (id) => {
        const date = todayStr();
        set((state) => {
          const existing = state.completions.find((c) => c.date === date);
          if (existing) {
            if (existing.completedIds.includes(id)) return state;
            return {
              completions: state.completions.map((c) =>
                c.date === date
                  ? { ...c, completedIds: [...c.completedIds, id] }
                  : c
              ),
            };
          }
          return {
            completions: [{ date, completedIds: [id] }, ...state.completions].slice(0, 90),
          };
        });
      },

      markUndone: (id) => {
        const date = todayStr();
        set((state) => ({
          completions: state.completions.map((c) =>
            c.date === date
              ? { ...c, completedIds: c.completedIds.filter((x) => x !== id) }
              : c
          ),
        }));
      },

      getTodayCompleted: () => {
        const today = todayStr();
        return get().completions.find((c) => c.date === today)?.completedIds ?? [];
      },

      addHabit: (name, emoji) => {
        const id = `custom-habit-${Date.now()}`;
        set((state) => ({
          habits: [...state.habits, { id, name: name.trim(), emoji: emoji.trim() || "💪", enabled: true, isCustom: true }],
        }));
      },

      removeHabit: (id) =>
        set((state) => ({
          habits: state.habits.filter((h) => h.id !== id),
          completions: state.completions.map((c) => ({
            ...c,
            completedIds: c.completedIds.filter((x) => x !== id),
          })),
        })),

      getStreak: (id) => {
        const doneSet = new Set(
          get()
            .completions.filter((c) => c.completedIds.includes(id))
            .map((c) => c.date)
        );
        if (!doneSet.size) return 0;

        const today = todayStr();
        const todayMs = new Date(today).getTime();
        const MS = 86400000;

        // Start from today; if not done today, start from yesterday
        let cursor = doneSet.has(today)
          ? todayMs
          : doneSet.has(new Date(todayMs - MS).toISOString().slice(0, 10))
          ? todayMs - MS
          : -1;

        if (cursor === -1) return 0;

        let streak = 0;
        while (doneSet.has(new Date(cursor).toISOString().slice(0, 10))) {
          streak++;
          cursor -= MS;
        }
        return streak;
      },
    }),
    { name: "trainer-habits", storage: userScopedStorage }
  )
);
