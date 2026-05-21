"use client";

import { motion } from "framer-motion";
import { Trophy } from "lucide-react";
import { cn } from "@/app/lib/utils";

// Standards as bodyweight multipliers — sourced from ExRx strength standards
// [untrained, novice, intermediate, advanced, elite]
const STANDARDS: Record<string, {
  name: string;
  exerciseId: string;
  male: [number, number, number, number, number];
  female: [number, number, number, number, number];
}> = {
  "barbell-bench-press": {
    name: "Bench Press",
    exerciseId: "barbell-bench-press",
    male:   [0.50, 0.75, 1.00, 1.25, 1.50],
    female: [0.25, 0.50, 0.65, 0.85, 1.00],
  },
  "barbell-squat": {
    name: "Back Squat",
    exerciseId: "barbell-squat",
    male:   [0.75, 1.25, 1.50, 2.00, 2.50],
    female: [0.50, 0.75, 1.00, 1.25, 1.50],
  },
  "barbell-deadlift": {
    name: "Deadlift",
    exerciseId: "barbell-deadlift",
    male:   [1.00, 1.50, 2.00, 2.50, 3.00],
    female: [0.50, 1.00, 1.25, 1.75, 2.00],
  },
  "overhead-press": {
    name: "Overhead Press",
    exerciseId: "overhead-press",
    male:   [0.35, 0.55, 0.75, 1.00, 1.20],
    female: [0.20, 0.35, 0.45, 0.60, 0.75],
  },
  "barbell-bent-over-row": {
    name: "Barbell Row",
    exerciseId: "barbell-bent-over-row",
    male:   [0.50, 0.75, 1.00, 1.25, 1.50],
    female: [0.35, 0.50, 0.65, 0.85, 1.00],
  },
};

const LEVELS = ["Untrained", "Novice", "Intermediate", "Advanced", "Elite"] as const;
const LEVEL_COLORS = [
  "bg-white/20",
  "bg-sky-400",
  "bg-trainer-indigo",
  "bg-amber-400",
  "bg-trainer-success",
] as const;

const TEXT_COLORS = [
  "text-white/40",
  "text-sky-400",
  "text-trainer-indigo",
  "text-amber-400",
  "text-trainer-success",
] as const;

function getLevelIndex(ratio: number, thresholds: [number,number,number,number,number]): number {
  for (let i = 4; i >= 0; i--) {
    if (ratio >= thresholds[i]) return i;
  }
  return -1; // below untrained
}

interface StrengthStandardsCardProps {
  userBodyweightKg: number;
  gender: "male" | "female" | "other";
  // Map from exerciseId to best e1RM (kg)
  e1RMByExercise: Record<string, number>;
}

export function StrengthStandardsCard({
  userBodyweightKg,
  gender,
  e1RMByExercise,
}: StrengthStandardsCardProps) {
  const effectiveGender = gender === "other" ? "male" : gender;
  const bw = userBodyweightKg;

  const rows = Object.values(STANDARDS).map((s) => {
    const e1rm = e1RMByExercise[s.exerciseId] ?? 0;
    const ratio = bw > 0 && e1rm > 0 ? e1rm / bw : 0;
    const thresholds = s[effectiveGender];
    const levelIdx = getLevelIndex(ratio, thresholds);
    const nextThreshold = levelIdx < 4 ? thresholds[levelIdx + 1] : null;
    const currentThreshold = levelIdx >= 0 ? thresholds[levelIdx] : 0;
    // Progress within current level (0–1)
    const withinLevel = nextThreshold
      ? Math.min(1, (ratio - currentThreshold) / (nextThreshold - currentThreshold))
      : 1;

    return { ...s, e1rm, ratio, levelIdx, withinLevel, thresholds, nextThreshold };
  });

  // Only show if user has at least one lift logged
  if (rows.every((r) => r.e1rm === 0)) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-trainer-surface border border-white/8 rounded-[16px] p-4"
    >
      {(() => {
        const loggedRows = rows.filter((r) => r.e1rm > 0);
        const levelCounts = [0, 0, 0, 0, 0];
        loggedRows.forEach((r) => { if (r.levelIdx >= 0) levelCounts[r.levelIdx]++; });
        const topLevelIdx = levelCounts.reduce((best, count, i) => count > levelCounts[best] ? i : best, 0);
        const overallLabel = loggedRows.length > 0 && levelCounts[topLevelIdx] > 0 ? LEVELS[topLevelIdx] : null;
        const aboveIntCount = loggedRows.filter((r) => r.levelIdx >= 2).length;
        return (
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Trophy size={14} className="text-amber-400" />
              <p className="text-xs text-white/35 uppercase tracking-widest font-semibold">
                Strength Standards
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              {loggedRows.length > 0 && (
                <span className="text-[10px] font-bold text-white/30 bg-white/5 border border-white/10 px-1.5 py-0.5 rounded-full tabular-nums">
                  {aboveIntCount}/{loggedRows.length} ≥ Int
                </span>
              )}
              {overallLabel && (
                <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border", TEXT_COLORS[topLevelIdx], "bg-white/5 border-white/10")}>
                  Overall: {overallLabel}
                </span>
              )}
            </div>
          </div>
        );
      })()}

      <div className="flex flex-col gap-4">
        {rows.map((row, i) => {
          if (row.e1rm === 0) return null;
          const levelLabel = row.levelIdx >= 0 ? LEVELS[row.levelIdx] : "Below Untrained";
          const levelColor = row.levelIdx >= 0 ? TEXT_COLORS[row.levelIdx] : "text-white/25";
          const nextLabel = row.levelIdx < 4 ? LEVELS[row.levelIdx + 1] : null;
          const kgToNext = row.nextThreshold
            ? Math.ceil(row.nextThreshold * bw - row.e1rm)
            : null;

          return (
            <motion.div
              key={row.exerciseId}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.06 }}
            >
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-sm font-semibold text-white/80">{row.name}</p>
                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <p className="text-xs font-bold text-white/60 tabular-nums">{Math.round(row.e1rm)} kg</p>
                    {row.ratio > 0 && (
                      <p className="text-[9px] text-white/25 tabular-nums">{row.ratio.toFixed(2)}× BW</p>
                    )}
                  </div>
                  <span className={cn("text-xs font-bold", levelColor)}>{levelLabel}</span>
                </div>
              </div>

              {/* Segmented progress bar */}
              <div className="flex gap-0.5 h-2">
                {LEVELS.map((_, li) => {
                  const filled = li < row.levelIdx;
                  const current = li === row.levelIdx;
                  return (
                    <div key={li} className="flex-1 rounded-full overflow-hidden bg-white/8">
                      {(filled || current) && (
                        <motion.div
                          className={cn("h-full rounded-full", LEVEL_COLORS[li])}
                          initial={{ width: 0 }}
                          animate={{ width: filled ? "100%" : `${row.withinLevel * 100}%` }}
                          transition={{ duration: 0.6, delay: i * 0.06 + li * 0.04 }}
                        />
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Next level hint */}
              {nextLabel && kgToNext !== null && kgToNext > 0 && (
                <p className="text-[10px] text-white/25 mt-1">
                  +{kgToNext} kg to <span className="text-white/40">{nextLabel}</span>
                </p>
              )}
            </motion.div>
          );
        })}
      </div>

      <p className="text-[10px] text-white/15 mt-4">Based on ExRx strength standards · bodyweight ratio method</p>
    </motion.div>
  );
}
