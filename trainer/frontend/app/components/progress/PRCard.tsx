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
  sparklines?: Record<string, number[]>;
}

function relativeDate(iso: string): string {
  const diffDays = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)}mo ago`;
  return `${Math.floor(diffDays / 365)}y ago`;
}

function Sparkline({ values }: { values: number[] }) {
  if (values.length < 2) return null;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const W = 48, H = 20, pad = 2;
  const points = values.map((v, i) => {
    const x = pad + (i / (values.length - 1)) * (W - pad * 2);
    const y = H - pad - ((v - min) / range) * (H - pad * 2);
    return `${x},${y}`;
  }).join(" ");

  const lastY = H - pad - ((values[values.length - 1] - min) / range) * (H - pad * 2);
  const rising = values[values.length - 1] >= values[0];

  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="shrink-0">
      <polyline
        points={points}
        fill="none"
        stroke={rising ? "rgba(74,222,128,0.55)" : "rgba(248,113,113,0.55)"}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle
        cx={pad + ((values.length - 1) / (values.length - 1)) * (W - pad * 2)}
        cy={lastY}
        r="2.5"
        fill={rising ? "rgb(74,222,128)" : "rgb(248,113,113)"}
      />
    </svg>
  );
}

export function PRCard({ prs, onSelectExercise, selectedExerciseId, sparklines }: PRCardProps) {
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

            {/* Sparkline */}
            {sparklines?.[pr.exerciseId] && sparklines[pr.exerciseId].length >= 2 && (
              <Sparkline values={sparklines[pr.exerciseId]} />
            )}

            {/* e1RM + date */}
            <div className="flex flex-col items-end gap-0.5 shrink-0">
              <span
                className={cn(
                  "text-sm font-bold tabular-nums",
                  isSelected ? "text-trainer-gold" : "text-white/70"
                )}
              >
                {pr.estimated1RM}{pr.unit}
              </span>
              <span className="text-[9px] text-white/25 uppercase tracking-wider">e1RM</span>
              <span className="text-[9px] text-white/20 tabular-nums">{relativeDate(pr.achievedDate)}</span>
              {Math.floor((Date.now() - new Date(pr.achievedDate).getTime()) / 86400000) <= 30 && (
                <span className="text-[8px] font-black text-trainer-success bg-trainer-success/12 border border-trainer-success/20 px-1.5 py-0.5 rounded-full">
                  NEW
                </span>
              )}
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
