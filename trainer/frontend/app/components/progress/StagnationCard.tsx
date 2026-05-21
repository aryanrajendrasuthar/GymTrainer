"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { AlertCircle, TrendingUp, ChevronRight } from "lucide-react";
import { useSessionStore } from "@/app/store/sessionStore";
import { useSettingsStore } from "@/app/store/settingsStore";
import { useUserStore } from "@/app/store/userStore";
import { exerciseMap } from "@/app/data/exercises";
import { estimateOneRepMax } from "@/app/lib/progression-engine";
import { cn } from "@/app/lib/utils";
import type { ExerciseLog } from "@/app/types";

const SUGGESTIONS: string[] = [
  "Try a 3–5 rep strength phase for 2 weeks",
  "Add one extra set per session",
  "Take a 5–7 day deload, then reset",
  "Try a variation (e.g. pause reps, tempo change)",
  "Increase rest time to 3–4 min between sets",
];

function pickSuggestion(exerciseId: string): string {
  const hash = exerciseId.split("").reduce((h, c) => h + c.charCodeAt(0), 0);
  return SUGGESTIONS[hash % SUGGESTIONS.length];
}

interface StagnantExercise {
  exerciseId: string;
  name: string;
  staleDays: number;
  currentE1RM: number;
  peakE1RM: number;
  suggestion: string;
}

function buildStagnationList(
  allLogs: ExerciseLog[],
  sessionDates: Record<string, string>,
  unit: "kg" | "lb"
): StagnantExercise[] {
  const factor = unit === "lb" ? 2.20462 : 1;
  const todayMs = Date.now();
  const eightWeeksMs = 56 * 86_400_000;

  // Group logs by exerciseId, filter to last 8 weeks
  const grouped = new Map<string, { dateMs: number; e1rm: number }[]>();
  for (const log of allLogs) {
    const dateStr = sessionDates[log.sessionId] ?? log.loggedAt?.slice(0, 10);
    if (!dateStr) continue;
    const dateMs = new Date(dateStr).getTime();
    if (todayMs - dateMs > eightWeeksMs) continue;

    let bestE1rm = 0;
    for (const s of log.sets) {
      if (s.weightUsed > 0 && s.repsCompleted > 0) {
        bestE1rm = Math.max(bestE1rm, estimateOneRepMax(s.weightUsed, s.repsCompleted));
      }
    }
    if (bestE1rm <= 0) continue;

    if (!grouped.has(log.exerciseId)) grouped.set(log.exerciseId, []);
    grouped.get(log.exerciseId)!.push({ dateMs, e1rm: bestE1rm });
  }

  const stagnant: StagnantExercise[] = [];

  grouped.forEach((rawSessions, exerciseId) => {
    if (rawSessions.length < 4) return;

    type Entry = { dateMs: number; e1rm: number };

    // Sort chronologically
    const sessions: Entry[] = [...rawSessions].sort((a: Entry, b: Entry) => a.dateMs - b.dateMs);

    const latest = sessions[sessions.length - 1];
    const threeWeeksAgoMs = todayMs - 21 * 86_400_000;

    const baseline = sessions.filter((s: Entry) => s.dateMs <= threeWeeksAgoMs);
    if (baseline.length < 2) return;
    const peakBaseline = Math.max(...baseline.map((s: Entry) => s.e1rm));

    const recent = sessions.filter((s: Entry) => s.dateMs > threeWeeksAgoMs);
    if (recent.length === 0) return;
    const peakRecent = Math.max(...recent.map((s: Entry) => s.e1rm));

    const improvement = (peakRecent - peakBaseline) / peakBaseline;
    if (improvement >= 0.025) return;

    const lastImprovementMs = (() => {
      let lastBest = 0;
      let lastMs = sessions[0].dateMs;
      for (const s of sessions) {
        if (s.e1rm > lastBest * 1.025) { lastBest = s.e1rm; lastMs = s.dateMs; }
      }
      return lastMs;
    })();
    const staleDays = Math.round((todayMs - lastImprovementMs) / 86_400_000);

    const name = exerciseMap[exerciseId]?.name ?? exerciseId.replace(/-/g, " ");
    const overallPeak = Math.max(...sessions.map((s: Entry) => s.e1rm));

    stagnant.push({
      exerciseId,
      name,
      staleDays,
      currentE1RM: Math.round(latest.e1rm * factor),
      peakE1RM: Math.round(overallPeak * factor),
      suggestion: pickSuggestion(exerciseId),
    });
  });

  return stagnant.sort((a, b) => b.staleDays - a.staleDays).slice(0, 4);
}

export function StagnationCard() {
  const { allExerciseLogs, sessionDates } = useSessionStore();
  const { settings } = useSettingsStore();
  const { profile } = useUserStore();
  const unit = (settings.weightUnit ?? profile?.units ?? "kg") as "kg" | "lb";

  const stagnant = useMemo(
    () => buildStagnationList(allExerciseLogs, sessionDates, unit),
    [allExerciseLogs, sessionDates, unit]
  );

  if (stagnant.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.06 }}
      className="bg-trainer-surface border border-white/8 rounded-[16px] p-4"
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <div className="w-7 h-7 rounded-[8px] bg-amber-400/12 flex items-center justify-center shrink-0">
          <AlertCircle size={13} className="text-amber-400" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold text-white">Plateau Detected</p>
          <p className="text-[10px] text-white/35 mt-0.5">
            {stagnant.length} exercise{stagnant.length !== 1 ? "s" : ""} with no recent progress
          </p>
        </div>
      </div>

      {/* Stagnant exercise list */}
      <div className="flex flex-col gap-2">
        {stagnant.map((ex, i) => (
          <motion.div
            key={ex.exerciseId}
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.05 + i * 0.05 }}
            className="bg-trainer-elevated rounded-[12px] p-3"
          >
            <div className="flex items-start justify-between gap-2 mb-1.5">
              <p className="text-sm font-semibold text-white leading-tight">{ex.name}</p>
              <span className={cn(
                "text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0",
                ex.staleDays >= 28
                  ? "bg-red-500/12 text-red-400"
                  : "bg-amber-400/12 text-amber-400"
              )}>
                {ex.staleDays}d stale
              </span>
            </div>

            <div className="flex items-center gap-3 mb-2">
              <div className="flex items-center gap-1">
                <TrendingUp size={10} className="text-white/30" />
                <span className="text-[10px] text-white/40 tabular-nums">
                  {ex.currentE1RM} {unit}
                </span>
              </div>
              {ex.peakE1RM > ex.currentE1RM ? (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-red-500/10 text-red-400/80 tabular-nums">
                  -{ex.peakE1RM - ex.currentE1RM} {unit} · {Math.round(((ex.peakE1RM - ex.currentE1RM) / ex.peakE1RM) * 100)}% below peak
                </span>
              ) : (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-400/10 text-amber-400/70">
                  at peak
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              <ChevronRight size={9} className="text-amber-400/60 shrink-0" />
              <p className="text-[10px] text-white/50 leading-snug">{ex.suggestion}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
