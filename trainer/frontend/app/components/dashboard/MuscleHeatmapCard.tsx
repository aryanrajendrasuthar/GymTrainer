"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { Flame } from "lucide-react";
import { useSessionStore } from "@/app/store/sessionStore";
import { exerciseMap } from "@/app/data/exercises";
import { cn } from "@/app/lib/utils";

interface MuscleStatus {
  label: string;
  hoursAgo: number | null;
}

const DISPLAY_GROUPS: { key: string; label: string; aliases: string[] }[] = [
  { key: "chest",      label: "Chest",      aliases: ["chest", "pectoralis-major-upper", "pectoralis-major-lower", "pectoralis-minor"] },
  { key: "back",       label: "Back",       aliases: ["back", "lats", "latissimus-dorsi", "rhomboids", "teres-major"] },
  { key: "shoulders",  label: "Shoulders",  aliases: ["shoulders", "anterior-deltoid", "lateral-deltoid", "posterior-deltoid"] },
  { key: "biceps",     label: "Biceps",     aliases: ["biceps", "biceps-brachii-long", "biceps-brachii-short", "brachialis"] },
  { key: "triceps",    label: "Triceps",    aliases: ["triceps", "triceps-long", "triceps-lateral", "triceps-medial"] },
  { key: "quads",      label: "Quads",      aliases: ["quads", "quadriceps-rectus-femoris", "quadriceps-vastus-lateralis", "quadriceps-vastus-medialis"] },
  { key: "hamstrings", label: "Hamstrings", aliases: ["hamstrings", "hamstrings-biceps-femoris", "hamstrings-semimembranosus"] },
  { key: "glutes",     label: "Glutes",     aliases: ["glutes", "gluteus-maximus", "gluteus-medius"] },
  { key: "core",       label: "Core",       aliases: ["core", "abs", "rectus-abdominis-upper", "rectus-abdominis-lower", "obliques"] },
  { key: "calves",     label: "Calves",     aliases: ["calves", "gastrocnemius", "soleus"] },
  { key: "traps",      label: "Traps",      aliases: ["traps", "upper-trapezius", "lower-trapezius"] },
  { key: "forearms",   label: "Forearms",   aliases: ["forearms", "forearm-flexors", "forearm-extensors", "brachioradialis"] },
];

function getStatusColor(hoursAgo: number | null): { bg: string; text: string; label: string } {
  if (hoursAgo === null) return { bg: "bg-white/6",              text: "text-white/25", label: "Rested" };
  if (hoursAgo < 24)    return { bg: "bg-trainer-danger/25",     text: "text-trainer-danger",  label: `${Math.round(hoursAgo)}h ago` };
  if (hoursAgo < 48)    return { bg: "bg-trainer-warning/25",    text: "text-trainer-warning", label: `${Math.round(hoursAgo)}h ago` };
  return                       { bg: "bg-trainer-success/18",    text: "text-trainer-success", label: "Recovered" };
}

export function MuscleHeatmapCard() {
  const { recentSessions, allExerciseLogs } = useSessionStore();

  const muscleStatus = useMemo<Map<string, number>>(() => {
    const result = new Map<string, number>();
    const now = Date.now();
    const cutoff72h = now - 72 * 60 * 60 * 1000;

    const recentLogs = allExerciseLogs.filter((log) => {
      const t = new Date(log.loggedAt).getTime();
      return t >= cutoff72h;
    });

    for (const log of recentLogs) {
      const ex = exerciseMap[log.exerciseId];
      if (!ex) continue;
      const hoursAgo = (now - new Date(log.loggedAt).getTime()) / (1000 * 60 * 60);
      const muscles = [...ex.primaryMuscles, ...ex.secondaryMuscles];
      for (const m of muscles) {
        const existing = result.get(m);
        if (existing === undefined || hoursAgo < existing) {
          result.set(m, hoursAgo);
        }
      }
    }

    return result;
  }, [allExerciseLogs]);

  const groups = useMemo<(MuscleStatus & { key: string; label: string })[]>(() => {
    return DISPLAY_GROUPS.map((g) => {
      let best: number | null = null;
      for (const alias of g.aliases) {
        const h = muscleStatus.get(alias);
        if (h !== undefined && (best === null || h < best)) {
          best = h;
        }
      }
      return { key: g.key, label: g.label, hoursAgo: best };
    });
  }, [muscleStatus]);

  const hasRecentActivity = groups.some((g) => g.hoursAgo !== null && g.hoursAgo < 72);

  if (recentSessions.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.12 }}
      className="rounded-[20px] bg-trainer-surface border border-white/8 p-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-[8px] bg-trainer-danger/12 flex items-center justify-center">
            <Flame size={14} className="text-trainer-danger" />
          </div>
          <p className="text-sm font-bold text-white">Muscle Recovery</p>
        </div>
        {!hasRecentActivity && (
          <span className="text-[10px] text-trainer-success font-semibold bg-trainer-success/10 px-2 py-0.5 rounded-full">
            All recovered
          </span>
        )}
      </div>

      {/* Legend */}
      <div className="flex gap-4 mb-4">
        {[
          { color: "bg-trainer-danger/60", label: "< 24h" },
          { color: "bg-trainer-warning/60", label: "24–48h" },
          { color: "bg-trainer-success/50", label: "Recovered" },
          { color: "bg-white/10", label: "Not trained" },
        ].map((l) => (
          <div key={l.label} className="flex items-center gap-1.5">
            <span className={cn("w-2.5 h-2.5 rounded-full shrink-0", l.color)} />
            <span className="text-[9px] text-white/35 font-medium">{l.label}</span>
          </div>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-4 gap-2">
        {groups.map((g, i) => {
          const status = getStatusColor(g.hoursAgo);
          return (
            <motion.div
              key={g.key}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.03 }}
              className={cn(
                "rounded-[10px] p-2.5 flex flex-col gap-1",
                status.bg
              )}
            >
              <p className={cn("text-[11px] font-bold leading-none", status.text)}>
                {g.label}
              </p>
              <p className="text-[9px] text-white/30 leading-none">
                {status.label}
              </p>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
