"use client";

import { motion } from "framer-motion";
import { type FitnessLevel } from "@/app/types";
import { cn } from "@/app/lib/utils";

const LEVELS = [
  {
    value: "beginner" as FitnessLevel,
    label: "New to Training",
    description:
      "Less than 1 year of consistent training. You'll follow beginner-friendly progressions with solid form coaching.",
    tag: "< 1 year",
    color: "text-emerald-400",
    bg: "bg-emerald-400/10",
    selectedBg: "bg-emerald-400/20",
    selectedBorder: "border-emerald-400/60",
  },
  {
    value: "intermediate" as FitnessLevel,
    label: "Some Experience",
    description:
      "1–3 years of consistent training. You understand the basics and are ready for structured programming.",
    tag: "1–3 years",
    color: "text-amber-400",
    bg: "bg-amber-400/10",
    selectedBg: "bg-amber-400/15",
    selectedBorder: "border-amber-400/60",
  },
  {
    value: "advanced" as FitnessLevel,
    label: "Serious Athlete",
    description:
      "3+ years of structured training. You track your lifts, understand periodisation, and push close to your limits.",
    tag: "3+ years",
    color: "text-red-400",
    bg: "bg-red-400/10",
    selectedBg: "bg-red-400/15",
    selectedBorder: "border-red-400/60",
  },
] as const;

interface FitnessLevelStepProps {
  value: FitnessLevel | null;
  onChange: (level: FitnessLevel) => void;
}

export function FitnessLevelStep({ value, onChange }: FitnessLevelStepProps) {
  return (
    <div className="flex flex-col gap-3">
      {LEVELS.map(
        (
          { value: levelValue, label, description, tag, color, bg, selectedBg, selectedBorder },
          i
        ) => {
          const isSelected = value === levelValue;
          return (
            <motion.button
              key={levelValue}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08, duration: 0.3 }}
              onClick={() => onChange(levelValue)}
              className={cn(
                "flex flex-col gap-3 p-5 rounded-[12px] border text-left w-full",
                "transition-all duration-200",
                isSelected
                  ? `${selectedBg} ${selectedBorder} shadow-lg`
                  : "bg-trainer-elevated border-white/10 hover:border-white/25"
              )}
            >
              <div className="flex items-center justify-between">
                <p
                  className={cn(
                    "font-semibold text-base transition-colors duration-200",
                    isSelected ? "text-white" : "text-white/80"
                  )}
                >
                  {label}
                </p>
                <span
                  className={cn(
                    "text-xs font-bold px-3 py-1 rounded-full shrink-0",
                    isSelected ? `${color} ${bg}` : "text-white/40 bg-white/8"
                  )}
                >
                  {tag}
                </span>
              </div>
              <p className="text-sm text-white/50 leading-relaxed">{description}</p>
            </motion.button>
          );
        }
      )}
    </div>
  );
}
