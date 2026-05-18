"use client";

import { useMemo } from "react";
import { type ExerciseLog, type SetLog } from "@/app/types";
import { estimateOneRepMax, calcSessionVolume } from "@/app/lib/progression-engine";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ExerciseHistoryEntry {
  sessionId: string;
  date: string;
  sets: SetLog[];
  totalVolume: number;
  estimatedOneRepMax: number;
  topSetWeight: number;
  topSetReps: number;
  averageRpe: number | null;
}

export interface ExerciseHistorySummary {
  exerciseId: string;
  totalSessions: number;
  totalSets: number;
  totalVolume: number;
  currentBestWeight: number;
  currentBest1RM: number;
  allTimeBest1RM: number;
  trend: "improving" | "plateaued" | "declining" | "insufficient-data";
  history: ExerciseHistoryEntry[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function topSet(sets: SetLog[]): SetLog | null {
  if (!sets.length) return null;
  return sets.reduce((best, s) =>
    s.weightUsed > best.weightUsed ||
    (s.weightUsed === best.weightUsed && s.repsCompleted > best.repsCompleted)
      ? s
      : best
  );
}

function avgRpeFromSets(sets: SetLog[]): number | null {
  const withRpe = sets.filter((s) => s.rpe != null);
  if (!withRpe.length) return null;
  return withRpe.reduce((sum, s) => sum + (s.rpe ?? 0), 0) / withRpe.length;
}

function inferTrend(history: ExerciseHistoryEntry[]): ExerciseHistorySummary["trend"] {
  if (history.length < 3) return "insufficient-data";

  const recent = history.slice(0, 5);
  const e1rms = recent.map((h) => h.estimatedOneRepMax).filter((v) => v > 0);
  if (e1rms.length < 3) return "insufficient-data";

  const first = e1rms[e1rms.length - 1];
  const last = e1rms[0];
  const delta = ((last - first) / first) * 100;

  if (delta > 2) return "improving";
  if (delta < -2) return "declining";
  return "plateaued";
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useExerciseHistory(
  exerciseId: string,
  allLogs: ExerciseLog[],
  sessionDates: Record<string, string>
): ExerciseHistorySummary {
  return useMemo(() => {
    const exerciseLogs = allLogs
      .filter((l) => l.exerciseId === exerciseId)
      .sort(
        (a, b) =>
          new Date(b.loggedAt).getTime() - new Date(a.loggedAt).getTime()
      );

    if (!exerciseLogs.length) {
      return {
        exerciseId,
        totalSessions: 0,
        totalSets: 0,
        totalVolume: 0,
        currentBestWeight: 0,
        currentBest1RM: 0,
        allTimeBest1RM: 0,
        trend: "insufficient-data",
        history: [],
      };
    }

    const history: ExerciseHistoryEntry[] = exerciseLogs.map((log) => {
      const best = topSet(log.sets);
      const e1rm = best
        ? estimateOneRepMax(best.weightUsed, best.repsCompleted)
        : 0;
      return {
        sessionId: log.sessionId,
        date: sessionDates[log.sessionId] ?? log.loggedAt.split("T")[0],
        sets: log.sets,
        totalVolume: calcSessionVolume(log),
        estimatedOneRepMax: e1rm,
        topSetWeight: best?.weightUsed ?? 0,
        topSetReps: best?.repsCompleted ?? 0,
        averageRpe: avgRpeFromSets(log.sets),
      };
    });

    const allE1rms = history.map((h) => h.estimatedOneRepMax);
    const allTimeBest1RM = Math.max(...allE1rms, 0);
    const currentBest1RM = history[0]?.estimatedOneRepMax ?? 0;
    const currentBestWeight = history[0]?.topSetWeight ?? 0;
    const totalVolume = history.reduce((s, h) => s + h.totalVolume, 0);
    const totalSets = exerciseLogs.reduce((s, l) => s + l.sets.length, 0);

    return {
      exerciseId,
      totalSessions: exerciseLogs.length,
      totalSets,
      totalVolume: Math.round(totalVolume),
      currentBestWeight,
      currentBest1RM,
      allTimeBest1RM,
      trend: inferTrend(history),
      history,
    };
  }, [exerciseId, allLogs, sessionDates]);
}

// ─── Multi-exercise history hook (for session summary screens) ────────────────

export function useSessionHistory(
  logs: ExerciseLog[],
  sessionDates: Record<string, string>
): Record<string, ExerciseHistorySummary> {
  return useMemo(() => {
    const exerciseIds = Array.from(new Set(logs.map((l) => l.exerciseId)));
    return Object.fromEntries(
      exerciseIds.map((id) => [
        id,
        // eslint-disable-next-line react-hooks/rules-of-hooks
        (() => {
          const exerciseLogs = logs
            .filter((l) => l.exerciseId === id)
            .sort(
              (a, b) =>
                new Date(b.loggedAt).getTime() - new Date(a.loggedAt).getTime()
            );

          const history: ExerciseHistoryEntry[] = exerciseLogs.map((log) => {
            const best = topSet(log.sets);
            const e1rm = best
              ? estimateOneRepMax(best.weightUsed, best.repsCompleted)
              : 0;
            return {
              sessionId: log.sessionId,
              date: sessionDates[log.sessionId] ?? log.loggedAt.split("T")[0],
              sets: log.sets,
              totalVolume: calcSessionVolume(log),
              estimatedOneRepMax: e1rm,
              topSetWeight: best?.weightUsed ?? 0,
              topSetReps: best?.repsCompleted ?? 0,
              averageRpe: avgRpeFromSets(log.sets),
            };
          });

          const allE1rms = history.map((h) => h.estimatedOneRepMax);
          return {
            exerciseId: id,
            totalSessions: exerciseLogs.length,
            totalSets: exerciseLogs.reduce((s, l) => s + l.sets.length, 0),
            totalVolume: Math.round(
              history.reduce((s, h) => s + h.totalVolume, 0)
            ),
            currentBestWeight: history[0]?.topSetWeight ?? 0,
            currentBest1RM: history[0]?.estimatedOneRepMax ?? 0,
            allTimeBest1RM: Math.max(...allE1rms, 0),
            trend: inferTrend(history),
            history,
          } satisfies ExerciseHistorySummary;
        })(),
      ])
    );
  }, [logs, sessionDates]);
}
