"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { userScopedStorage } from "@/app/lib/userScopedStorage";

export interface DailyMacroLog {
  date: string; // ISO date "YYYY-MM-DD"
  proteinG: number;
  carbsG: number;
  fatG: number;
  calories: number;
}

export type DietType = "veg" | "veg-egg" | "non-veg-chicken" | "non-veg-all";

export const DIET_TYPE_META: Record<DietType, { label: string; emoji: string; color: string }> = {
  "veg":            { label: "Veg",             emoji: "🌱", color: "text-emerald-400" },
  "veg-egg":        { label: "Veg + Eggs",       emoji: "🥚", color: "text-amber-400"   },
  "non-veg-chicken":{ label: "Chicken & Eggs",   emoji: "🍗", color: "text-orange-400"  },
  "non-veg-all":    { label: "All Meat",         emoji: "🥩", color: "text-red-400"     },
};

export interface MealPreset {
  id: string;
  name: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  dietType?: DietType;
}

interface NutritionState {
  logs: DailyMacroLog[];
  mealPresets: MealPreset[];
  logMacros: (entry: Omit<DailyMacroLog, "date">) => void;
  addMacros: (entry: Omit<DailyMacroLog, "date">) => void;
  getToday: () => DailyMacroLog | null;
  getLast: (days: number) => DailyMacroLog[];
  savePreset: (preset: Omit<MealPreset, "id">) => void;
  deletePreset: (id: string) => void;
}

function today(): string {
  return new Date().toISOString().split("T")[0];
}

function makeId(): string {
  return `meal-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`;
}

export const useNutritionStore = create<NutritionState>()(
  persist(
    (set, get) => ({
      logs: [],
      mealPresets: [],

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

      addMacros: (entry) => {
        const date = today();
        set((state) => {
          const existing = state.logs.find((l) => l.date === date);
          const merged = existing
            ? {
                date,
                proteinG: existing.proteinG + entry.proteinG,
                carbsG: existing.carbsG + entry.carbsG,
                fatG: existing.fatG + entry.fatG,
                calories: existing.calories + entry.calories,
              }
            : { date, ...entry };
          const filtered = state.logs.filter((l) => l.date !== date);
          return { logs: [merged, ...filtered].slice(0, 90) };
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

      savePreset: (preset) => {
        set((state) => ({
          mealPresets: [{ ...preset, id: makeId() }, ...state.mealPresets].slice(0, 20),
        }));
      },

      deletePreset: (id) => {
        set((state) => ({ mealPresets: state.mealPresets.filter((p) => p.id !== id) }));
      },
    }),
    { name: "trainer-nutrition", storage: userScopedStorage }
  )
);
