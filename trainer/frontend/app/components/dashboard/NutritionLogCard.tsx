"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Flame, ChevronDown, ChevronUp, Check } from "lucide-react";
import { useNutritionStore } from "@/app/store/nutritionStore";
import { useUserStore } from "@/app/store/userStore";
import { cn } from "@/app/lib/utils";

// ─── Macro progress bar ───────────────────────────────────────────────────────

function MacroBar({
  label,
  logged,
  target,
  color,
  unit = "g",
}: {
  label: string;
  logged: number;
  target: number;
  color: string;
  unit?: string;
}) {
  const pct = target > 0 ? Math.min(logged / target, 1) : 0;
  const over = target > 0 && logged > target;

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-semibold text-white/60">{label}</span>
        <span className={cn("text-xs font-bold tabular-nums", over ? "text-trainer-warning" : "text-white/70")}>
          {Math.round(logged)}<span className="text-white/30 font-normal">/{target}{unit}</span>
        </span>
      </div>
      <div className="h-2 bg-white/6 rounded-full overflow-hidden">
        <motion.div
          className={cn("h-full rounded-full", color)}
          initial={{ width: 0 }}
          animate={{ width: `${pct * 100}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}

// ─── Number stepper ───────────────────────────────────────────────────────────

function Stepper({
  label,
  value,
  onChange,
  step = 1,
  unit = "g",
  color,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  step?: number;
  unit?: string;
  color: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <p className="text-[11px] text-white/40 uppercase tracking-wide font-medium">{label}</p>
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => onChange(Math.max(0, value - step))}
          className="w-7 h-7 rounded-[6px] bg-white/6 border border-white/8 text-white/50 text-sm font-bold hover:text-white transition-colors"
        >
          −
        </button>
        <input
          type="number"
          value={value || ""}
          onChange={(e) => {
            const v = parseInt(e.target.value);
            if (!isNaN(v) && v >= 0) onChange(v);
          }}
          className="w-16 text-center text-sm font-bold text-white bg-white/5 border border-white/8 rounded-[6px] py-1.5 focus:outline-none focus:border-trainer-indigo/40 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
          style={{ fontSize: "16px" }}
        />
        <button
          onClick={() => onChange(value + step)}
          className={cn("w-7 h-7 rounded-[6px] border text-sm font-bold transition-colors", color)}
        >
          +
        </button>
        <span className="text-xs text-white/35">{unit}</span>
      </div>
    </div>
  );
}

// ─── Card ─────────────────────────────────────────────────────────────────────

export function NutritionLogCard() {
  const { profile } = useUserStore();
  const { logMacros, getToday } = useNutritionStore();

  const targets = profile?.nutritionTargets;
  const todayLog = getToday();

  const [expanded, setExpanded] = useState(false);
  const [protein, setProtein] = useState(todayLog?.proteinG ?? 0);
  const [carbs, setCarbs] = useState(todayLog?.carbsG ?? 0);
  const [fat, setFat] = useState(todayLog?.fatG ?? 0);
  const [saved, setSaved] = useState(false);

  if (!targets) return null;

  const loggedCalories = Math.round(protein * 4 + carbs * 4 + fat * 9);
  const calPct = targets.dailyCalories > 0 ? loggedCalories / targets.dailyCalories : 0;
  const calOver = loggedCalories > targets.dailyCalories;

  function handleSave() {
    logMacros({ proteinG: protein, carbsG: carbs, fatG: fat, calories: loggedCalories });
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  return (
    <div className="bg-trainer-surface border border-white/8 rounded-[18px] overflow-hidden">
      {/* Header row */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="flex items-center gap-3 w-full px-4 py-3.5 text-left"
      >
        <div className="w-9 h-9 rounded-[10px] bg-trainer-warning/12 flex items-center justify-center shrink-0">
          <Flame size={16} className="text-trainer-warning" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-white">Today&apos;s Nutrition</p>
          <p className="text-[11px] text-white/35 mt-0.5">
            {todayLog
              ? `${todayLog.calories} kcal logged`
              : `Target: ${targets.dailyCalories} kcal`}
          </p>
        </div>
        {/* Calorie ring */}
        <div className="relative w-9 h-9 shrink-0">
          <svg width="36" height="36" className="-rotate-90">
            <circle cx="18" cy="18" r="14" strokeWidth="3" stroke="rgba(255,255,255,0.06)" fill="none" />
            <circle
              cx="18" cy="18" r="14"
              strokeWidth="3"
              stroke={calOver ? "#F59E0B" : "#6C63FF"}
              fill="none"
              strokeLinecap="round"
              strokeDasharray={2 * Math.PI * 14}
              strokeDashoffset={2 * Math.PI * 14 * (1 - Math.min(calPct, 1))}
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-[8px] font-bold text-white/60">
            {Math.round(calPct * 100)}%
          </span>
        </div>
        {expanded ? <ChevronUp size={14} className="text-white/30 shrink-0" /> : <ChevronDown size={14} className="text-white/30 shrink-0" />}
      </button>

      {/* Macro progress bars — always visible */}
      <div className="px-4 pb-3 flex flex-col gap-2.5">
        <MacroBar label="Protein" logged={todayLog?.proteinG ?? 0} target={targets.proteinG} color="bg-sky-500" />
        <MacroBar label="Carbs" logged={todayLog?.carbsG ?? 0} target={targets.carbsG} color="bg-amber-500" />
        <MacroBar label="Fat" logged={todayLog?.fatG ?? 0} target={targets.fatG} color="bg-rose-500" />
      </div>

      {/* Expandable logging panel */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="overflow-hidden border-t border-white/6"
          >
            <div className="px-4 py-4 flex flex-col gap-4">
              <p className="text-[11px] text-white/30 uppercase tracking-widest font-semibold">Log Today</p>

              {/* Steppers grid */}
              <div className="grid grid-cols-3 gap-3">
                <Stepper label="Protein" value={protein} onChange={setProtein} step={5} color="bg-sky-500/15 border-sky-500/20 text-sky-400 hover:bg-sky-500/25" />
                <Stepper label="Carbs" value={carbs} onChange={setCarbs} step={10} color="bg-amber-500/15 border-amber-500/20 text-amber-400 hover:bg-amber-500/25" />
                <Stepper label="Fat" value={fat} onChange={setFat} step={5} color="bg-rose-500/15 border-rose-500/20 text-rose-400 hover:bg-rose-500/25" />
              </div>

              {/* Calorie preview */}
              <div className="flex items-center justify-between px-3 py-2 rounded-[10px] bg-trainer-elevated">
                <span className="text-xs text-white/40">Calculated calories</span>
                <span className={cn("text-sm font-bold tabular-nums", calOver ? "text-trainer-warning" : "text-white/75")}>
                  {loggedCalories} kcal
                  {calOver && <span className="text-xs font-normal text-trainer-warning/60 ml-1">over</span>}
                </span>
              </div>

              {/* Save button */}
              <button
                onClick={handleSave}
                className={cn(
                  "w-full py-3 rounded-[12px] text-sm font-bold flex items-center justify-center gap-2 transition-all",
                  saved
                    ? "bg-trainer-success text-white"
                    : "bg-trainer-indigo text-white active:bg-trainer-indigo/80"
                )}
              >
                {saved ? <><Check size={15} /> Saved</> : "Save Today's Macros"}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
