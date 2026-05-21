"use client";

import { motion } from "framer-motion";
import { Flame, Calendar } from "lucide-react";
import { useCountUp } from "@/app/hooks/useCountUp";
import { cn } from "@/app/lib/utils";

interface StreakCardProps {
  streak: number;
  weekSessionCount: number;
  totalSessions: number;
}

const MILESTONES = [7, 14, 21, 30, 60, 90, 100, 180, 365];

export function StreakCard({ streak, weekSessionCount, totalSessions }: StreakCardProps) {
  const streakIsActive = streak > 0;
  const animatedStreak = useCountUp(streak, 700, 200);
  const animatedTotal = useCountUp(totalSessions, 800, 350);

  const nextMilestone = MILESTONES.find((m) => m > streak) ?? null;
  const prevMilestone = MILESTONES.filter((m) => m <= streak).at(-1) ?? 0;
  const milestoneProgress = nextMilestone
    ? (streak - prevMilestone) / (nextMilestone - prevMilestone)
    : 1;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="rounded-[16px] bg-trainer-surface border border-white/8 p-4 flex-1 relative overflow-hidden"
    >
      {/* Warm ambient glow when streak is active */}
      {streakIsActive && (
        <motion.div
          className="absolute -top-4 -left-4 w-20 h-20 rounded-full bg-trainer-warning/15 blur-xl pointer-events-none"
          animate={{ opacity: [0.6, 1, 0.6], scale: [0.9, 1.1, 0.9] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
        />
      )}

      {/* Header */}
      <div className="flex items-center gap-2 mb-3 relative">
        <motion.div
          className={cn(
            "w-8 h-8 rounded-[10px] flex items-center justify-center",
            streakIsActive ? "bg-trainer-warning/15" : "bg-white/6"
          )}
          animate={streakIsActive ? { scale: [1, 1.12, 1] } : {}}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut", repeatDelay: 0.5 }}
        >
          <Flame
            className={cn("w-4 h-4", streakIsActive ? "text-trainer-warning" : "text-white/25")}
          />
        </motion.div>
        <span className="text-xs font-semibold text-white/40 uppercase tracking-wider">
          Streak
        </span>
      </div>

      {/* Streak number */}
      <div className="mb-3 relative">
        <span
          className={cn(
            "text-3xl font-black tabular-nums",
            streakIsActive ? "text-trainer-warning" : "text-white/25"
          )}
        >
          {animatedStreak}
        </span>
        <span className="text-sm text-white/40 ml-1.5">
          {streak === 1 ? "day" : "days"}
        </span>
      </div>

      {/* Bottom stats */}
      <div className="pt-3 border-t border-white/6 flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-white/35">This week</span>
          <span className="text-[11px] font-semibold text-white/60">
            {weekSessionCount} session{weekSessionCount !== 1 ? "s" : ""}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-white/35">All time</span>
          <span className="text-[11px] font-semibold text-white/60 tabular-nums">
            {animatedTotal}
          </span>
        </div>
      </div>

      {/* Next milestone */}
      {nextMilestone && streak > 0 && (
        <div className="mt-2 pt-2 border-t border-white/5">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[9px] text-white/25">Next milestone</span>
            <span className="text-[9px] font-bold text-trainer-warning">{nextMilestone}d</span>
          </div>
          <div className="h-1 bg-white/8 rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-trainer-warning"
              initial={{ width: 0 }}
              animate={{ width: `${milestoneProgress * 100}%` }}
              transition={{ duration: 0.7, ease: "easeOut", delay: 0.3 }}
            />
          </div>
          <p className="text-[9px] text-white/20 mt-0.5 tabular-nums">
            {nextMilestone - streak} more day{nextMilestone - streak !== 1 ? "s" : ""}
          </p>
        </div>
      )}
    </motion.div>
  );
}

// ─── WeekGridCard ─────────────────────────────────────────────────────────────

interface WeekGridCardProps {
  sessionDates: string[];
}

export function WeekGridCard({ sessionDates }: WeekGridCardProps) {
  const today = new Date();
  const dayOfWeek = (today.getDay() + 6) % 7; // Mon=0

  const weekDays = ["M", "T", "W", "T", "F", "S", "S"];

  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - dayOfWeek);
  startOfWeek.setHours(0, 0, 0, 0);

  const trainedSet = new Set(
    sessionDates.map((d) => {
      const date = new Date(d);
      date.setHours(0, 0, 0, 0);
      return date.getTime();
    })
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.15, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="rounded-[16px] bg-trainer-surface border border-white/8 p-4 flex-1"
    >
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-[10px] bg-trainer-indigo/15 flex items-center justify-center">
          <Calendar className="w-4 h-4 text-trainer-indigo" />
        </div>
        <span className="text-xs font-semibold text-white/40 uppercase tracking-wider">
          This Week
        </span>
      </div>

      <div className="flex items-end justify-between gap-1">
        {weekDays.map((label, i) => {
          const dayDate = new Date(startOfWeek);
          dayDate.setDate(startOfWeek.getDate() + i);
          const isTrained = trainedSet.has(dayDate.getTime());
          const isToday = i === dayOfWeek;
          const isFuture = i > dayOfWeek;

          return (
            <div key={i} className="flex flex-col items-center gap-1.5 flex-1">
              <motion.div
                initial={{ scaleY: 0, originY: 1 }}
                animate={{ scaleY: 1 }}
                transition={{ delay: 0.3 + i * 0.06, duration: 0.35, ease: "easeOut" }}
                className={cn(
                  "w-full aspect-square rounded-[6px] max-w-[28px]",
                  isTrained
                    ? "bg-trainer-indigo shadow-sm shadow-trainer-indigo/40"
                    : isToday
                    ? "bg-trainer-indigo/20 border border-trainer-indigo/40"
                    : isFuture
                    ? "bg-white/4"
                    : "bg-white/8"
                )}
              />
              <span
                className={cn(
                  "text-[9px] font-semibold uppercase",
                  isToday ? "text-trainer-indigo" : "text-white/25"
                )}
              >
                {label}
              </span>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
