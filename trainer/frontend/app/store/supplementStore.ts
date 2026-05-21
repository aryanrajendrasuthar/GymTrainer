"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface SupplementDef {
  id: string;
  name: string;
  emoji: string;
  dose: string;
  timing: string;
  enabled: boolean;
}

interface SupplementCompletion {
  date: string;   // YYYY-MM-DD
  takenIds: string[];
}

interface SupplementState {
  supplements: SupplementDef[];
  completions: SupplementCompletion[];
  toggleSupplementEnabled: (id: string) => void;
  markTaken: (id: string) => void;
  markNotTaken: (id: string) => void;
  getTodayTaken: () => string[];
}

const DEFAULT_SUPPLEMENTS: SupplementDef[] = [
  { id: "creatine",     name: "Creatine",     emoji: "💊", dose: "5 g",      timing: "Any time",    enabled: true  },
  { id: "protein",      name: "Protein",      emoji: "🥛", dose: "25 g",     timing: "Post-workout",enabled: true  },
  { id: "multivitamin", name: "Multivitamin", emoji: "🌿", dose: "1 tablet", timing: "With food",   enabled: true  },
  { id: "vitamin-d",    name: "Vitamin D",    emoji: "☀️", dose: "2 000 IU", timing: "With fat",    enabled: false },
  { id: "fish-oil",     name: "Fish Oil",     emoji: "🐟", dose: "1 g EPA",  timing: "With food",   enabled: false },
  { id: "caffeine",     name: "Pre-workout",  emoji: "⚡", dose: "200 mg",   timing: "30 min prior",enabled: false },
  { id: "bcaa",         name: "BCAAs",        emoji: "🧪", dose: "5 g",      timing: "Intra/post",  enabled: false },
];

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

export const useSupplementStore = create<SupplementState>()(
  persist(
    (set, get) => ({
      supplements: DEFAULT_SUPPLEMENTS,
      completions: [],

      toggleSupplementEnabled: (id) =>
        set((state) => ({
          supplements: state.supplements.map((s) =>
            s.id === id ? { ...s, enabled: !s.enabled } : s
          ),
        })),

      markTaken: (id) => {
        const date = todayStr();
        set((state) => {
          const existing = state.completions.find((c) => c.date === date);
          if (existing) {
            if (existing.takenIds.includes(id)) return state;
            return {
              completions: state.completions.map((c) =>
                c.date === date ? { ...c, takenIds: [...c.takenIds, id] } : c
              ),
            };
          }
          return {
            completions: [{ date, takenIds: [id] }, ...state.completions].slice(0, 60),
          };
        });
      },

      markNotTaken: (id) => {
        const date = todayStr();
        set((state) => ({
          completions: state.completions.map((c) =>
            c.date === date
              ? { ...c, takenIds: c.takenIds.filter((x) => x !== id) }
              : c
          ),
        }));
      },

      getTodayTaken: () => {
        const today = todayStr();
        return get().completions.find((c) => c.date === today)?.takenIds ?? [];
      },
    }),
    { name: "trainer-supplements" }
  )
);
