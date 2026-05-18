"use client";

import { useEffect, useRef } from "react";
import { useUserStore } from "@/app/store/userStore";
import { useSessionStore } from "@/app/store/sessionStore";
import { useProgressStore } from "@/app/store/progressStore";
import { usePhysioStore } from "@/app/store/physioStore";
import { sessionsApi, progressApi, physioApi } from "@/app/lib/api";
import type {
  WorkoutSession,
  ExerciseLog,
  SetLog,
  RawSession,
  RawExerciseLog,
  UserInjury,
} from "@/app/types";

// ─── Mappers ──────────────────────────────────────────────────────────────────

function mapSession(raw: RawSession & { exercise_logs?: RawExerciseLog[] }): WorkoutSession {
  const exercisesCompleted: ExerciseLog[] = (raw.exercise_logs ?? []).map((el) => ({
    id: el.id,
    userId: el.user_id,
    sessionId: el.session_id,
    exerciseId: el.exercise_id,
    loggedAt: el.logged_at,
    sets: (el.set_logs ?? []).map((s) => ({
      setNumber: s.set_number,
      repsCompleted: s.reps_completed,
      weightUsed: s.weight_used,
      weightUnit: s.weight_unit,
      rpe: s.rpe,
      notes: s.notes,
      loggedAt: s.logged_at,
    } satisfies SetLog)),
  }));

  return {
    id: raw.id,
    userId: raw.user_id,
    date: raw.date,
    splitDay: raw.split_day,
    exercisesCompleted,
    totalVolumeKg: raw.total_volume_kg,
    durationMinutes: raw.duration_minutes,
    sessionNotes: raw.session_notes,
    completedAt: raw.completed_at,
    isPartial: raw.is_partial,
  };
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useDataSync() {
  const { isAuthenticated, accessToken } = useUserStore();
  const { setRecentSessions, setAllExerciseLogs, sessionDates } = useSessionStore();
  const { setWeightLogs } = useProgressStore();
  const { setInjuries } = usePhysioStore();
  const syncedRef = useRef(false);

  useEffect(() => {
    if (!isAuthenticated || !accessToken) {
      syncedRef.current = false;
      return;
    }

    // Only sync once per auth session (not on every re-render)
    if (syncedRef.current) return;
    syncedRef.current = true;

    async function sync() {
      if (!accessToken) return;

      // Fetch sessions with their exercise/set logs
      try {
        const { sessions: rawSessions } = await sessionsApi.list(accessToken, 50);

        // Fetch full detail (with set_logs) for sessions we don't have locally
        const localIds = new Set(Object.keys(sessionDates));
        const newRaw = rawSessions.filter((s) => !localIds.has(s.id));

        if (newRaw.length > 0) {
          const detailed = await Promise.all(
            newRaw.map((s) => sessionsApi.get(accessToken!, s.id).catch(() => null))
          );

          const mapped: WorkoutSession[] = detailed
            .filter((d): d is NonNullable<typeof d> => d !== null)
            .map(mapSession);

          if (mapped.length > 0) {
            const allLogs = mapped.flatMap((s) => s.exercisesCompleted);
            setRecentSessions(mapped);
            setAllExerciseLogs(allLogs);
          }
        }
      } catch {
        // Offline or API error — local store is source of truth
      }

      // Fetch body weight logs
      try {
        const { logs } = await progressApi.getWeightLogs(accessToken, 90);
        if (logs.length > 0) {
          setWeightLogs(
            logs.map((l) => ({
              date: l.logged_at.split("T")[0],
              weightKg: l.weight_kg,
            }))
          );
        }
      } catch {
        // silently ignore
      }

      // Fetch active injuries
      try {
        const { injuries } = await physioApi.getInjuries(accessToken);
        if (injuries.length > 0) {
          const mapped: UserInjury[] = injuries.map((inj: Record<string, unknown>) => ({
            condition: inj.condition as UserInjury["condition"],
            bodyRegion: (inj.body_region as string) ?? "",
            severity: (inj.severity as UserInjury["severity"]) ?? "mild",
            onsetDate: (inj.onset_date as string) ?? new Date().toISOString().split("T")[0],
            phase: (inj.phase as UserInjury["phase"]) ?? "subacute",
            backendId: inj.id as string,
          }));
          setInjuries(mapped);
        }
      } catch {
        // silently ignore
      }
    }

    sync();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, accessToken]);
}
