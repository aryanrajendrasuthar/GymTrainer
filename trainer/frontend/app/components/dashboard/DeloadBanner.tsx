"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, X, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useSessionStore } from "@/app/store/sessionStore";
import { useSettingsStore } from "@/app/store/settingsStore";
import { useUserStore } from "@/app/store/userStore";
import { analyseRoutine, detectDeloadSignal } from "@/app/lib/progression-engine";
import { exerciseMap } from "@/app/data/exercises";

interface DeloadBannerProps {
  exerciseIds: string[];
}

const DISMISS_KEY = "trainer-deload-dismissed";

export function DeloadBanner({ exerciseIds }: DeloadBannerProps) {
  const { allExerciseLogs } = useSessionStore();
  const { settings } = useSettingsStore();
  const { profile } = useUserStore();
  const [dismissed, setDismissed] = useState(() => {
    if (typeof window === "undefined") return false;
    const raw = localStorage.getItem(DISMISS_KEY);
    if (!raw) return false;
    const ts = parseInt(raw, 10);
    // Dismiss for 7 days
    return Date.now() - ts < 7 * 86400000;
  });

  const deloadSignal = useMemo(() => {
    if (!settings.deloadReminder) return { detected: false, reason: "", affectedExercises: [] };
    if (!exerciseIds.length) return { detected: false, reason: "", affectedExercises: [] };
    const goal = profile?.goal ?? "muscle-gain";
    const amount = settings.overloadAmount ?? "standard";
    const analyses = analyseRoutine(exerciseIds, allExerciseLogs, goal, amount);
    return detectDeloadSignal(analyses);
  }, [exerciseIds, allExerciseLogs, settings.deloadReminder, settings.overloadAmount, profile?.goal]);

  function handleDismiss() {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setDismissed(true);
  }

  if (!deloadSignal.detected || dismissed) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: "auto" }}
        exit={{ opacity: 0, height: 0 }}
        className="overflow-hidden"
      >
        <div className="flex items-start gap-3 p-4 rounded-[14px] bg-trainer-warning/8 border border-trainer-warning/25">
          <div className="w-9 h-9 rounded-[10px] bg-trainer-warning/15 flex items-center justify-center shrink-0 mt-0.5">
            <AlertTriangle size={16} className="text-trainer-warning" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-trainer-warning">Deload week suggested</p>
            <p className="text-xs text-white/50 mt-0.5 leading-relaxed">
              High RPE logged for {deloadSignal.affectedExercises.length} exercise
              {deloadSignal.affectedExercises.length !== 1 ? "s" : ""} over multiple sessions
              {deloadSignal.affectedExercises.length > 0 && (
                <span className="text-white/35">
                  {" "}({deloadSignal.affectedExercises.slice(0, 2).map((id) => exerciseMap[id]?.name ?? id).join(", ")}
                  {deloadSignal.affectedExercises.length > 2 ? ` +${deloadSignal.affectedExercises.length - 2} more` : ""})
                </span>
              )}.
              Reduce load by ~40–60% this week to recover.
            </p>
            <Link
              href="/splits"
              className="inline-flex items-center gap-1 text-xs font-semibold text-trainer-warning/80 mt-2 hover:text-trainer-warning transition-colors"
            >
              Consider a lighter split <ChevronRight size={11} />
            </Link>
          </div>
          <button
            onClick={handleDismiss}
            className="w-6 h-6 rounded-full bg-white/6 flex items-center justify-center text-white/30 hover:text-white/60 transition-colors shrink-0"
          >
            <X size={12} />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
