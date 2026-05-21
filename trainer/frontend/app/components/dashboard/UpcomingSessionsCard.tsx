"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { Calendar, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useUserStore } from "@/app/store/userStore";
import { getSplitById } from "@/app/data/splits";
import { cn } from "@/app/lib/utils";
import type { WorkoutSplit } from "@/app/types";

const MUSCLE_COLOR: Record<string, string> = {
  chest:       "text-rose-400 bg-rose-400/10",
  back:        "text-sky-400 bg-sky-400/10",
  shoulders:   "text-violet-400 bg-violet-400/10",
  biceps:      "text-indigo-400 bg-indigo-400/10",
  triceps:     "text-purple-400 bg-purple-400/10",
  quads:       "text-amber-400 bg-amber-400/10",
  hamstrings:  "text-orange-400 bg-orange-400/10",
  glutes:      "text-pink-400 bg-pink-400/10",
  calves:      "text-yellow-400 bg-yellow-400/10",
  "full-body": "text-emerald-400 bg-emerald-400/10",
};

function muscleChip(m: string) {
  return MUSCLE_COLOR[m.toLowerCase()] ?? "text-white/50 bg-white/8";
}

function getDayLabel(daysFromToday: number): string {
  if (daysFromToday === 0) return "Today";
  if (daysFromToday === 1) return "Tomorrow";
  const d = new Date();
  d.setDate(d.getDate() + daysFromToday);
  return d.toLocaleDateString("en-US", { weekday: "short" });
}

interface UpcomingDay {
  daysFromToday: number;
  dayIndex: number;
  dayName: string;
  muscleGroups: string[];
  isRestDay: boolean;
  exerciseCount: number;
}

function buildUpcomingDays(split: WorkoutSplit, todayIndex: number, count = 6): UpcomingDay[] {
  const result: UpcomingDay[] = [];
  for (let i = 0; i < count; i++) {
    const dayIndex = (todayIndex + i) % split.days.length;
    const day = split.days[dayIndex];
    result.push({
      daysFromToday: i,
      dayIndex,
      dayName: day.dayName,
      muscleGroups: day.muscleGroups,
      isRestDay: day.isRestDay,
      exerciseCount: day.exercises?.length ?? 0,
    });
  }
  return result;
}

function getTodayDayIndex(totalDays: number): number {
  return ((new Date().getDay() + 6) % 7) % totalDays;
}

export function UpcomingSessionsCard() {
  const { profile } = useUserStore();

  const split = useMemo(
    () => (profile?.splitId ? getSplitById(profile.splitId) : null),
    [profile?.splitId]
  );

  const upcomingDays = useMemo(() => {
    if (!split) return [];
    const todayIdx = getTodayDayIndex(split.days.length);
    return buildUpcomingDays(split, todayIdx, 6);
  }, [split]);

  if (!split || upcomingDays.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.06 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-[7px] bg-trainer-indigo/15 flex items-center justify-center">
            <Calendar size={12} className="text-trainer-indigo" />
          </div>
          <p className="text-sm font-bold text-white">Upcoming Sessions</p>
          {split && (
            <span className="text-[10px] text-trainer-indigo/70 font-semibold bg-trainer-indigo/8 px-1.5 py-0.5 rounded-full">
              {split.days.filter((d) => !d.isRestDay).length}/{split.days.length}d
            </span>
          )}
          {(() => {
            const totalEx = upcomingDays
              .filter((d) => !d.isRestDay)
              .reduce((s, d) => s + d.exerciseCount, 0);
            return totalEx > 0 ? (
              <span className="text-[10px] text-white/25 font-semibold tabular-nums">
                {totalEx} ex upcoming
              </span>
            ) : null;
          })()}
        </div>
        <Link
          href="/splits"
          className="flex items-center gap-0.5 text-xs text-trainer-indigo/70 hover:text-trainer-indigo transition-colors"
        >
          Full plan
          <ChevronRight size={13} />
        </Link>
      </div>

      {/* Horizontal scroll */}
      <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1 -mx-5 px-5">
        {upcomingDays.map((day, i) => (
          <motion.div
            key={`${day.dayIndex}-${i}`}
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            {day.isRestDay ? (
              <div className="shrink-0 w-[110px] rounded-[14px] bg-trainer-surface border border-white/6 p-3 flex flex-col gap-2">
                <p className={cn(
                  "text-[10px] font-bold uppercase tracking-wide",
                  day.daysFromToday === 0 ? "text-trainer-indigo" : "text-white/30"
                )}>
                  {getDayLabel(day.daysFromToday)}
                </p>
                <p className="text-sm font-semibold text-white/25">Rest Day</p>
                <p className="text-[9px] text-white/15">Recovery</p>
              </div>
            ) : (
              <Link
                href={`/workout?day=${day.dayIndex}`}
                className="block shrink-0 w-[130px] rounded-[14px] bg-trainer-surface border border-white/8 p-3 hover:border-white/15 transition-colors"
              >
                <p className={cn(
                  "text-[10px] font-bold uppercase tracking-wide mb-1.5",
                  day.daysFromToday === 0 ? "text-trainer-indigo" : "text-white/40"
                )}>
                  {getDayLabel(day.daysFromToday)}
                </p>
                <p className="text-sm font-bold text-white/85 leading-tight mb-2 line-clamp-1">
                  {day.dayName}
                </p>
                <div className="flex flex-wrap gap-1 mb-2">
                  {day.muscleGroups.slice(0, 2).map((m) => (
                    <span key={m} className={cn("text-[9px] font-bold px-1.5 py-0.5 rounded-full capitalize", muscleChip(m))}>
                      {m}
                    </span>
                  ))}
                </div>
                <p className="text-[10px] text-white/25">
                  {day.exerciseCount} exercises
                </p>
              </Link>
            )}
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
