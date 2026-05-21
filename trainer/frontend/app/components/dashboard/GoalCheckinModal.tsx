"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Target, TrendingUp, TrendingDown, Minus, Sparkles, X, ChevronRight } from "lucide-react";
import { useUserStore } from "@/app/store/userStore";
import { useRouter } from "next/navigation";
import { type FitnessGoal } from "@/app/types";
import { getSplitsByGoal } from "@/app/data/splits";
import { authApi } from "@/app/lib/api";

const STORAGE_KEY = "trainer-goal-checkin";

interface CheckinState {
  lastCheckinDate: string; // YYYY-MM-DD
  nextCheckinDate: string; // YYYY-MM-DD
}

export function getNextCheckinDate(fromDate?: string): string {
  const base = fromDate ? new Date(fromDate) : new Date();
  base.setDate(base.getDate() + 28);
  return base.toISOString().split("T")[0];
}

export function shouldShowCheckin(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const stored: Partial<CheckinState> = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}");
    if (!stored.nextCheckinDate) {
      // First time — schedule check-in 28 days from now (not immediately)
      const next = getNextCheckinDate();
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ lastCheckinDate: new Date().toISOString().split("T")[0], nextCheckinDate: next }));
      return false;
    }
    return new Date().toISOString().split("T")[0] >= stored.nextCheckinDate;
  } catch {
    return false;
  }
}

function recordCheckin() {
  const today = new Date().toISOString().split("T")[0];
  const next = getNextCheckinDate(today);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ lastCheckinDate: today, nextCheckinDate: next }));
  } catch { /* ignore */ }
}

type ProgressRating = "great" | "okay" | "struggling";

const PROGRESS_OPTIONS: { value: ProgressRating; label: string; icon: React.ElementType; color: string }[] = [
  { value: "great", label: "Smashing it", icon: TrendingUp, color: "text-trainer-success" },
  { value: "okay", label: "Making progress", icon: Minus, color: "text-amber-400" },
  { value: "struggling", label: "Struggling", icon: TrendingDown, color: "text-trainer-danger" },
];

const GOAL_LABELS: Record<FitnessGoal, string> = {
  "muscle-gain": "Build Muscle & Size",
  "fat-loss": "Lose Fat",
  recomp: "Body Recomposition",
  strength: "Get Stronger",
  "greek-god": "Greek God Physique",
  calisthenics: "Calisthenics & Skills",
  "general-fitness": "General Fitness",
};

const SUGGESTIONS: Record<ProgressRating, { title: string; body: string; cta?: string }> = {
  great: {
    title: "Keep pushing",
    body: "You're on track. Consider increasing intensity — add 5% volume to your main lifts or try a more advanced split.",
    cta: "View splits",
  },
  okay: {
    title: "Stay the course",
    body: "Progress isn't always linear. Make sure you're hitting your nutrition targets and getting enough sleep. Small improvements compound over time.",
  },
  struggling: {
    title: "Time to reassess",
    body: "It may be time to adjust your approach. Consider switching to a split that better matches your schedule, or refining your nutrition targets.",
    cta: "Change split",
  },
};

interface GoalCheckinModalProps {
  open: boolean;
  onClose: () => void;
  sessionCount: number;
}

export function GoalCheckinModal({ open, onClose, sessionCount }: GoalCheckinModalProps) {
  const router = useRouter();
  const { profile, updateProfile, accessToken } = useUserStore();
  const [step, setStep] = useState<"rate" | "suggest" | "done">("rate");
  const [rating, setRating] = useState<ProgressRating | null>(null);

  function handleRate(r: ProgressRating) {
    setRating(r);
    setStep("suggest");
  }

  function handleDone() {
    recordCheckin();
    setStep("rate");
    setRating(null);
    onClose();
  }

  function handleGoalSwitch(newGoal: FitnessGoal) {
    updateProfile({ goal: newGoal });
    if (accessToken) {
      authApi.updateProfile(accessToken, { goal: newGoal }).catch(() => {});
    }
    recordCheckin();
    onClose();
  }

  const suggestion = rating ? SUGGESTIONS[rating] : null;
  const currentGoal = profile?.goal;
  const goalLabel = currentGoal ? GOAL_LABELS[currentGoal] : "your goal";
  const matchingSplits = currentGoal ? getSplitsByGoal(currentGoal).slice(0, 2) : [];

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 z-50"
          />
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
            <motion.div
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              transition={{ type: "spring", stiffness: 360, damping: 38 }}
              className="w-full max-w-md bg-trainer-elevated border-t sm:border border-white/10 rounded-t-[24px] sm:rounded-[24px] p-6"
            >
              {/* Handle */}
              <div className="w-10 h-1 bg-white/15 rounded-full mx-auto mb-5 sm:hidden" />

              {/* Header */}
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <Target size={16} className="text-trainer-indigo" />
                  <p className="text-sm font-bold text-white">4-Week Check-in</p>
                </div>
                <button
                  onClick={handleDone}
                  className="w-7 h-7 rounded-full bg-white/8 flex items-center justify-center text-white/40 hover:text-white transition-colors"
                >
                  <X size={13} />
                </button>
              </div>

              <AnimatePresence mode="wait">
                {step === "rate" && (
                  <motion.div
                    key="rate"
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -12 }}
                    className="space-y-4"
                  >
                    <div>
                      <p className="text-base font-bold text-white mb-1">
                        How&apos;s {goalLabel} going?
                      </p>
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm text-white/40">
                          {sessionCount} sessions logged.
                        </p>
                        {sessionCount > 0 && (
                          <span className="text-[10px] font-bold text-trainer-indigo/70 bg-trainer-indigo/10 border border-trainer-indigo/20 px-2 py-0.5 rounded-full tabular-nums">
                            ~{Math.max(1, Math.round(sessionCount / 4))}/wk avg
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2.5">
                      {PROGRESS_OPTIONS.map(({ value, label, icon: Icon, color }) => (
                        <button
                          key={value}
                          onClick={() => handleRate(value)}
                          className="w-full flex items-center gap-3 p-4 rounded-[14px] bg-trainer-surface border border-white/8 hover:border-trainer-indigo/40 transition-all text-left group"
                        >
                          <Icon size={18} className={color} />
                          <span className="text-sm font-semibold text-white group-hover:text-white transition-colors">
                            {label}
                          </span>
                          <ChevronRight size={14} className="text-white/20 group-hover:text-trainer-indigo ml-auto transition-colors" />
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}

                {step === "suggest" && suggestion && (
                  <motion.div
                    key="suggest"
                    initial={{ opacity: 0, x: 12 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 12 }}
                    className="space-y-4"
                  >
                    <div className="flex items-start gap-3 bg-trainer-indigo/8 border border-trainer-indigo/20 rounded-[14px] p-4">
                      <Sparkles size={15} className="text-trainer-indigo shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-bold text-white mb-1">{suggestion.title}</p>
                        <p className="text-xs text-white/55 leading-relaxed">{suggestion.body}</p>
                      </div>
                    </div>

                    {rating === "struggling" && matchingSplits.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-xs text-white/35 font-semibold uppercase tracking-widest">
                          Better splits for {goalLabel}
                        </p>
                        {matchingSplits.map((s) => (
                          <button
                            key={s.id}
                            onClick={() => {
                              updateProfile({ splitId: s.id });
                              recordCheckin();
                              onClose();
                            }}
                            className="w-full flex items-center justify-between p-3.5 bg-trainer-surface border border-white/8 hover:border-trainer-indigo/40 rounded-[12px] transition-all text-left"
                          >
                            <div>
                              <p className="text-sm font-semibold text-white">{s.name}</p>
                              <p className="text-xs text-white/35">{s.daysPerWeek} days/week · {s.difficulty}</p>
                            </div>
                            <ChevronRight size={14} className="text-white/25" />
                          </button>
                        ))}
                      </div>
                    )}

                    {suggestion.cta === "View splits" && (
                      <button
                        onClick={() => { recordCheckin(); onClose(); router.push("/splits"); }}
                        className="w-full py-3 rounded-[12px] bg-trainer-indigo/15 border border-trainer-indigo/30 text-trainer-indigo text-sm font-semibold hover:bg-trainer-indigo/25 transition-colors"
                      >
                        Browse All Splits
                      </button>
                    )}

                    <button
                      onClick={handleDone}
                      className="w-full py-3 rounded-[12px] bg-white/6 border border-white/8 text-white/50 text-sm font-medium hover:text-white transition-colors"
                    >
                      Got it, continue
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
