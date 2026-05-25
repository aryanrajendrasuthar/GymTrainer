"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { userScopedStorage } from "@/app/lib/userScopedStorage";

export type PendingSlot = "morning" | "afternoon" | "evening" | "anytime";

export interface PendingExercise {
  id: string;
  type: "workout" | "physio";
}

export interface PendingSession {
  id: string;
  dayName: string;
  exercises: PendingExercise[];
  slot: PendingSlot;
  date: string; // YYYY-MM-DD — auto-cleared if before today
  createdAt: string;
}

interface PendingSessionState {
  sessions: PendingSession[];
  addSession: (session: Omit<PendingSession, "id" | "createdAt">) => string;
  removeSession: (id: string) => void;
  clearStale: () => void;
  getById: (id: string) => PendingSession | undefined;
  todaySessions: () => PendingSession[];
}

export const usePendingSessionStore = create<PendingSessionState>()(
  persist(
    (set, get) => ({
      sessions: [],

      addSession: (session) => {
        const id = `pending-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
        const newSession: PendingSession = {
          ...session,
          id,
          createdAt: new Date().toISOString(),
        };
        set((state) => ({ sessions: [...state.sessions, newSession] }));
        return id;
      },

      removeSession: (id) =>
        set((state) => ({
          sessions: state.sessions.filter((s) => s.id !== id),
        })),

      clearStale: () => {
        const today = new Date().toISOString().split("T")[0];
        set((state) => ({
          sessions: state.sessions.filter((s) => s.date >= today),
        }));
      },

      getById: (id) => get().sessions.find((s) => s.id === id),

      todaySessions: () => {
        const today = new Date().toISOString().split("T")[0];
        return get().sessions.filter((s) => s.date === today);
      },
    }),
    { name: "trainer-pending-sessions", storage: userScopedStorage }
  )
);
