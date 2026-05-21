"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { Activity } from "lucide-react";
import { type WorkoutSession, type ExerciseLog } from "@/app/types";
import { exerciseMap } from "@/app/data/exercises";
import { cn } from "@/app/lib/utils";

// Evidence-based weekly set ranges (Israetel / Renaissance Periodization)
const TARGETS: Record<string, { label: string; mev: number; mav: number; mrv: number }> = {
  chest:      { label: "Chest",      mev: 8,  mav: 12, mrv: 22 },
  back:       { label: "Back",       mev: 10, mav: 16, mrv: 25 },
  shoulders:  { label: "Shoulders",  mev: 6,  mav: 16, mrv: 26 },
  biceps:     { label: "Biceps",     mev: 6,  mav: 14, mrv: 26 },
  triceps:    { label: "Triceps",    mev: 4,  mav: 12, mrv: 20 },
  quads:      { label: "Quads",      mev: 6,  mav: 14, mrv: 20 },
  hamstrings: { label: "Hamstrings", mev: 4,  mav: 10, mrv: 20 },
  glutes:     { label: "Glutes",     mev: 4,  mav: 12, mrv: 20 },
  calves:     { label: "Calves",     mev: 6,  mav: 10, mrv: 16 },
  core:       { label: "Core",       mev: 4,  mav: 10, mrv: 20 },
};

// Map detailed MuscleGroup → simplified key
const MUSCLE_MAP: Record<string, string> = {
  "pectoralis-major-upper": "chest",
  "pectoralis-major-lower": "chest",
  "pectoralis-minor":       "chest",
  "latissimus-dorsi":       "back",
  "rhomboids":              "back",
  "teres-major":            "back",
  "teres-minor":            "back",
  "erector-spinae-upper":   "back",
  "erector-spinae-lower":   "back",
  "anterior-deltoid":       "shoulders",
  "lateral-deltoid":        "shoulders",
  "posterior-deltoid":      "shoulders",
  "biceps-brachii-long":    "biceps",
  "biceps-brachii-short":   "biceps",
  "brachialis":             "biceps",
  "triceps-long":           "triceps",
  "triceps-lateral":        "triceps",
  "triceps-medial":         "triceps",
  "quadriceps-rectus-femoris":    "quads",
  "quadriceps-vastus-lateralis":  "quads",
  "quadriceps-vastus-medialis":   "quads",
  "quadriceps-vastus-intermedius":"quads",
  "hamstrings-biceps-femoris":    "hamstrings",
  "hamstrings-semimembranosus":   "hamstrings",
  "hamstrings-semitendinosus":    "hamstrings",
  "gluteus-maximus":  "glutes",
  "gluteus-medius":   "glutes",
  "gluteus-minimus":  "glutes",
  "gastrocnemius":    "calves",
  "soleus":           "calves",
  "rectus-abdominis-upper": "core",
  "rectus-abdominis-lower": "core",
  "obliques":               "core",
};

interface Props {
  sessions: WorkoutSession[];
  allLogs: ExerciseLog[];
}

export function MuscleVolumeTargetsCard({ sessions, allLogs }: Props) {
  const weeklySetsByMuscle = useMemo(() => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 7);
    cutoff.setHours(0, 0, 0, 0);

    const recentSessionIds = new Set(
      sessions.filter((s) => new Date(s.date) >= cutoff).map((s) => s.id)
    );

    const counts: Record<string, number> = {};
    for (const log of allLogs) {
      if (!recentSessionIds.has(log.sessionId)) continue;
      const ex = exerciseMap[log.exerciseId];
      if (!ex) continue;
      const muscles = new Set([...ex.primaryMuscles, ...ex.secondaryMuscles]);
      const mapped = new Set<string>();
      muscles.forEach((m) => {
        const key = MUSCLE_MAP[m as string];
        if (key) mapped.add(key);
      });
      mapped.forEach((key) => {
        counts[key] = (counts[key] ?? 0) + log.sets.length;
      });
    }
    return counts;
  }, [sessions, allLogs]);

  const rows = useMemo(() => {
    return Object.entries(TARGETS).map(([key, t]) => ({
      key,
      ...t,
      sets: weeklySetsByMuscle[key] ?? 0,
    }));
  }, [weeklySetsByMuscle]);

  const anyData = rows.some((r) => r.sets > 0);

  function statusLabel(sets: number, mev: number, mav: number, mrv: number): { text: string; color: string } {
    if (sets === 0)          return { text: "None",    color: "text-white/25" };
    if (sets < mev)          return { text: "Below MEV", color: "text-red-400" };
    if (sets <= mav)         return { text: "Good",    color: "text-trainer-success" };
    if (sets <= mrv)         return { text: "High",    color: "text-amber-400" };
    return                          { text: "Exceeds MRV", color: "text-red-400" };
  }

  function barColor(sets: number, mev: number, mav: number, mrv: number): string {
    if (sets === 0)    return "bg-white/8";
    if (sets < mev)    return "bg-red-500/50";
    if (sets <= mav)   return "bg-trainer-success";
    if (sets <= mrv)   return "bg-amber-400";
    return                    "bg-red-500";
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-trainer-surface border border-white/8 rounded-[16px] p-4"
    >
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <Activity size={13} className="text-trainer-indigo" />
          <p className="text-xs text-white/35 font-semibold uppercase tracking-widest">
            Weekly Volume Targets
          </p>
        </div>
        {anyData && (() => {
          const onTrack = rows.filter((r) => r.sets >= r.mev).length;
          const exceedsMRV = rows.filter((r) => r.sets > r.mrv).length;
          return (
            <div className="flex items-center gap-1.5">
              {exceedsMRV > 0 && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full border text-red-400 bg-red-400/8 border-red-400/20">
                  {exceedsMRV} &gt;MRV
                </span>
              )}
              <span className={cn(
                "text-[10px] font-bold px-2 py-0.5 rounded-full border",
                onTrack >= rows.length * 0.7
                  ? "text-trainer-success bg-trainer-success/8 border-trainer-success/20"
                  : "text-amber-400 bg-amber-400/8 border-amber-400/20"
              )}>
                {onTrack}/{rows.length} on track
              </span>
            </div>
          );
        })()}
      </div>
      <p className="text-[10px] text-white/20 mb-4">
        Sets per muscle group · last 7 days vs research targets
      </p>

      {!anyData ? (
        <p className="text-sm text-white/25 text-center py-4">
          Log workouts this week to see your volume breakdown
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {rows.map((r, i) => {
            const cap = r.mrv * 1.2;
            const pct = Math.min(1, r.sets / cap);
            const mavPct = r.mav / cap;
            const mrvPct = r.mrv / cap;
            const { text, color } = statusLabel(r.sets, r.mev, r.mav, r.mrv);

            return (
              <motion.div
                key={r.key}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-white/70">{r.label}</span>
                  <div className="flex items-center gap-2">
                    <span className={cn("text-[10px] font-semibold", color)}>{text}</span>
                    <span className="text-[10px] text-white/30 tabular-nums">
                      {r.sets}/{r.mav}s
                    </span>
                  </div>
                </div>
                {/* Track with MEV / MAV markers */}
                <div className="relative h-1.5 bg-white/6 rounded-full overflow-visible">
                  {/* MEV marker */}
                  <div
                    className="absolute top-0 bottom-0 w-px bg-white/15 z-10"
                    style={{ left: `${(r.mev / cap) * 100}%` }}
                  />
                  {/* MAV marker */}
                  <div
                    className="absolute top-0 bottom-0 w-px bg-white/25 z-10"
                    style={{ left: `${mavPct * 100}%` }}
                  />
                  {/* MRV marker */}
                  <div
                    className="absolute top-0 bottom-0 w-px bg-red-500/40 z-10"
                    style={{ left: `${mrvPct * 100}%` }}
                  />
                  {/* Fill */}
                  <motion.div
                    className={cn("h-full rounded-full", barColor(r.sets, r.mev, r.mav, r.mrv))}
                    initial={{ width: 0 }}
                    animate={{ width: `${pct * 100}%` }}
                    transition={{ duration: 0.6, ease: "easeOut", delay: i * 0.04 }}
                  />
                </div>
              </motion.div>
            );
          })}

          {/* Legend */}
          <div className="flex items-center gap-3 mt-1 pt-3 border-t border-white/5">
            <div className="flex items-center gap-1.5">
              <div className="w-px h-3 bg-white/20" />
              <span className="text-[9px] text-white/25">MEV</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-px h-3 bg-white/30" />
              <span className="text-[9px] text-white/25">MAV</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-px h-3 bg-red-500/40" />
              <span className="text-[9px] text-white/25">MRV</span>
            </div>
            <span className="text-[9px] text-white/20 ml-auto">
              MEV = minimum · MAV = optimal · MRV = maximum
            </span>
          </div>
        </div>
      )}
    </motion.div>
  );
}
