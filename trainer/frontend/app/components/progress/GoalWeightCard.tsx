"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { Target, TrendingDown, TrendingUp, Minus } from "lucide-react";
import { cn } from "@/app/lib/utils";
import { type BodyWeightEntry } from "@/app/store/progressStore";

interface GoalWeightCardProps {
  logs: BodyWeightEntry[];
  goalWeightKg: number;
  unit: "kg" | "lb";
}

function fmt(kg: number, unit: "kg" | "lb") {
  return unit === "lb" ? `${Math.round(kg * 2.20462)} lb` : `${kg.toFixed(1)} kg`;
}

export function GoalWeightCard({ logs, goalWeightKg, unit }: GoalWeightCardProps) {
  const { currentKg, diffKg, weeklyRate, weeksToGoal, isAchieved, direction } = useMemo(() => {
    if (logs.length === 0) return { currentKg: 0, diffKg: 0, weeklyRate: 0, weeksToGoal: null, isAchieved: false, direction: "maintain" as const };

    const currentKg = logs[0].weightKg;
    const diffKg = goalWeightKg - currentKg;
    const isAchieved = Math.abs(diffKg) < 0.5;

    // Weekly rate from last 4 weeks of logs
    const fourWeeksAgo = new Date();
    fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);
    const recent = logs.filter((l) => new Date(l.date) >= fourWeeksAgo);

    let weeklyRate = 0;
    if (recent.length >= 2) {
      const oldest = recent[recent.length - 1];
      const newest = recent[0];
      const daysDiff = (new Date(newest.date).getTime() - new Date(oldest.date).getTime()) / 86400000;
      const totalChange = newest.weightKg - oldest.weightKg;
      weeklyRate = daysDiff > 0 ? (totalChange / daysDiff) * 7 : 0;
      weeklyRate = Math.round(weeklyRate * 100) / 100;
    }

    const direction = weeklyRate < -0.05 ? "losing" : weeklyRate > 0.05 ? "gaining" : "maintain";

    let weeksToGoal: number | null = null;
    if (!isAchieved && Math.abs(weeklyRate) > 0.05) {
      const rateTowardGoal = diffKg > 0 ? weeklyRate : -weeklyRate;
      if (rateTowardGoal > 0) {
        weeksToGoal = Math.ceil(Math.abs(diffKg) / Math.abs(weeklyRate));
      }
    }

    return { currentKg, diffKg, weeklyRate, weeksToGoal, isAchieved, direction };
  }, [logs, goalWeightKg]);

  if (logs.length === 0 || goalWeightKg <= 0) return null;

  const etaDate = weeksToGoal
    ? new Date(Date.now() + weeksToGoal * 7 * 86400000).toLocaleDateString("en-US", { month: "long", year: "numeric" })
    : null;

  const pct = useMemo(() => {
    if (logs.length < 2) return 0;
    const start = logs[logs.length - 1].weightKg;
    const current = logs[0].weightKg;
    const total = goalWeightKg - start;
    if (Math.abs(total) < 0.1) return 100;
    const progress = current - start;
    return Math.min(100, Math.max(0, Math.round((progress / total) * 100)));
  }, [logs, goalWeightKg]);

  const rateAssessment = (() => {
    const abs = Math.abs(weeklyRate);
    if (abs < 0.1) return { label: "Stalled", color: "text-amber-400 bg-amber-400/8 border-amber-400/20" };
    if (abs <= 0.75) return { label: "Optimal", color: "text-trainer-success bg-trainer-success/8 border-trainer-success/20" };
    if (abs <= 1.25) return { label: "Aggressive", color: "text-amber-400 bg-amber-400/8 border-amber-400/20" };
    return { label: "Too fast", color: "text-red-400 bg-red-400/8 border-red-400/20" };
  })();

  const TrendIcon = direction === "losing" ? TrendingDown : direction === "gaining" ? TrendingUp : Minus;
  const trendColor = direction === "losing"
    ? diffKg < 0 ? "text-trainer-success" : "text-red-400"
    : direction === "gaining"
    ? diffKg > 0 ? "text-trainer-success" : "text-red-400"
    : "text-white/40";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-trainer-surface border border-white/8 rounded-[16px] p-4"
    >
      <div className="flex items-center gap-2 mb-3">
        <Target size={13} className="text-trainer-indigo" />
        <p className="text-xs text-white/35 uppercase tracking-widest font-semibold">Goal Weight</p>
      </div>

      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-2xl font-bold text-white tabular-nums">{fmt(goalWeightKg, unit)}</p>
          {isAchieved ? (
            <p className="text-sm font-semibold text-trainer-success mt-0.5">Goal reached!</p>
          ) : (
            <p className="text-sm text-white/40 mt-0.5">
              {Math.abs(diffKg) < 0.1 ? "At goal" : `${fmt(Math.abs(diffKg), unit)} ${diffKg > 0 ? "to gain" : "to lose"}`}
            </p>
          )}
        </div>

        <div className="flex flex-col items-end gap-1.5">
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-[8px] bg-white/5">
            <TrendIcon size={13} className={trendColor} />
            <span className={cn("text-xs font-semibold tabular-nums", trendColor)}>
              {weeklyRate > 0 ? "+" : ""}{weeklyRate} {unit}/wk
            </span>
          </div>
          {!isAchieved && (
            <span className={cn("text-[9px] font-bold px-2 py-0.5 rounded-full border", rateAssessment.color)}>
              {rateAssessment.label}
            </span>
          )}
          {Math.abs(weeklyRate) >= 0.1 && !isAchieved && (
            <span className="text-[9px] text-white/20 tabular-nums">
              ~{Math.round(Math.abs(weeklyRate) * 7700 / 7)} kcal/day {weeklyRate < 0 ? "deficit" : "surplus"}
            </span>
          )}
        </div>
      </div>

      {/* Progress bar */}
      {!isAchieved && logs.length >= 2 && (
        <div className="mb-3">
          <div className="flex justify-between text-[10px] text-white/25 mb-1">
            <span>Start: {fmt(logs[logs.length - 1].weightKg, unit)}</span>
            <span>Goal: {fmt(goalWeightKg, unit)}</span>
          </div>
          <div className="h-2 bg-white/8 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-trainer-indigo rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.7, ease: "easeOut" }}
            />
          </div>
          <p className="text-[10px] text-white/30 mt-1 text-right">{pct}% of the way</p>
        </div>
      )}

      {/* ETA */}
      {etaDate && !isAchieved && (
        <div className="flex items-center gap-2 p-2.5 rounded-[10px] bg-trainer-indigo/8 border border-trainer-indigo/15">
          <div className="w-1.5 h-1.5 rounded-full bg-trainer-indigo shrink-0" />
          <p className="text-xs text-white/60">
            At current pace, reach goal by{" "}
            <span className="font-semibold text-white/80">{etaDate}</span>
            {" "}({weeksToGoal} weeks)
          </p>
        </div>
      )}

      {isAchieved && (
        <p className="text-xs text-trainer-success/70 text-center py-1">
          You&apos;re within 0.5{unit === "lb" ? " lb" : " kg"} of your goal weight
        </p>
      )}
    </motion.div>
  );
}
