"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Moon, Dumbbell, ChevronRight, Repeat2 } from "lucide-react";
import { type WorkoutSplit } from "@/app/types";
import { exerciseMap } from "@/app/data/exercises";
import { getCurrentWeekVariant, getWeekLabel } from "@/app/lib/weekVariant";
import { cn } from "@/app/lib/utils";

const MUSCLE_COLOR: Record<string, string> = {
  chest: "text-rose-400 bg-rose-400/10",
  back: "text-sky-400 bg-sky-400/10",
  shoulders: "text-violet-400 bg-violet-400/10",
  biceps: "text-indigo-400 bg-indigo-400/10",
  triceps: "text-purple-400 bg-purple-400/10",
  quads: "text-amber-400 bg-amber-400/10",
  hamstrings: "text-orange-400 bg-orange-400/10",
  glutes: "text-pink-400 bg-pink-400/10",
  calves: "text-yellow-400 bg-yellow-400/10",
  "full-body": "text-emerald-400 bg-emerald-400/10",
  arms: "text-indigo-400 bg-indigo-400/10",
};

function chip(m: string) {
  return MUSCLE_COLOR[m.toLowerCase()] ?? "text-white/50 bg-white/6";
}

// ─── Exercise list sheet ──────────────────────────────────────────────────────

function ExerciseSheet({
  open,
  onClose,
  dayName,
  exercises,
  muscleGroups,
}: {
  open: boolean;
  onClose: () => void;
  dayName: string;
  exercises: string[];
  muscleGroups: string[];
}) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 z-50"
          />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 360, damping: 38 }}
            className="fixed bottom-0 inset-x-0 z-50 bg-trainer-elevated border-t border-white/10 rounded-t-[24px] max-h-[80vh] flex flex-col"
          >
            <div className="w-10 h-1 bg-white/15 rounded-full mx-auto mt-3 mb-1 shrink-0" />

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/6 shrink-0">
              <div>
                <p className="text-base font-bold text-white">{dayName}</p>
                <div className="flex gap-1.5 mt-1 flex-wrap">
                  {muscleGroups.map((m) => (
                    <span key={m} className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize", chip(m))}>
                      {m}
                    </span>
                  ))}
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-white/8 flex items-center justify-center text-white/50 hover:text-white"
              >
                <X size={15} />
              </button>
            </div>

            {/* Exercise list */}
            <div className="overflow-y-auto flex-1 px-5 py-4">
              <p className="text-[10px] font-semibold text-white/30 uppercase tracking-widest mb-3">
                {exercises.length} Exercises · {getWeekLabel()}
              </p>
              <div className="flex flex-col gap-2">
                {exercises.map((exId, idx) => {
                  const ex = exerciseMap[exId];
                  return (
                    <div
                      key={exId}
                      className="flex items-center gap-3 bg-trainer-surface border border-white/6 rounded-[12px] px-3.5 py-3"
                    >
                      <span className="text-xs font-bold text-white/25 tabular-nums w-4">{idx + 1}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white/85 truncate">{ex?.name ?? exId}</p>
                        {ex && (
                          <p className="text-[11px] text-white/30 mt-0.5 capitalize">
                            {ex.movementType} · {ex.difficulty}
                          </p>
                        )}
                      </div>
                      {ex && (
                        <span className="text-[10px] text-white/30 capitalize shrink-0">{ex.equipment[0]}</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface WeeklyPlanSheetProps {
  split: WorkoutSplit;
  todayDayIndex: number;
}

export function WeeklyPlanSheet({ split, todayDayIndex }: WeeklyPlanSheetProps) {
  const weekVariant = getCurrentWeekVariant();
  const weekLabel = getWeekLabel();
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const selectedSplitDay = selectedDay !== null ? split.days[selectedDay] : null;
  const selectedExercises = selectedSplitDay
    ? ((weekVariant === 1 && selectedSplitDay.exercisesAlt?.length)
        ? selectedSplitDay.exercisesAlt
        : (selectedSplitDay.exercises ?? []))
    : [];

  return (
    <>
      <div className="flex flex-col gap-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-white/35 uppercase tracking-widest">This Week</p>
          <div className="flex items-center gap-1.5 bg-trainer-indigo/10 border border-trainer-indigo/20 px-2.5 py-1 rounded-full">
            <Repeat2 size={11} className="text-trainer-indigo/70" />
            <span className="text-[11px] font-bold text-trainer-indigo/80">{weekLabel}</span>
          </div>
        </div>

        {/* Day cards — horizontal scroll */}
        <div className="flex gap-2.5 overflow-x-auto pb-1 -mx-1 px-1 no-scrollbar">
          {split.days.map((day, i) => {
            const isToday = i === todayDayIndex;
            const exercises = (weekVariant === 1 && day.exercisesAlt?.length)
              ? day.exercisesAlt
              : (day.exercises ?? []);

            return (
              <button
                key={i}
                onClick={() => !day.isRestDay && setSelectedDay(i)}
                className={cn(
                  "flex-shrink-0 w-[88px] rounded-[14px] border p-3 text-left transition-all duration-150",
                  day.isRestDay
                    ? "bg-white/3 border-white/6 cursor-default"
                    : isToday
                    ? "bg-trainer-indigo/12 border-trainer-indigo/35"
                    : "bg-trainer-elevated border-white/8 hover:border-white/20 active:scale-95"
                )}
              >
                {/* Day number */}
                <div className={cn(
                  "w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold mb-2",
                  isToday ? "bg-trainer-indigo text-white" : "bg-white/8 text-white/35"
                )}>
                  {i + 1}
                </div>

                {day.isRestDay ? (
                  <>
                    <Moon size={14} className="text-white/20 mb-1" />
                    <p className="text-[11px] font-semibold text-white/30">Rest</p>
                  </>
                ) : (
                  <>
                    <Dumbbell size={13} className={cn("mb-1.5", isToday ? "text-trainer-indigo/70" : "text-white/30")} />
                    <p className={cn("text-[11px] font-bold leading-tight truncate", isToday ? "text-white" : "text-white/65")}>
                      {day.dayName}
                    </p>
                    <p className="text-[10px] text-white/30 mt-0.5">{exercises.length} ex.</p>
                    {!day.isRestDay && (
                      <ChevronRight size={10} className="text-white/20 mt-1" />
                    )}
                  </>
                )}

                {isToday && !day.isRestDay && (
                  <div className="mt-1.5 w-4 h-0.5 rounded-full bg-trainer-indigo/60" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Exercise detail sheet */}
      <ExerciseSheet
        open={selectedDay !== null && !!selectedSplitDay && !selectedSplitDay.isRestDay}
        onClose={() => setSelectedDay(null)}
        dayName={selectedSplitDay?.dayName ?? ""}
        exercises={selectedExercises}
        muscleGroups={selectedSplitDay?.muscleGroups ?? []}
      />
    </>
  );
}
