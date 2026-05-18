"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { Zap, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useSessionStore } from "@/app/store/sessionStore";
import { useSettingsStore } from "@/app/store/settingsStore";
import { useUserStore } from "@/app/store/userStore";
import { exerciseMap } from "@/app/data/exercises";
import { estimateOneRepMax } from "@/app/lib/progression-engine";
import { formatVolume } from "@/app/lib/utils";
import type { ExerciseLog } from "@/app/types";

interface PR {
  exerciseId: string;
  exerciseName: string;
  weight: number;
  reps: number;
  e1rm: number;
  date: string;
}

function computeRecentPRs(allLogs: ExerciseLog[]): PR[] {
  const bestMap = new Map<string, { e1rm: number; weight: number; reps: number; date: string }>();

  // Build all-time best first
  for (const log of allLogs) {
    if (!log.sets.length) continue;
    const topSet = log.sets.reduce((b, s) =>
      estimateOneRepMax(s.weightUsed, s.repsCompleted) > estimateOneRepMax(b.weightUsed, b.repsCompleted) ? s : b
    );
    const e1rm = estimateOneRepMax(topSet.weightUsed, topSet.repsCompleted);
    const existing = bestMap.get(log.exerciseId);
    if (!existing || e1rm > existing.e1rm) {
      bestMap.set(log.exerciseId, {
        e1rm,
        weight: topSet.weightUsed,
        reps: topSet.repsCompleted,
        date: log.loggedAt.split("T")[0],
      });
    }
  }

  return Array.from(bestMap.entries())
    .filter(([id]) => !!exerciseMap[id])
    .sort((a, b) => new Date(b[1].date).getTime() - new Date(a[1].date).getTime())
    .slice(0, 8)
    .map(([id, data]) => ({
      exerciseId: id,
      exerciseName: exerciseMap[id]!.name,
      weight: data.weight,
      reps: data.reps,
      e1rm: Math.round(data.e1rm * 10) / 10,
      date: data.date,
    }));
}

export function RecentPRsCard() {
  const { allExerciseLogs } = useSessionStore();
  const { settings } = useSettingsStore();
  const { profile } = useUserStore();
  const unit = (settings.weightUnit ?? profile?.units ?? "kg") as "kg" | "lb";

  const prs = useMemo(() => computeRecentPRs(allExerciseLogs), [allExerciseLogs]);

  if (prs.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.08 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-[7px] bg-yellow-500/15 flex items-center justify-center">
            <Zap size={12} className="text-yellow-400" />
          </div>
          <p className="text-sm font-bold text-white">Personal Records</p>
        </div>
        <Link
          href="/progress"
          className="flex items-center gap-0.5 text-xs text-trainer-indigo/70 hover:text-trainer-indigo transition-colors"
        >
          All records
          <ChevronRight size={13} />
        </Link>
      </div>

      {/* Horizontal scroll */}
      <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1 -mx-5 px-5">
        {prs.map((pr, i) => (
          <motion.div
            key={pr.exerciseId}
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className="shrink-0 w-[140px] rounded-[14px] bg-trainer-surface border border-white/8 p-3.5"
          >
            {/* e1RM */}
            <div className="flex items-center gap-1.5 mb-2">
              <span className="text-lg font-black text-white tabular-nums leading-none">
                {formatVolume(pr.e1rm, unit)}
              </span>
              <span className="text-[9px] text-yellow-400 font-bold bg-yellow-400/10 px-1.5 py-0.5 rounded-full">
                e1RM
              </span>
            </div>

            {/* Name */}
            <p className="text-[11px] font-semibold text-white/70 leading-tight line-clamp-2 mb-2">
              {pr.exerciseName}
            </p>

            {/* Best set */}
            <p className="text-[10px] text-white/35">
              {formatVolume(pr.weight, unit)} × {pr.reps}
            </p>

            {/* Date */}
            <p className="text-[9px] text-white/20 mt-1">
              {new Date(pr.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            </p>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
