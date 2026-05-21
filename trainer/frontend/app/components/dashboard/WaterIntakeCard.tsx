"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Droplets, Plus, Zap } from "lucide-react";
import { useWaterStore } from "@/app/store/waterStore";
import { useProgressStore } from "@/app/store/progressStore";
import { useSessionStore } from "@/app/store/sessionStore";
import { cn } from "@/app/lib/utils";

const QUICK_ADD = [250, 500, 750] as const;
const DEFAULT_GOAL_ML = 2500;

function computeSmartGoal(weightKg: number, workedOutToday: boolean): number {
  const base = Math.round(weightKg * 35 / 50) * 50; // 35ml/kg rounded to nearest 50ml
  return base + (workedOutToday ? 500 : 0);
}

export function WaterIntakeCard() {
  const { todayIntakeMl, dailyGoalMl, logWater, setGoal, lastResetDate } = useWaterStore();
  const { bodyWeightLogs } = useProgressStore();
  const { recentSessions } = useSessionStore();
  const [customInput, setCustomInput] = useState("");

  const latestWeightKg = bodyWeightLogs[0]?.weightKg ?? 0;
  const todayStr = new Date().toISOString().split("T")[0];
  const workedOutToday = recentSessions.some((s) => s.date === todayStr);

  // Auto-set smart goal when we have body weight and goal is still at the factory default
  useEffect(() => {
    if (latestWeightKg > 0 && dailyGoalMl === DEFAULT_GOAL_ML) {
      const smart = computeSmartGoal(latestWeightKg, workedOutToday);
      setGoal(smart);
    }
  }, [latestWeightKg, workedOutToday, dailyGoalMl, setGoal]);

  const smartGoal = latestWeightKg > 0 ? computeSmartGoal(latestWeightKg, workedOutToday) : null;

  // Auto-reset if last log was a different day
  const today = new Date().toISOString().split("T")[0];
  const effectiveIntake = lastResetDate === today ? todayIntakeMl : 0;

  const pct = Math.min(100, Math.round((effectiveIntake / dailyGoalMl) * 100));
  const litres = (effectiveIntake / 1000).toFixed(1);
  const goalLitres = (dailyGoalMl / 1000).toFixed(1);

  const fillColor =
    pct >= 100 ? "bg-trainer-success" :
    pct >= 60  ? "bg-trainer-indigo" :
    pct >= 30  ? "bg-amber-400"       : "bg-red-400";

  const textColor =
    pct >= 100 ? "text-trainer-success" :
    pct >= 60  ? "text-trainer-indigo"  :
    pct >= 30  ? "text-amber-400"       : "text-red-400";

  function handleCustomAdd() {
    const ml = parseInt(customInput, 10);
    if (isNaN(ml) || ml <= 0) return;
    logWater(ml);
    setCustomInput("");
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-trainer-surface border border-white/8 rounded-[18px] p-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Droplets size={14} className="text-sky-400" />
          <p className="text-sm font-bold text-white">Water Intake</p>
          {workedOutToday && (
            <span className="flex items-center gap-0.5 text-[9px] font-bold text-trainer-success bg-trainer-success/10 px-1.5 py-0.5 rounded-full">
              <Zap size={8} />+500ml
            </span>
          )}
        </div>
        <div className="flex flex-col items-end">
          <p className="text-xs text-white/35">{litres} / {goalLitres} L</p>
          {smartGoal !== null && (
            <p className="text-[9px] text-white/20">Smart target</p>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-2 bg-white/8 rounded-full overflow-hidden mb-3">
        <motion.div
          className={cn("h-full rounded-full", fillColor)}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </div>

      {/* Percentage */}
      <p className={cn("text-2xl font-bold tabular-nums mb-1", textColor)}>
        {pct}%
        <span className="text-sm font-normal text-white/35 ml-1.5">of daily goal</span>
      </p>
      <p className={cn("text-[10px] mb-3 flex items-center gap-1.5", pct >= 100 ? "text-trainer-success/60" : "text-white/25")}>
        {pct >= 100
          ? "Daily goal achieved ✓"
          : <>
              {`~${(dailyGoalMl - effectiveIntake).toLocaleString()}ml to go · ~${Math.ceil((dailyGoalMl - effectiveIntake) / 250)} glasses`}
              {(() => {
                const hourFraction = new Date().getHours() / 24;
                const onPace = pct / 100 >= hourFraction;
                return (
                  <span className={cn(
                    "text-[9px] font-bold px-1.5 py-0.5 rounded-full border shrink-0",
                    onPace
                      ? "text-trainer-success bg-trainer-success/10 border-trainer-success/20"
                      : "text-amber-400 bg-amber-400/8 border-amber-400/20"
                  )}>
                    {onPace ? "On pace" : "Behind"}
                  </span>
                );
              })()}
            </>}
      </p>

      {/* Quick-add buttons */}
      <div className="flex gap-2">
        {QUICK_ADD.map((ml) => (
          <motion.button
            key={ml}
            whileTap={{ scale: 0.93 }}
            onClick={() => logWater(ml)}
            className="flex-1 flex items-center justify-center gap-1 py-2 rounded-[10px] bg-sky-400/10 border border-sky-400/20 text-sky-400 text-xs font-semibold hover:bg-sky-400/18 transition-colors"
          >
            <Plus size={10} />
            {ml < 1000 ? `${ml}ml` : `${ml / 1000}L`}
          </motion.button>
        ))}
        <div className="flex gap-1 flex-1">
          <input
            type="number"
            value={customInput}
            onChange={(e) => setCustomInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCustomAdd()}
            placeholder="ml"
            min="50"
            max="2000"
            className="w-full bg-trainer-elevated border border-white/10 rounded-[10px] px-2 py-2 text-xs text-white text-center placeholder:text-white/20 focus:outline-none focus:border-sky-400/40 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
            style={{ fontSize: "14px" }}
          />
          <button
            onClick={handleCustomAdd}
            disabled={!customInput || isNaN(parseInt(customInput))}
            className="w-8 rounded-[10px] bg-sky-400/10 border border-sky-400/20 text-sky-400 flex items-center justify-center hover:bg-sky-400/20 transition-colors disabled:opacity-30"
          >
            <Plus size={12} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
