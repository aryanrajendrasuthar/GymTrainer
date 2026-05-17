"use client";

import { motion } from "framer-motion";
import {
  Dumbbell,
  Flame,
  RefreshCw,
  Zap,
  Crown,
  Activity,
  Heart,
} from "lucide-react";
import { type FitnessGoal } from "@/app/types";
import { cn } from "@/app/lib/utils";

const GOALS = [
  {
    value: "muscle-gain" as FitnessGoal,
    label: "Build Muscle & Size",
    description: "Progressive hypertrophy training",
    Icon: Dumbbell,
  },
  {
    value: "fat-loss" as FitnessGoal,
    label: "Lose Fat",
    description: "Calorie-efficient metabolic training",
    Icon: Flame,
  },
  {
    value: "recomp" as FitnessGoal,
    label: "Body Recomposition",
    description: "Lose fat and build muscle simultaneously",
    Icon: RefreshCw,
  },
  {
    value: "strength" as FitnessGoal,
    label: "Get Stronger",
    description: "Powerlifting-style progressive overload",
    Icon: Zap,
  },
  {
    value: "greek-god" as FitnessGoal,
    label: "Greek God Physique",
    description: "Aesthetic proportions and symmetry",
    Icon: Crown,
  },
  {
    value: "calisthenics" as FitnessGoal,
    label: "Calisthenics & Skills",
    description: "Bodyweight mastery and movement skills",
    Icon: Activity,
  },
  {
    value: "general-fitness" as FitnessGoal,
    label: "General Fitness",
    description: "Health, endurance, and longevity",
    Icon: Heart,
  },
] as const;

interface GoalStepProps {
  value: FitnessGoal | null;
  onChange: (goal: FitnessGoal) => void;
}

export function GoalStep({ value, onChange }: GoalStepProps) {
  return (
    <div className="flex flex-col gap-2.5">
      {GOALS.map(({ value: goalValue, label, description, Icon }, i) => {
        const isSelected = value === goalValue;
        return (
          <motion.button
            key={goalValue}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05, duration: 0.3 }}
            onClick={() => onChange(goalValue)}
            className={cn(
              "flex items-center gap-4 p-4 rounded-[12px] border text-left w-full",
              "transition-all duration-200",
              isSelected
                ? "bg-trainer-indigo/15 border-trainer-indigo shadow-lg shadow-trainer-indigo/10"
                : "bg-trainer-elevated border-white/10 hover:border-white/25 hover:bg-white/5"
            )}
          >
            <div
              className={cn(
                "w-10 h-10 rounded-[10px] flex items-center justify-center shrink-0 transition-colors duration-200",
                isSelected ? "bg-trainer-indigo" : "bg-white/8"
              )}
            >
              <Icon
                className={cn(
                  "w-5 h-5 transition-colors duration-200",
                  isSelected ? "text-white" : "text-white/50"
                )}
              />
            </div>
            <div className="flex-1 min-w-0">
              <p
                className={cn(
                  "font-semibold text-sm transition-colors duration-200",
                  isSelected ? "text-white" : "text-white/80"
                )}
              >
                {label}
              </p>
              <p className="text-xs text-white/40 mt-0.5 truncate">{description}</p>
            </div>
            <div
              className={cn(
                "w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center transition-all duration-200",
                isSelected
                  ? "bg-trainer-indigo border-trainer-indigo"
                  : "border-white/20"
              )}
            >
              {isSelected && (
                <svg
                  className="w-2.5 h-2.5 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={3}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              )}
            </div>
          </motion.button>
        );
      })}
    </div>
  );
}
