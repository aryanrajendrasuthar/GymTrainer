"use client";

import { useState, useCallback, useRef } from "react";
import {
  type WorkoutSession,
  type ExerciseLog,
  type SetLog,
} from "@/app/types";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ActiveSet {
  setNumber: number;
  repsCompleted: number;
  weightUsed: number;
  weightUnit: "kg" | "lb";
  rpe?: number;
  notes?: string;
}

export interface ActiveExercise {
  exerciseId: string;
  sets: ActiveSet[];
  isComplete: boolean;
}

export interface ActiveSession {
  splitDay: string;
  startedAt: string;
  exercises: ActiveExercise[];
  isActive: boolean;
}

export interface UseSessionReturn {
  session: ActiveSession | null;
  startSession: (splitDay: string, exerciseIds: string[]) => void;
  logSet: (exerciseId: string, set: ActiveSet) => void;
  editSet: (exerciseId: string, setNumber: number, updated: Partial<ActiveSet>) => void;
  deleteSet: (exerciseId: string, setNumber: number) => void;
  markExerciseComplete: (exerciseId: string) => void;
  finishSession: (notes?: string) => WorkoutSession | null;
  abandonSession: () => void;
  totalVolumeKg: number;
  elapsedSeconds: number;
  completedExerciseCount: number;
}

// ─── Helper ───────────────────────────────────────────────────────────────────

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function calcVolume(exercises: ActiveExercise[]): number {
  return exercises.reduce((total, ex) =>
    total +
    ex.sets.reduce((s, set) => {
      const kg =
        set.weightUnit === "lb" ? set.weightUsed / 2.20462 : set.weightUsed;
      return s + set.repsCompleted * kg;
    }, 0),
    0
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useSession(): UseSessionReturn {
  const [session, setSession] = useState<ActiveSession | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startSession = useCallback((splitDay: string, exerciseIds: string[]) => {
    const now = new Date().toISOString();
    startTimeRef.current = Date.now();

    const exercises: ActiveExercise[] = exerciseIds.map((id) => ({
      exerciseId: id,
      sets: [],
      isComplete: false,
    }));

    setSession({ splitDay, startedAt: now, exercises, isActive: true });
    setElapsedSeconds(0);

    timerRef.current = setInterval(() => {
      if (startTimeRef.current) {
        setElapsedSeconds(
          Math.floor((Date.now() - startTimeRef.current) / 1000)
        );
      }
    }, 1000);
  }, []);

  const logSet = useCallback((exerciseId: string, set: ActiveSet) => {
    setSession((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        exercises: prev.exercises.map((ex) =>
          ex.exerciseId === exerciseId
            ? { ...ex, sets: [...ex.sets, { ...set, setNumber: ex.sets.length + 1 }] }
            : ex
        ),
      };
    });
  }, []);

  const editSet = useCallback(
    (exerciseId: string, setNumber: number, updated: Partial<ActiveSet>) => {
      setSession((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          exercises: prev.exercises.map((ex) =>
            ex.exerciseId === exerciseId
              ? {
                  ...ex,
                  sets: ex.sets.map((s) =>
                    s.setNumber === setNumber ? { ...s, ...updated } : s
                  ),
                }
              : ex
          ),
        };
      });
    },
    []
  );

  const deleteSet = useCallback((exerciseId: string, setNumber: number) => {
    setSession((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        exercises: prev.exercises.map((ex) => {
          if (ex.exerciseId !== exerciseId) return ex;
          const filtered = ex.sets.filter((s) => s.setNumber !== setNumber);
          const renumbered = filtered.map((s, i) => ({ ...s, setNumber: i + 1 }));
          return { ...ex, sets: renumbered };
        }),
      };
    });
  }, []);

  const markExerciseComplete = useCallback((exerciseId: string) => {
    setSession((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        exercises: prev.exercises.map((ex) =>
          ex.exerciseId === exerciseId ? { ...ex, isComplete: true } : ex
        ),
      };
    });
  }, []);

  const finishSession = useCallback(
    (notes?: string): WorkoutSession | null => {
      if (!session) return null;
      if (timerRef.current) clearInterval(timerRef.current);

      const now = new Date().toISOString();
      const durationMinutes = Math.round(elapsedSeconds / 60);

      const exercisesCompleted: ExerciseLog[] = session.exercises
        .filter((ex) => ex.sets.length > 0)
        .map((ex) => ({
          id: generateId(),
          userId: "",
          sessionId: "",
          exerciseId: ex.exerciseId,
          sets: ex.sets.map(
            (s): SetLog => ({
              setNumber: s.setNumber,
              repsCompleted: s.repsCompleted,
              weightUsed: s.weightUsed,
              weightUnit: s.weightUnit,
              rpe: s.rpe,
              notes: s.notes,
              loggedAt: now,
            })
          ),
          loggedAt: now,
        }));

      const workoutSession: WorkoutSession = {
        id: generateId(),
        userId: "",
        date: session.startedAt.split("T")[0],
        splitDay: session.splitDay,
        exercisesCompleted,
        totalVolumeKg: Math.round(calcVolume(session.exercises) * 10) / 10,
        durationMinutes,
        sessionNotes: notes,
        completedAt: now,
        isPartial: session.exercises.some((ex) => !ex.isComplete),
      };

      setSession(null);
      setElapsedSeconds(0);
      startTimeRef.current = null;

      return workoutSession;
    },
    [session, elapsedSeconds]
  );

  const abandonSession = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    setSession(null);
    setElapsedSeconds(0);
    startTimeRef.current = null;
  }, []);

  const totalVolumeKg = session ? calcVolume(session.exercises) : 0;
  const completedExerciseCount = session
    ? session.exercises.filter((ex) => ex.isComplete).length
    : 0;

  return {
    session,
    startSession,
    logSet,
    editSet,
    deleteSet,
    markExerciseComplete,
    finishSession,
    abandonSession,
    totalVolumeKg: Math.round(totalVolumeKg * 10) / 10,
    elapsedSeconds,
    completedExerciseCount,
  };
}
