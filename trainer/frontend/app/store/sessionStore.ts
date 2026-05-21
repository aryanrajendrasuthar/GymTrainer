"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { type WorkoutSession, type ExerciseLog } from "@/app/types";
import { type ActiveSession } from "@/app/hooks/useSession";

export interface DraftSession {
  splitDay: string;
  exerciseIds: string[];
  dayIndex: number;
  startedAt: string;
}

interface SessionState {
  activeSession: ActiveSession | null;
  recentSessions: WorkoutSession[];
  allExerciseLogs: ExerciseLog[];
  sessionDates: Record<string, string>;
  draftSession: DraftSession | null;

  startSession: (splitDay: string, exerciseIds: string[]) => void;
  endSession: () => void;
  addCompletedSession: (session: WorkoutSession) => void;
  setRecentSessions: (sessions: WorkoutSession[]) => void;
  setAllExerciseLogs: (logs: ExerciseLog[]) => void;
  appendExerciseLogs: (logs: ExerciseLog[]) => void;
  deleteSession: (sessionId: string) => void;
  setDraftSession: (draft: DraftSession) => void;
  clearDraftSession: () => void;
  rateSession: (id: string, rating: number) => void;
  editSessionNotes: (id: string, notes: string) => void;
}

export const useSessionStore = create<SessionState>()(
  persist(
    (set) => ({
  activeSession: null,
  recentSessions: [],
  allExerciseLogs: [],
  sessionDates: {},
  draftSession: null,

  startSession: (splitDay, exerciseIds) =>
    set({
      activeSession: {
        splitDay,
        startedAt: new Date().toISOString(),
        exercises: exerciseIds.map((id) => ({
          exerciseId: id,
          sets: [],
          isComplete: false,
        })),
        isActive: true,
      },
    }),

  endSession: () => set({ activeSession: null }),

  addCompletedSession: (session) =>
    set((state) => {
      const dates = { ...state.sessionDates, [session.id]: session.date };
      return {
        recentSessions: [session, ...state.recentSessions].slice(0, 50),
        allExerciseLogs: [
          ...session.exercisesCompleted,
          ...state.allExerciseLogs,
        ],
        sessionDates: dates,
      };
    }),

  setRecentSessions: (sessions) =>
    set((state) => {
      const dates: Record<string, string> = { ...state.sessionDates };
      sessions.forEach((s) => { dates[s.id] = s.date; });
      return { recentSessions: sessions, sessionDates: dates };
    }),

  setAllExerciseLogs: (logs) => set({ allExerciseLogs: logs }),

  appendExerciseLogs: (logs) =>
    set((state) => ({
      allExerciseLogs: [...state.allExerciseLogs, ...logs],
    })),

  deleteSession: (sessionId) =>
    set((state) => {
      const session = state.recentSessions.find((s) => s.id === sessionId);
      const logIds = new Set(session?.exercisesCompleted.map((l) => l.id) ?? []);
      const dates = { ...state.sessionDates };
      delete dates[sessionId];
      return {
        recentSessions: state.recentSessions.filter((s) => s.id !== sessionId),
        allExerciseLogs: state.allExerciseLogs.filter((l) => !logIds.has(l.id)),
        sessionDates: dates,
      };
    }),

  setDraftSession: (draft) => set({ draftSession: draft }),
  clearDraftSession: () => set({ draftSession: null }),

  rateSession: (id, rating) =>
    set((state) => ({
      recentSessions: state.recentSessions.map((s) =>
        s.id === id ? { ...s, rating } : s
      ),
    })),

  editSessionNotes: (id, notes) =>
    set((state) => ({
      recentSessions: state.recentSessions.map((s) =>
        s.id === id ? { ...s, sessionNotes: notes } : s
      ),
    })),
    }),
    {
      name: "trainer-sessions",
      partialize: (state) => ({
        recentSessions: state.recentSessions,
        allExerciseLogs: state.allExerciseLogs,
        sessionDates: state.sessionDates,
        draftSession: state.draftSession,
      }),
    }
  )
);
