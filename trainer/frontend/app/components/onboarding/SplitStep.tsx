"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import { Calendar, Sparkles } from "lucide-react";
import { type FitnessGoal, type FitnessLevel } from "@/app/types";
import { workoutSplits } from "@/app/data/splits";
import { cn } from "@/app/lib/utils";

const DIFFICULTY_STYLE: Record<FitnessLevel, { label: string; className: string }> = {
  beginner: {
    label: "Beginner",
    className: "text-emerald-400 bg-emerald-400/10",
  },
  intermediate: {
    label: "Intermediate",
    className: "text-amber-400 bg-amber-400/10",
  },
  advanced: {
    label: "Advanced",
    className: "text-red-400 bg-red-400/10",
  },
};

interface SplitStepProps {
  value: string | null;
  goal: FitnessGoal;
  fitnessLevel: FitnessLevel;
  onChange: (splitId: string) => void;
}

export function SplitStep({ value, goal, fitnessLevel, onChange }: SplitStepProps) {
  const recommended = workoutSplits.filter(
    (s) => s.targetGoals.includes(goal) && s.difficulty === fitnessLevel
  );
  // Fallback: goal matches but any difficulty
  const fallback = recommended.length === 0
    ? workoutSplits.filter((s) => s.targetGoals.includes(goal))
    : [];
  const topPick = (recommended[0] ?? fallback[0]) ?? null;

  // Auto-select top pick on mount if nothing chosen yet
  useEffect(() => {
    if (!value && topPick) {
      onChange(topPick.id);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const others = workoutSplits.filter(
    (s) => !recommended.some((r) => r.id === s.id) && !fallback.some((r) => r.id === s.id)
  );
  const primaryRec = recommended.length > 0 ? recommended : fallback;

  const sections = [
    ...(primaryRec.length > 0
      ? [{ heading: "Recommended for you", splits: primaryRec }]
      : []),
    ...(others.length > 0 ? [{ heading: "All Programmes", splits: others }] : []),
  ];

  let globalIndex = 0;

  return (
    <div className="flex flex-col gap-6">
      {sections.map(({ heading, splits }) => (
        <div key={heading}>
          <p
            className={cn(
              "text-[11px] font-semibold uppercase tracking-widest mb-3",
              heading === "Recommended for you"
                ? "text-trainer-indigo/80"
                : "text-white/35"
            )}
          >
            {heading}
          </p>
          <div className="flex flex-col gap-2.5">
            {splits.map((split) => {
              const idx = globalIndex++;
              const isSelected = value === split.id;
              const isTopPick = topPick?.id === split.id;
              const isRec = primaryRec.some((r) => r.id === split.id);
              const diff = DIFFICULTY_STYLE[split.difficulty];

              return (
                <motion.button
                  key={split.id}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05, duration: 0.3 }}
                  onClick={() => onChange(split.id)}
                  className={cn(
                    "flex flex-col gap-2 p-4 rounded-[12px] border text-left w-full",
                    "transition-all duration-200",
                    isSelected
                      ? "bg-trainer-indigo/15 border-trainer-indigo shadow-lg shadow-trainer-indigo/10"
                      : "bg-trainer-elevated border-white/10 hover:border-white/25"
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p
                      className={cn(
                        "font-semibold text-sm leading-snug transition-colors duration-200",
                        isSelected ? "text-white" : "text-white/85"
                      )}
                    >
                      {split.name}
                    </p>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {isTopPick && (
                        <span className="flex items-center gap-1 text-[9px] font-bold text-trainer-indigo bg-trainer-indigo/15 px-2 py-0.5 rounded-full uppercase tracking-wide">
                          <Sparkles className="w-2.5 h-2.5" />
                          Top Pick
                        </span>
                      )}
                      {isRec && !isTopPick && (
                        <span className="text-[9px] font-bold text-trainer-indigo bg-trainer-indigo/15 px-2 py-0.5 rounded-full uppercase tracking-wide">
                          Best fit
                        </span>
                      )}
                      <span
                        className={cn(
                          "text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide",
                          diff.className
                        )}
                      >
                        {diff.label}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-white/45 leading-relaxed line-clamp-2">
                    {split.description}
                  </p>
                  <div className="flex items-center gap-1.5 text-white/35">
                    <Calendar className="w-3 h-3" />
                    <span className="text-xs">{split.daysPerWeek} days / week</span>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
