"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { Activity } from "lucide-react";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { exerciseMap } from "@/app/data/exercises";
import type { WorkoutSession, ExerciseLog } from "@/app/types";

interface Props {
  sessions: WorkoutSession[];
  allLogs: ExerciseLog[];
}

const MUSCLE_GROUPS = [
  { key: "Chest", muscles: ["chest", "pectoralis-major", "pectoralis-minor", "pectoralis-major-upper", "pectoralis-major-lower"] },
  { key: "Back", muscles: ["back", "lats", "latissimus-dorsi", "rhomboids", "trapezius", "traps", "rear-delts", "teres-major", "teres-minor", "erector-spinae", "lower-back"] },
  { key: "Legs", muscles: ["quads", "quadriceps", "hamstrings", "glutes", "gluteus-maximus", "calves", "gastrocnemius", "soleus", "adductors", "hip-flexors", "legs"] },
  { key: "Shoulders", muscles: ["shoulders", "deltoids", "anterior-deltoid", "lateral-deltoid", "posterior-deltoid", "medial-deltoid", "deltoid"] },
  { key: "Arms", muscles: ["biceps", "biceps-brachii", "triceps", "triceps-brachii", "brachialis", "forearms"] },
  { key: "Core", muscles: ["core", "abs", "abdominals", "obliques", "rectus-abdominis", "transverse-abdominis", "serratus"] },
] as const;

type GroupKey = (typeof MUSCLE_GROUPS)[number]["key"];

export function MuscleBalanceChart({ sessions, allLogs }: Props) {
  const data = useMemo(() => {
    const totals: Record<GroupKey, number> = {
      Chest: 0, Back: 0, Legs: 0, Shoulders: 0, Arms: 0, Core: 0,
    };

    const sessionIdSet = new Set(sessions.map((s) => s.id));
    const relevantLogs = allLogs.filter((l) => sessionIdSet.has(l.sessionId));

    for (const log of relevantLogs) {
      const ex = exerciseMap[log.exerciseId];
      if (!ex) continue;
      const setCount = log.sets.length;
      for (const m of ex.primaryMuscles) {
        const group = MUSCLE_GROUPS.find((g) =>
          (g.muscles as readonly string[]).includes(m.toLowerCase())
        );
        if (group) {
          totals[group.key as GroupKey] += setCount;
        }
      }
    }

    const max = Math.max(1, ...Object.values(totals));
    return MUSCLE_GROUPS.map((g) => ({
      group: g.key,
      sets: totals[g.key as GroupKey],
      value: Math.round((totals[g.key as GroupKey] / max) * 100),
    }));
  }, [sessions, allLogs]);

  const totalSets = data.reduce((sum, d) => sum + d.sets, 0);

  if (totalSets === 0) {
    return (
      <div className="bg-trainer-surface border border-white/8 rounded-[16px] p-4 flex items-center gap-3">
        <Activity size={16} className="text-white/25 shrink-0" />
        <p className="text-sm text-white/30">Log workouts to see your muscle balance.</p>
      </div>
    );
  }

  const imbalanced = data.filter((d) => d.sets === 0).map((d) => d.group);
  const sortedByValue = [...data].sort((a, b) => a.value - b.value);
  const dominantGroup = data.reduce((a, b) => (a.value > b.value ? a : b));
  const laggingGroup = sortedByValue.find((d) => d.sets > 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-trainer-surface border border-white/8 rounded-[16px] p-4"
    >
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <Activity size={13} className="text-trainer-indigo" />
          <p className="text-xs text-white/35 uppercase tracking-widest font-semibold">Muscle Balance</p>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[9px] text-white/20 tabular-nums">{sessions.length} sessions</span>
          <span className="text-[10px] font-bold text-trainer-indigo/70 bg-trainer-indigo/8 border border-trainer-indigo/15 px-2 py-0.5 rounded-full tabular-nums">
            {totalSets} sets
          </span>
        </div>
      </div>
      <p className="text-[10px] text-white/20 mb-4">Sets per muscle group — selected period</p>

      <ResponsiveContainer width="100%" height={210}>
        <RadarChart data={data} margin={{ top: 8, right: 16, bottom: 8, left: 16 }}>
          <PolarGrid
            gridType="polygon"
            stroke="rgba(255,255,255,0.07)"
          />
          <PolarAngleAxis
            dataKey="group"
            tick={{ fontSize: 10, fill: "rgba(255,255,255,0.4)", fontWeight: 600 }}
          />
          <Radar
            name="Sets"
            dataKey="value"
            stroke="#6c63ff"
            fill="#6c63ff"
            fillOpacity={0.18}
            strokeWidth={1.5}
            dot={{ r: 3, fill: "#6c63ff", strokeWidth: 0 }}
          />
          <Tooltip
            contentStyle={{
              background: "#1a1a2e",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 8,
              fontSize: 11,
            }}
            formatter={(_, __, props) => [
              `${props.payload?.sets ?? 0} sets`,
              props.payload?.group,
            ]}
            labelFormatter={() => ""}
          />
        </RadarChart>
      </ResponsiveContainer>

      {/* Set counts legend */}
      <div className="grid grid-cols-3 gap-1.5 mt-3">
        {data.map((d) => (
          <div key={d.group} className="flex items-center gap-1.5">
            <div
              className="w-1.5 h-1.5 rounded-full shrink-0"
              style={{ background: d.value >= 60 ? "#6c63ff" : d.value >= 30 ? "#f59e0b" : "rgba(255,255,255,0.2)" }}
            />
            <span className="text-[10px] text-white/40">{d.group}</span>
            <span className="text-[10px] font-bold text-white/60 tabular-nums ml-auto">{d.sets}s</span>
          </div>
        ))}
      </div>

      {laggingGroup && dominantGroup && dominantGroup.group !== laggingGroup.group && (
        <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/5">
          <span className="text-[10px] text-white/25">
            Dominant: <span className="text-trainer-indigo font-semibold">{dominantGroup.group}</span>
          </span>
          <span className="text-[10px] text-white/25">
            Lagging: <span className="text-amber-400 font-semibold">{laggingGroup.group}</span>
          </span>
        </div>
      )}
      {imbalanced.length > 0 && (
        <p className="text-[9px] text-amber-400/60 mt-2">
          No sets for: {imbalanced.join(", ")} — consider adding variety.
        </p>
      )}
    </motion.div>
  );
}
