"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles } from "lucide-react";
import { useUserStore } from "@/app/store/userStore";
import { authApi } from "@/app/lib/api";
import { calculateNutritionTargets } from "@/app/lib/nutrition";
import { GoalStep } from "@/app/components/onboarding/GoalStep";
import { type FitnessGoal } from "@/app/types";

interface GoalChangeSheetProps {
  open: boolean;
  onClose: () => void;
}

const GOAL_LABELS: Record<FitnessGoal, string> = {
  "muscle-gain": "Build Muscle & Size",
  "fat-loss": "Lose Fat",
  recomp: "Body Recomposition",
  strength: "Get Stronger",
  "greek-god": "Greek God Physique",
  calisthenics: "Calisthenics & Skills",
  "general-fitness": "General Fitness",
};

export function GoalChangeSheet({ open, onClose }: GoalChangeSheetProps) {
  const { profile, updateProfile, accessToken } = useUserStore();
  const [selected, setSelected] = useState<FitnessGoal | null>(
    profile?.goal ?? null
  );

  function handleConfirm() {
    if (!selected || selected === profile?.goal) {
      onClose();
      return;
    }

    // Recalculate nutrition if we have the metrics
    const p = profile;
    const nutritionTargets =
      p && p.weightKg && p.heightCm && p.age && p.gender && p.activityLevel
        ? calculateNutritionTargets(
            p.weightKg,
            p.heightCm,
            p.age,
            p.gender,
            p.activityLevel,
            selected
          )
        : undefined;

    updateProfile({
      goal: selected,
      ...(nutritionTargets ? { nutritionTargets } : {}),
    });

    if (accessToken) {
      authApi
        .updateProfile(accessToken, { goal: selected })
        .catch(() => {});
    }

    onClose();
  }

  const unchanged = selected === profile?.goal;

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 z-40"
          />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 380, damping: 42 }}
            className="fixed bottom-0 inset-x-0 z-50 bg-trainer-elevated border-t border-white/10 rounded-t-[24px] max-h-[90vh] flex flex-col"
          >
            {/* Handle */}
            <div className="w-10 h-1 bg-white/15 rounded-full mx-auto mt-3 mb-4 shrink-0" />

            {/* Header */}
            <div className="flex items-center justify-between px-5 pb-4 shrink-0">
              <div>
                <p className="text-base font-bold text-white">Change Goal</p>
                <p className="text-xs text-white/35 mt-0.5">
                  Nutrition targets will be recalculated
                </p>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-white/8 flex items-center justify-center text-white/50 hover:text-white transition-colors"
              >
                <X size={15} />
              </button>
            </div>

            {/* Goal list */}
            <div className="overflow-y-auto flex-1 px-5 pb-4">
              <GoalStep value={selected} onChange={setSelected} />
            </div>

            {/* Confirm */}
            <div className="px-5 pb-10 pt-3 border-t border-white/8 shrink-0">
              {!unchanged && selected && (
                <p className="text-xs text-white/35 text-center mb-2">
                  Switching to{" "}
                  <span className="text-trainer-indigo font-semibold">
                    {GOAL_LABELS[selected]}
                  </span>
                </p>
              )}
              <button
                onClick={handleConfirm}
                disabled={!selected}
                className="w-full py-3.5 rounded-[14px] text-sm font-bold bg-trainer-indigo text-white flex items-center justify-center gap-2 hover:bg-trainer-indigo-hover active:scale-[0.98] disabled:opacity-35 disabled:cursor-not-allowed transition-all"
              >
                <Sparkles size={15} />
                {unchanged ? "Keep Current Goal" : "Confirm New Goal"}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
