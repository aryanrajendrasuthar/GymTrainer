"use client";

import { motion } from "framer-motion";
import { Flame, Calendar } from "lucide-react";
import { cn } from "@/app/lib/utils";

interface StreakCardProps {
  streak: number;
  weekSessionCount: number;
  totalSessions: number;
}

export function StreakCard({ streak, weekSessionCount, totalSessions }: StreakCardProps) {
  const streakIsActive = streak > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      className="rounded-[16px] bg-trainer-surface border border-white/8 p-4 flex-1"
    >
      {/* Streak */}
      <div className="flex items-center gap-2 mb-3">
        <div
          className={cn(
            "w-8 h-8 rounded-[10px] flex items-center justify-center",
            streakIsActive
              ? "bg-trainer-warning/15"
              : "bg-white/6"
          )}
        >
          <Flame
            className={cn(
              "w-4 h-4",
              streakIsActive ? "text-trainer-warning" : "text-white/25"
            )}
          />
        </div>
        <span className="text-xs font-semibold text-white/40 uppercase tracking-wider">
          Streak
        </span>
      </div>

      <div className="mb-3">
        <span
          className={cn(
            "text-3xl font-black tabular-nums",
            streakIsActive ? "text-trainer-warning" : "text-white/25"
          )}
        >
          {streak}
        </span>
        <span className="text-sm text-white/40 ml-1.5">
          {streak === 1 ? "day" : "days"}
        </span>
      </div>

      <div className="pt-3 border-t border-white/6 flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-white/35">This week</span>
          <span className="text-[11px] font-semibold text-white/60">
            {weekSessionCount} session{weekSessionCount !== 1 ? "s" : ""}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-white/35">All time</span>
          <span className="text-[11px] font-semibold text-white/60">
            {totalSessions}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

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
      transition={{ duration: 0.4, delay: 0.15 }}
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
              <div
                className={cn(
                  "w-full aspect-square rounded-[6px] max-w-[28px] transition-all duration-200",
                  isTrained
                    ? "bg-trainer-indigo"
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
