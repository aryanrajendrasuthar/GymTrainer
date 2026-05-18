"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Scale, Minus, Plus, Check, X } from "lucide-react";
import { useUserStore } from "@/app/store/userStore";
import { useProgressStore } from "@/app/store/progressStore";
import { useSettingsStore } from "@/app/store/settingsStore";
import { progressApi } from "@/app/lib/api";
import { kgToLbs, lbsToKg } from "@/app/lib/nutrition";
import { cn } from "@/app/lib/utils";

export function DailyCheckinCard() {
  const { profile, accessToken } = useUserStore();
  const { bodyWeightLogs, addWeightLog } = useProgressStore();
  const { settings } = useSettingsStore();

  const unit = (settings.weightUnit ?? profile?.units ?? "kg") as "kg" | "lb";
  const today = new Date().toISOString().split("T")[0];
  const hasLoggedToday = bodyWeightLogs.some((l) => l.date === today);

  const lastKg =
    bodyWeightLogs[0]?.weightKg ?? profile?.weightKg ?? 70;

  const displayInitial = unit === "lb" ? Math.round(kgToLbs(lastKg)) : lastKg;

  const [weight, setWeight] = useState(displayInitial);
  const [done, setDone] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  if (hasLoggedToday || dismissed) return null;

  const adjust = (delta: number) =>
    setWeight((w) => Math.round((Math.max(30, w + delta) * 10)) / 10);

  function handleLog() {
    const kg = unit === "lb" ? lbsToKg(weight) : weight;
    addWeightLog(kg);
    if (accessToken) {
      progressApi.logWeight(accessToken, kg).catch(() => {});
    }
    setDone(true);
    setTimeout(() => setDone(false), 1500);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.3, delay: 0.15 }}
    >
      <AnimatePresence mode="wait">
        {done ? (
          <motion.div
            key="done"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-3 p-4 rounded-[16px] bg-trainer-success/10 border border-trainer-success/25"
          >
            <div className="w-8 h-8 rounded-full bg-trainer-success/20 flex items-center justify-center">
              <Check size={16} className="text-trainer-success" />
            </div>
            <p className="text-sm font-semibold text-trainer-success">
              Weight logged for today
            </p>
          </motion.div>
        ) : (
          <motion.div
            key="form"
            className="rounded-[16px] bg-trainer-surface border border-white/8 p-4"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-[8px] bg-sky-400/15 flex items-center justify-center">
                  <Scale size={14} className="text-sky-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">Daily check-in</p>
                  <p className="text-[11px] text-white/35">Log today&apos;s weight</p>
                </div>
              </div>
              <button
                onClick={() => setDismissed(true)}
                className="w-7 h-7 rounded-full bg-white/6 flex items-center justify-center text-white/30 hover:text-white/60 transition-colors"
              >
                <X size={13} />
              </button>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => adjust(-0.5)}
                className="w-10 h-10 rounded-[10px] bg-trainer-elevated border border-white/10 flex items-center justify-center hover:border-white/25 active:scale-95 transition-all"
              >
                <Minus size={15} className="text-white/60" />
              </button>

              <div className="flex-1 text-center">
                <span
                  className={cn(
                    "text-2xl font-bold text-white tabular-nums",
                  )}
                >
                  {weight}
                </span>
                <span className="text-sm text-white/40 ml-1">{unit}</span>
              </div>

              <button
                onClick={() => adjust(0.5)}
                className="w-10 h-10 rounded-[10px] bg-trainer-elevated border border-white/10 flex items-center justify-center hover:border-white/25 active:scale-95 transition-all"
              >
                <Plus size={15} className="text-white/60" />
              </button>

              <button
                onClick={handleLog}
                className="px-4 h-10 rounded-[10px] bg-trainer-indigo text-white text-sm font-bold hover:bg-trainer-indigo-hover active:scale-95 transition-all"
              >
                Log
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
