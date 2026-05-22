"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { ChevronRight, Clock, Coffee, Dumbbell, Moon, TrendingUp, Zap, CalendarDays } from "lucide-react";
import { type SplitDay, type WorkoutSplit } from "@/app/types";
import { cn, formatVolume } from "@/app/lib/utils";
import { exerciseMap } from "@/app/data/exercises";

interface ProgressionHint {
  name: string;
  suggestedWeight: number;
  increaseAmountKg: number;
}

interface WorkoutEstimate {
  durationMinutes: number;
  volumeKg: number;
}

interface TodayWorkoutCardProps {
  split: WorkoutSplit;
  splitDay: SplitDay;
  dayIndex: number;
  progressionHints?: ProgressionHint[];
  estimate?: WorkoutEstimate;
  unit?: "kg" | "lb";
  onTrainAnyway?: () => void;
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
  return MUSCLE_COLOR_MAP[muscle.toLowerCase()] ?? "text-white/60 bg-white/8";
}

export function TodayWorkoutCard({ split, splitDay, dayIndex, progressionHints, estimate, unit = "kg", onTrainAnyway }: TodayWorkoutCardProps) {
  const [showDayPicker, setShowDayPicker] = useState(false);
  if (splitDay.isRestDay) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
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
        <div className="mt-4 pt-4 border-t border-white/6 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Coffee className="w-4 h-4 text-trainer-success/70" />
            <span className="text-xs text-white/40">
              {split.name} · {split.daysPerWeek} days/week · Day {dayIndex + 1}
            </span>
          </div>
          {onTrainAnyway && (
            <button
              onClick={onTrainAnyway}
              className="flex items-center gap-1.5 text-[11px] font-semibold text-white/30 hover:text-trainer-indigo transition-colors"
            >
              <Dumbbell size={11} />
              Train anyway
            </button>
          )}
        </div>
      </motion.div>
    );
  }

  const exerciseCount = splitDay.exercises?.length ?? 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="rounded-[20px] overflow-hidden relative group"
    >
      {/* Deep gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-trainer-indigo/25 via-[#0f0f1e] to-trainer-surface" />

      {/* Animated ambient glow — breathes continuously */}
      <motion.div
        className="absolute -inset-px rounded-[20px] opacity-0 group-hover:opacity-100"
        style={{
          background: "radial-gradient(ellipse at 50% 0%, rgba(108,99,255,0.35) 0%, transparent 70%)",
        }}
        animate={{ opacity: [0.4, 0.7, 0.4] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Border with gradient */}
      <div
        className="absolute inset-0 rounded-[20px] pointer-events-none"
        style={{
          background: "linear-gradient(135deg, rgba(108,99,255,0.45) 0%, rgba(108,99,255,0.08) 50%, rgba(108,99,255,0.03) 100%)",
          WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
          WebkitMaskComposite: "xor",
          maskComposite: "exclude",
          padding: "1px",
        }}
      />

      {/* Decorative indigo orb top-right */}
      <div className="absolute -top-6 -right-6 w-32 h-32 rounded-full bg-trainer-indigo/12 blur-2xl pointer-events-none" />

      <div className="relative p-5">
        {/* Top row */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-xs text-trainer-indigo/80 font-semibold uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Zap size={10} className="text-trainer-gold" />
              Today&apos;s Workout
            </p>
            <h2 className="text-xl font-bold text-white leading-tight">
              {splitDay.dayName}
            </h2>
          </div>

          {/* Animated dumbbell icon */}
          <motion.div
            className="w-11 h-11 rounded-[12px] bg-trainer-indigo/20 border border-trainer-indigo/30 flex items-center justify-center shrink-0"
            animate={{ rotate: [0, -8, 8, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", repeatDelay: 2 }}
          >
            <Dumbbell className="w-5 h-5 text-trainer-indigo" />
          </motion.div>
        </div>

        {/* Muscle group chips — stagger in */}
        <div className="flex flex-wrap gap-1.5 mb-5">
          {splitDay.muscleGroups.map((muscle, i) => (
            <motion.span
              key={muscle}
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.15 + i * 0.05, duration: 0.3 }}
              className={cn(
                "text-[11px] font-semibold px-2.5 py-1 rounded-full capitalize",
                muscleChipClass(muscle)
              )}
            >
              {muscle}
            </motion.span>
          ))}
        </div>

        {/* Exercise name preview */}
        {splitDay.exercises && splitDay.exercises.length > 0 && (() => {
          const SHOW = 4;
          const names = splitDay.exercises.map((id) => exerciseMap[id]?.name ?? id);
          const shown = names.slice(0, SHOW);
          const more = names.length - SHOW;
          return (
            <div className="flex flex-wrap gap-1.5 mb-4">
              {shown.map((name) => (
                <span
                  key={name}
                  className="text-[10px] font-medium text-white/40 bg-white/6 border border-white/8 px-2 py-0.5 rounded-full truncate max-w-[120px]"
                >
                  {name}
                </span>
              ))}
              {more > 0 && (
                <span className="text-[10px] font-medium text-white/25 px-1 py-0.5">
                  +{more} more
                </span>
              )}
            </div>
          );
        })()}

        {/* Stats row + day switcher */}
        <div className="flex items-center gap-4 mb-5">
          {exerciseCount > 0 && (
            <motion.div
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="flex items-center gap-1.5"
            >
              <span className="text-sm font-bold text-white">{exerciseCount}</span>
              <span className="text-xs text-white/40">exercises</span>
            </motion.div>
          )}
          <motion.div
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.35 }}
            className="flex items-center gap-1.5"
          >
            <span className="text-sm font-bold text-white">{split.daysPerWeek}</span>
            <span className="text-xs text-white/40">days/week</span>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.38 }}
            className="flex items-center gap-1.5"
          >
            <span className="text-[10px] font-bold text-trainer-indigo/60 bg-trainer-indigo/10 px-2 py-0.5 rounded-full tabular-nums">
              Day {dayIndex + 1}/{split.days.length}
            </span>
          </motion.div>

          {estimate && (
            <>
              <div className="w-px h-3 bg-white/12 shrink-0" />
              <motion.div
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className="flex items-center gap-1.5"
              >
                <Clock size={10} className="text-white/30" />
                <span className="text-xs text-white/40">~{estimate.durationMinutes}m</span>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.44 }}
                className="flex items-center gap-1.5"
              >
                <TrendingUp size={10} className="text-white/30" />
                <span className="text-xs text-white/40">~{formatVolume(estimate.volumeKg, unit)}</span>
              </motion.div>
            </>
          )}

          {/* Switch day button */}
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            onClick={() => setShowDayPicker((v) => !v)}
            className="ml-auto flex items-center gap-1 text-[11px] text-white/30 hover:text-white/55 transition-colors"
          >
            <CalendarDays size={11} />
            {showDayPicker ? "Close" : "Switch day"}
          </motion.button>
        </div>

        {/* Day picker */}
        <AnimatePresence>
          {showDayPicker && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden mb-5"
            >
              <div className="bg-black/30 rounded-[12px] p-2 flex flex-col gap-1">
                {split.days.map((day, i) => (
                  <Link
                    key={i}
                    href={day.isRestDay ? "#" : `/workout?day=${i}`}
                    onClick={() => !day.isRestDay && setShowDayPicker(false)}
                    className={cn(
                      "flex items-center justify-between px-3 py-2 rounded-[8px] transition-colors",
                      i === dayIndex
                        ? "bg-trainer-indigo/20 border border-trainer-indigo/30"
                        : day.isRestDay
                        ? "opacity-35 cursor-default"
                        : "hover:bg-white/8"
                    )}
                  >
                    <span className={cn(
                      "text-xs font-semibold",
                      i === dayIndex ? "text-trainer-indigo" : "text-white/70"
                    )}>
                      {day.dayName}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {i === dayIndex && (
                        <span className="text-[9px] text-trainer-indigo font-bold uppercase tracking-wide">Today</span>
                      )}
                      {day.isRestDay ? (
                        <Moon size={11} className="text-white/25" />
                      ) : (
                        <ChevronRight size={11} className="text-white/25" />
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Progression hints */}
        {progressionHints && progressionHints.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mb-5 bg-trainer-success/8 border border-trainer-success/15 rounded-[12px] px-3 py-2.5"
          >
            <div className="flex items-center gap-1.5 mb-2">
              <TrendingUp size={10} className="text-trainer-success" />
              <p className="text-[10px] font-bold text-trainer-success uppercase tracking-wide">
                {progressionHints.length} ready to progress
              </p>
            </div>
            <div className="flex flex-col gap-1">
              {progressionHints.map((hint) => (
                <div key={hint.name} className="flex items-center justify-between gap-2">
                  <p className="text-[10px] text-white/50 truncate">{hint.name}</p>
                  <p className="text-[10px] font-semibold text-trainer-success shrink-0">
                    +{hint.increaseAmountKg}kg → {hint.suggestedWeight}kg
                  </p>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* CTA button */}
        <motion.div
          whileTap={{ scale: 0.97 }}
          className="relative overflow-hidden rounded-[12px]"
        >
          {/* Button shimmer sweep */}
          <motion.div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.12) 50%, transparent 60%)",
              backgroundSize: "200% 100%",
            }}
            animate={{ backgroundPosition: ["200% 0", "-200% 0"] }}
            transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 1.5, ease: "easeInOut" }}
          />
          <Link
            href={`/workout?day=${dayIndex}`}
            className={cn(
              "relative flex items-center justify-center gap-2 w-full",
              "bg-trainer-indigo hover:bg-trainer-indigo-hover",
              "text-white font-bold text-sm",
              "py-3.5",
              "transition-colors duration-200",
              "shadow-lg shadow-trainer-indigo/30"
            )}
          >
            Start Workout
            <ChevronRight className="w-4 h-4" />
          </Link>
        </motion.div>
      </div>
    </motion.div>
  );
}
