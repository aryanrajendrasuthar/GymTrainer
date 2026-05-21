"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type GoalType = "strength" | "bodyweight" | "custom";

export interface PerformanceGoal {
  id: string;
  type: GoalType;
  label: string;
  exerciseId?: string;   // for strength goals
  targetValue: number;   // kg for strength/bodyweight, or user-defined for custom
  startValue?: number;   // baseline at goal creation
  unit: "kg" | "lb";
  deadline?: string;     // ISO date string
  createdAt: string;
  achieved: boolean;
  achievedAt?: string;
}

interface GoalState {
  goals: PerformanceGoal[];
  addGoal: (g: Omit<PerformanceGoal, "id" | "createdAt" | "achieved">) => string;
  deleteGoal: (id: string) => void;
  markAchieved: (id: string) => void;
}

function makeId(): string {
  return `goal-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

export const useGoalStore = create<GoalState>()(
  persist(
    (set) => ({
      goals: [],

      addGoal: (g) => {
        const id = makeId();
        set((state) => ({
          goals: [
            { ...g, id, createdAt: new Date().toISOString(), achieved: false },
            ...state.goals,
          ],
        }));
        return id;
      },

      deleteGoal: (id) =>
        set((state) => ({ goals: state.goals.filter((g) => g.id !== id) })),

      markAchieved: (id) =>
        set((state) => ({
          goals: state.goals.map((g) =>
            g.id === id ? { ...g, achieved: true, achievedAt: new Date().toISOString() } : g
          ),
        })),
    }),
    { name: "trainer-goals" }
  )
);
