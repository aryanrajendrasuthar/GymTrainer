"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles, ChevronRight, Dumbbell, AlertCircle, ArrowRight } from "lucide-react";
import { useUserStore } from "@/app/store/userStore";
import { authApi } from "@/app/lib/api";
import { calculateNutritionTargets } from "@/app/lib/nutrition";
import { GoalStep } from "@/app/components/onboarding/GoalStep";
import { getSplitsByGoal, getSplitById } from "@/app/data/splits";
import { type FitnessGoal, type WorkoutSplit } from "@/app/types";

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

const DIFFICULTY_LABELS: Record<string, string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
};

export function GoalChangeSheet({ open, onClose }: GoalChangeSheetProps) {
  const router = useRouter();
  const { profile, updateProfile, accessToken } = useUserStore();
  const [selected, setSelected] = useState<FitnessGoal | null>(
    profile?.goal ?? null
  );
  const [showSplitNudge, setShowSplitNudge] = useState(false);
  const [nudgeSplits, setNudgeSplits] = useState<WorkoutSplit[]>([]);

  function handleConfirm() {
    if (!selected || selected === profile?.goal) {
      onClose();
      return;
    }

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

    // Check if current split still matches the new goal
    const currentSplit = p?.splitId ? getSplitById(p.splitId) : undefined;
    if (currentSplit && !currentSplit.targetGoals.includes(selected)) {
      const matchingSplits = getSplitsByGoal(selected).slice(0, 3);
      if (matchingSplits.length > 0) {
        setNudgeSplits(matchingSplits);
        setShowSplitNudge(true);
        return;
      }
    }

    onClose();
  }

  function handleKeepSplit() {
    setShowSplitNudge(false);
    onClose();
  }

  function handleGoToSplits() {
    setShowSplitNudge(false);
    onClose();
    router.push("/settings");
  }

  function handlePickSplit(splitId: string) {
    updateProfile({ splitId });
    setShowSplitNudge(false);
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
            onClick={showSplitNudge ? undefined : onClose}
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

            <AnimatePresence mode="wait">
              {!showSplitNudge ? (
                <motion.div
                  key="goal-select"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.22 }}
                  className="flex flex-col flex-1 min-h-0"
                >
                  {/* Header */}
                  <div className="flex items-center justify-between px-5 pb-4 shrink-0">
                    <div>
                      <p className="text-base font-bold text-white">Change Goal</p>
                      <p className="text-xs text-white/35 mt-0.5">
                        Nutrition targets will be recalculated
                      </p>
                      {profile?.goal && (
                        <span className="text-[10px] font-bold text-trainer-indigo/60 bg-trainer-indigo/8 border border-trainer-indigo/15 px-2 py-0.5 rounded-full mt-1.5 inline-block">
                          Currently: {GOAL_LABELS[profile.goal]}
                        </span>
                      )}
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
              ) : (
                <motion.div
                  key="split-nudge"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.22 }}
                  className="flex flex-col flex-1 min-h-0"
                >
                  {/* Nudge Header */}
                  <div className="px-5 pb-4 shrink-0">
                    <div className="flex items-start gap-3 bg-amber-500/10 border border-amber-500/25 rounded-[14px] p-3.5 mb-4">
                      <AlertCircle size={16} className="text-amber-400 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-sm font-semibold text-white">Split mismatch detected</p>
                        <p className="text-xs text-white/45 mt-0.5 leading-relaxed">
                          Your current split isn&apos;t optimised for{" "}
                          <span className="text-amber-400 font-medium">
                            {selected ? GOAL_LABELS[selected] : "your new goal"}
                          </span>
                          . Switch now to get better results.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-white/70">Recommended splits for your goal</p>
                      <span className="text-[10px] text-white/25 tabular-nums">{nudgeSplits.length} options</span>
                    </div>
                  </div>

                  {/* Split cards */}
                  <div className="overflow-y-auto flex-1 px-5 pb-4 space-y-2.5">
                    {nudgeSplits.map((split, i) => (
                      <motion.button
                        key={split.id}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.07 }}
                        onClick={() => handlePickSplit(split.id)}
                        className="w-full text-left bg-trainer-surface border border-white/8 hover:border-trainer-indigo/40 rounded-[14px] p-4 transition-all group"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <Dumbbell size={13} className="text-trainer-indigo shrink-0" />
                              <p className="text-sm font-semibold text-white truncate">
                                {split.name}
                              </p>
                            </div>
                            <p className="text-xs text-white/40 leading-relaxed line-clamp-2">
                              {split.description}
                            </p>
                            <div className="flex items-center gap-2 mt-2">
                              <span className="text-[10px] font-medium text-trainer-indigo bg-trainer-indigo/10 px-2 py-0.5 rounded-full">
                                {split.daysPerWeek}d/week
                              </span>
                              <span className="text-[10px] font-medium text-white/40 bg-white/6 px-2 py-0.5 rounded-full">
                                {DIFFICULTY_LABELS[split.difficulty] ?? split.difficulty}
                              </span>
                            </div>
                          </div>
                          <ArrowRight
                            size={15}
                            className="text-white/20 group-hover:text-trainer-indigo transition-colors mt-0.5 shrink-0"
                          />
                        </div>
                      </motion.button>
                    ))}
                  </div>

                  {/* Actions */}
                  <div className="px-5 pb-10 pt-3 border-t border-white/8 shrink-0 space-y-2">
                    <button
                      onClick={handleKeepSplit}
                      className="w-full py-3 rounded-[14px] text-sm font-medium text-white/50 bg-white/6 hover:bg-white/10 transition-colors"
                    >
                      Keep Current Split
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
