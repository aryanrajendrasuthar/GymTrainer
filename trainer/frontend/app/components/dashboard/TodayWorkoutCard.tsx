"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ChevronRight, Coffee, Dumbbell, Moon } from "lucide-react";
import { type SplitDay, type WorkoutSplit } from "@/app/types";
import { cn } from "@/app/lib/utils";

interface TodayWorkoutCardProps {
  split: WorkoutSplit;
  splitDay: SplitDay;
  dayIndex: number;
}

const MUSCLE_COLOR_MAP: Record<string, string> = {
  chest: "text-rose-400 bg-rose-400/10",
  back: "text-sky-400 bg-sky-400/10",
  shoulders: "text-violet-400 bg-violet-400/10",
  biceps: "text-indigo-400 bg-indigo-400/10",
  triceps: "text-purple-400 bg-purple-400/10",
  legs: "text-amber-400 bg-amber-400/10",
  quads: "text-amber-400 bg-amber-400/10",
  hamstrings: "text-orange-400 bg-orange-400/10",
  glutes: "text-pink-400 bg-pink-400/10",
  calves: "text-yellow-400 bg-yellow-400/10",
  core: "text-teal-400 bg-teal-400/10",
  arms: "text-indigo-400 bg-indigo-400/10",
  "full-body": "text-emerald-400 bg-emerald-400/10",
  "rear-delts": "text-fuchsia-400 bg-fuchsia-400/10",
  traps: "text-cyan-400 bg-cyan-400/10",
};

function muscleChipClass(muscle: string): string {
  return (
    MUSCLE_COLOR_MAP[muscle.toLowerCase()] ?? "text-white/60 bg-white/8"
  );
}

export function TodayWorkoutCard({ split, splitDay, dayIndex }: TodayWorkoutCardProps) {
  if (splitDay.isRestDay) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="rounded-[20px] bg-trainer-surface border border-white/8 p-5 overflow-hidden relative"
      >
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-[14px] bg-white/6 flex items-center justify-center shrink-0">
            <Moon className="w-6 h-6 text-white/30" />
          </div>
          <div className="flex-1">
            <p className="text-xs text-white/35 font-medium uppercase tracking-wider mb-1">
              Today
            </p>
            <h2 className="text-lg font-bold text-white">Rest Day</h2>
            <p className="text-sm text-white/45 mt-1 leading-relaxed">
              Recovery is training. Sleep, eat well, and come back stronger.
            </p>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-white/6 flex items-center gap-2">
          <Coffee className="w-4 h-4 text-trainer-success/70" />
          <span className="text-xs text-white/40">
            {split.name} · {split.daysPerWeek} days/week
          </span>
        </div>
      </motion.div>
    );
  }

  const exerciseCount = splitDay.exercises?.length ?? 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="rounded-[20px] overflow-hidden relative"
    >
      {/* Gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-trainer-indigo/20 via-trainer-elevated to-trainer-surface" />
      <div className="absolute inset-0 border border-trainer-indigo/20 rounded-[20px]" />

      <div className="relative p-5">
        {/* Top row */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-xs text-trainer-indigo/80 font-semibold uppercase tracking-wider mb-1">
              Today&apos;s Workout
            </p>
            <h2 className="text-xl font-bold text-white leading-tight">
              {splitDay.dayName}
            </h2>
          </div>
          <div className="w-11 h-11 rounded-[12px] bg-trainer-indigo/20 border border-trainer-indigo/30 flex items-center justify-center shrink-0">
            <Dumbbell className="w-5 h-5 text-trainer-indigo" />
          </div>
        </div>

        {/* Muscle group chips */}
        <div className="flex flex-wrap gap-1.5 mb-5">
          {splitDay.muscleGroups.map((muscle) => (
            <span
              key={muscle}
              className={cn(
                "text-[11px] font-semibold px-2.5 py-1 rounded-full capitalize",
                muscleChipClass(muscle)
              )}
            >
              {muscle}
            </span>
          ))}
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-4 mb-5">
          {exerciseCount > 0 && (
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-bold text-white">{exerciseCount}</span>
              <span className="text-xs text-white/40">exercises</span>
            </div>
          )}
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-bold text-white">{split.daysPerWeek}</span>
            <span className="text-xs text-white/40">days/week</span>
          </div>
        </div>

        {/* CTA */}
        <Link
          href={`/workout?day=${dayIndex}`}
          className={cn(
            "flex items-center justify-center gap-2 w-full",
            "bg-trainer-indigo hover:bg-trainer-indigo-hover",
            "text-white font-semibold text-sm",
            "rounded-[12px] py-3.5",
            "transition-colors duration-200",
            "shadow-lg shadow-trainer-indigo/25"
          )}
        >
          Start Workout
          <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
    </motion.div>
  );
}
