"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import type { WorkoutSession, ExerciseLog } from "@/app/types";
import { exerciseMap } from "@/app/data/exercises";
import { cn } from "@/app/lib/utils";

interface MuscleVolumeChartProps {
  sessions: WorkoutSession[];
  allLogs: ExerciseLog[];
  unit: "kg" | "lb";
}

const MUSCLE_CATEGORIES: { label: string; keywords: string[]; color: string; bg: string }[] = [
  { label: "Chest",      keywords: ["chest", "pectoralis"],                             color: "bg-rose-500",    bg: "bg-rose-500/10" },
  { label: "Back",       keywords: ["back", "latissimus", "rhomboid", "teres", "trap"], color: "bg-sky-500",     bg: "bg-sky-500/10" },
  { label: "Shoulders",  keywords: ["deltoid", "shoulder", "supraspinatus"],            color: "bg-violet-500",  bg: "bg-violet-500/10" },
  { label: "Biceps",     keywords: ["biceps", "brachialis", "brachioradialis"],         color: "bg-indigo-500",  bg: "bg-indigo-500/10" },
  { label: "Triceps",    keywords: ["triceps"],                                          color: "bg-purple-500",  bg: "bg-purple-500/10" },
  { label: "Quads",      keywords: ["quadriceps", "rectus-femoris", "vastus"],          color: "bg-amber-500",   bg: "bg-amber-500/10" },
  { label: "Hamstrings", keywords: ["hamstrings", "semimembranosus", "semitendinosus"], color: "bg-orange-500",  bg: "bg-orange-500/10" },
  { label: "Glutes",     keywords: ["gluteus", "glute"],                                color: "bg-pink-500",    bg: "bg-pink-500/10" },
  { label: "Calves",     keywords: ["gastrocnemius", "soleus", "tibialis"],             color: "bg-yellow-500",  bg: "bg-yellow-500/10" },
  { label: "Core",       keywords: ["abdominis", "oblique", "serratus", "erector"],     color: "bg-emerald-500", bg: "bg-emerald-500/10" },
];

function exercisePrimaryCategory(exerciseId: string): string | null {
  const ex = exerciseMap[exerciseId];
  if (!ex) return null;
  const muscles = ex.primaryMuscles.map((m) => m.toLowerCase());
  for (const cat of MUSCLE_CATEGORIES) {
    if (muscles.some((m) => cat.keywords.some((kw) => m.includes(kw)))) {
      return cat.label;
    }
  }
  return null;
}

export function MuscleVolumeChart({ sessions, allLogs, unit }: MuscleVolumeChartProps) {
  const sessionIds = useMemo(() => new Set(sessions.map((s) => s.id)), [sessions]);

  const volumeByCategory = useMemo(() => {
    const map = new Map<string, number>();
    MUSCLE_CATEGORIES.forEach((c) => map.set(c.label, 0));

    for (const log of allLogs) {
      if (!sessionIds.has(log.sessionId)) continue;
      const cat = exercisePrimaryCategory(log.exerciseId);
      if (!cat) continue;
      const vol = log.sets.reduce((sum, s) => sum + s.weightUsed * s.repsCompleted, 0);
      map.set(cat, (map.get(cat) ?? 0) + vol);
    }
    return map;
  }, [allLogs, sessionIds]);

  const entries = useMemo(() => {
    return MUSCLE_CATEGORIES
      .map((cat) => ({ ...cat, volume: volumeByCategory.get(cat.label) ?? 0 }))
      .filter((e) => e.volume > 0)
      .sort((a, b) => b.volume - a.volume);
  }, [volumeByCategory]);

  const maxVolume = useMemo(() => Math.max(1, ...entries.map((e) => e.volume)), [entries]);

  function formatVol(kg: number): string {
    const v = unit === "lb" ? kg * 2.20462 : kg;
    if (v >= 1000) return `${(v / 1000).toFixed(1)}k`;
    return `${Math.round(v)}`;
  }

  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 gap-2">
        <p className="text-sm text-white/30">No volume data for this period.</p>
        <p className="text-xs text-white/20">Log some workouts to see breakdown.</p>
      </div>
    );
  }

  const totalVol = entries.reduce((s, e) => s + e.volume, 0);

  return (
    <div className="flex flex-col gap-3">
      {entries.map((entry, i) => {
        const pct = entry.volume / maxVolume;
        return (
          <motion.div
            key={entry.label}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className="flex items-center gap-3"
          >
            {/* Label */}
            <div className="w-20 shrink-0">
              <p className="text-xs font-semibold text-white/65 truncate">{entry.label}</p>
            </div>
            {/* Bar */}
            <div className="flex-1 h-7 bg-white/5 rounded-full overflow-hidden">
              <motion.div
                className={cn("h-full rounded-full", entry.color)}
                initial={{ width: 0 }}
                animate={{ width: `${Math.max(pct * 100, 4)}%` }}
                transition={{ duration: 0.5, delay: i * 0.05, ease: "easeOut" }}
              />
            </div>
            {/* Value */}
            <div className="w-14 text-right shrink-0">
              <span className="text-xs font-bold text-white/55 tabular-nums">
                {formatVol(entry.volume)} {unit}
              </span>
            </div>
          </motion.div>
        );
      })}

      {entries.length > 0 && (
        <div className="flex items-center justify-between pt-2 border-t border-white/5 mt-1">
          <span className="text-[10px] text-white/25">
            Total: {formatVol(totalVol)} {unit}
          </span>
          <span className="text-[10px] text-white/25">
            {entries[0]!.label} {Math.round((entries[0]!.volume / totalVol) * 100)}% of volume
          </span>
        </div>
      )}
    </div>
  );
}
