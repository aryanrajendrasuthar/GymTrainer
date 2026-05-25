"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { userScopedStorage } from "@/app/lib/userScopedStorage";

export interface WorkoutTemplate {
  id: string;
  name: string;
  exerciseIds: string[];
  createdAt: string;
  lastUsedAt?: string;
}

interface WorkoutTemplateState {
  templates: WorkoutTemplate[];
  saveTemplate: (name: string, exerciseIds: string[]) => string;
  deleteTemplate: (id: string) => void;
  touchTemplate: (id: string) => void;
}

export const useWorkoutTemplateStore = create<WorkoutTemplateState>()(
  persist(
    (set) => ({
      templates: [],

      saveTemplate: (name, exerciseIds) => {
        const id = `tpl-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
        set((state) => ({
          templates: [
            {
              id,
              name: name.trim() || "Quick Workout",
              exerciseIds,
              createdAt: new Date().toISOString(),
            },
            ...state.templates,
          ],
        }));
        return id;
      },

      deleteTemplate: (id) =>
        set((state) => ({
          templates: state.templates.filter((t) => t.id !== id),
        })),

      touchTemplate: (id) =>
        set((state) => ({
          templates: state.templates.map((t) =>
            t.id === id ? { ...t, lastUsedAt: new Date().toISOString() } : t
          ),
        })),
    }),
    { name: "trainer-workout-templates", storage: userScopedStorage }
  )
);
