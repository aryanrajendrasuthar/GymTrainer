"use client";

import { motion } from "framer-motion";
import { Trophy, ChevronRight } from "lucide-react";
import { cn } from "@/app/lib/utils";

export interface ExercisePR {
  exerciseId: string;
  exerciseName: string;
  bestWeight: number;
  bestReps: number;
  estimated1RM: number;
  achievedDate: string;
  unit: "kg" | "lb";
}

interface PRCardProps {
  prs: ExercisePR[];
  onSelectExercise?: (exerciseId: string) => void;
  selectedExerciseId?: string | null;
}

export function PRCard({ prs, onSelectExercise, selectedExerciseId }: PRCardProps) {
  if (prs.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-8">
        <Trophy className="text-white/15" size={32} />
        <p className="text-sm text-white/30 text-center">
          Complete workouts to see your personal records.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {prs.map((pr, i) => {
        const isSelected = selectedExerciseId === pr.exerciseId;
        return (
          <motion.button
            key={pr.exerciseId}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.04 }}
            onClick={() => onSelectExercise?.(pr.exerciseId)}
            className={cn(
              "flex items-center gap-3 p-3.5 rounded-[12px] border text-left transition-all duration-200",
              isSelected
                ? "bg-trainer-gold/8 border-trainer-gold/30"
                : "bg-trainer-elevated border-white/8 hover:border-white/20"
            )}
          >
            {/* Rank */}
            <div
              className={cn(
                "w-7 h-7 rounded-full flex items-center justify-center shrink-0",
                i === 0
                  ? "bg-trainer-gold/20"
                  : i === 1
                  ? "bg-white/10"
                  : "bg-white/5"
              )}
            >
              {i === 0 ? (
                <Trophy
                  size={13}
                  className="text-trainer-gold"
                />
              ) : (
                <span className="text-[11px] font-bold text-white/30 tabular-nums">
                  {i + 1}
                </span>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white/85 truncate capitalize">
                {pr.exerciseName.replace(/-/g, " ")}
              </p>
              <p className="text-xs text-white/35 mt-0.5 tabular-nums">
                {pr.bestWeight}{pr.unit} × {pr.bestReps} reps
              </p>
            </div>

            {/* e1RM */}
            <div className="flex flex-col items-end gap-0.5 shrink-0">
              <span
                className={cn(
                  "text-sm font-bold tabular-nums",
                  isSelected ? "text-trainer-gold" : "text-white/70"
                )}
              >
                {pr.estimated1RM}{pr.unit}
              </span>
              <span className="text-[9px] text-white/25 uppercase tracking-wider">
                e1RM
              </span>
            </div>

            {onSelectExercise && (
              <ChevronRight
                size={13}
                className={cn(
                  "shrink-0 transition-colors",
                  isSelected ? "text-trainer-gold/60" : "text-white/20"
                )}
              />
            )}
          </motion.button>
        );
      })}
    </div>
  );
}
