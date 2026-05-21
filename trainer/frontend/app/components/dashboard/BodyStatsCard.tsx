"use client";

import { useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Scale, TrendingUp, TrendingDown, Minus, Plus, Check, X, Ruler } from "lucide-react";
import { useProgressStore, type BodyMeasurements } from "@/app/store/progressStore";
import { useUserStore } from "@/app/store/userStore";
import { useSettingsStore } from "@/app/store/settingsStore";
import { cn, formatRelativeDate } from "@/app/lib/utils";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function bmi(weightKg: number, heightCm: number): number | null {
  if (!weightKg || !heightCm) return null;
  return Math.round((weightKg / (heightCm / 100) ** 2) * 10) / 10;
}

function bmiCategory(b: number): { label: string; color: string } {
  if (b < 18.5) return { label: "Underweight", color: "text-sky-400" };
  if (b < 25)   return { label: "Normal",      color: "text-trainer-success" };
  if (b < 30)   return { label: "Overweight",  color: "text-trainer-warning" };
  return { label: "Obese",        color: "text-red-400" };
}

function estimateNavyBF(
  gender: "male" | "female" | "other",
  heightCm: number,
  waistCm: number,
  neckCm: number,
  hipsCm?: number
): number | null {
  if (heightCm <= 0 || waistCm <= 0 || neckCm <= 0) return null;
  const h = Math.log10(heightCm);
  if (gender === "male") {
    if (waistCm <= neckCm) return null;
    return Math.round((86.010 * Math.log10(waistCm - neckCm) - 70.041 * h + 36.76) * 10) / 10;
  }
  if (!hipsCm || hipsCm <= 0) return null;
  if (waistCm + hipsCm <= neckCm) return null;
  return Math.round((163.205 * Math.log10(waistCm + hipsCm - neckCm) - 97.684 * h - 78.387) * 10) / 10;
}

function bfCategory(bf: number, gender: "male" | "female" | "other"): { label: string; color: string } {
  if (gender === "female") {
    if (bf < 14) return { label: "Essential",  color: "text-blue-400" };
    if (bf < 21) return { label: "Athletic",   color: "text-trainer-success" };
    if (bf < 25) return { label: "Fitness",    color: "text-trainer-indigo" };
    if (bf < 32) return { label: "Average",    color: "text-amber-400" };
    return { label: "Above avg", color: "text-red-400" };
  }
  if (bf < 6)  return { label: "Essential",  color: "text-blue-400" };
  if (bf < 14) return { label: "Athletic",   color: "text-trainer-success" };
  if (bf < 18) return { label: "Fitness",    color: "text-trainer-indigo" };
  if (bf < 25) return { label: "Average",    color: "text-amber-400" };
  return { label: "Above avg", color: "text-red-400" };
}

// Mini sparkline for weight trend
function WeightSparkline({ values }: { values: number[] }) {
  if (values.length < 2) return null;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 0.5;
  const W = 56, H = 20, pad = 2;
  const pts = values.map((v, i) => {
    const x = pad + (i / (values.length - 1)) * (W - pad * 2);
    const y = H - pad - ((v - min) / range) * (H - pad * 2);
    return `${x},${y}`;
  }).join(" ");
  const rising = values[values.length - 1] > values[0];
  const flat   = values[values.length - 1] === values[0];
  const color  = flat ? "rgba(255,255,255,0.2)" : rising ? "rgba(248,113,113,0.6)" : "rgba(74,222,128,0.6)";
  const dotColor = flat ? "rgba(255,255,255,0.4)" : rising ? "rgb(248,113,113)" : "rgb(74,222,128)";
  const lastX  = pad + ((values.length - 1) / (values.length - 1)) * (W - pad * 2);
  const lastY  = H - pad - ((values[values.length - 1] - min) / range) * (H - pad * 2);
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="shrink-0">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={lastX} cy={lastY} r="2.5" fill={dotColor} />
    </svg>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function BodyStatsCard() {
  const { bodyWeightLogs, bodyMeasurementLogs, addWeightLog, addMeasurementLog } = useProgressStore();
  const { profile } = useUserStore();
  const { settings } = useSettingsStore();

  const [showInput, setShowInput] = useState(false);
  const [rawVal, setRawVal] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const [showMeasure, setShowMeasure] = useState(false);
  const [waistRaw, setWaistRaw] = useState("");
  const [neckRaw, setNeckRaw] = useState("");
  const [hipsRaw, setHipsRaw] = useState("");
  const isFemale = profile?.gender === "female";

  const unit = (settings.weightUnit ?? profile?.units ?? "kg") as "kg" | "lb";

  const { current, trend7d, sparkValues, lastLogDate } = useMemo(() => {
    if (bodyWeightLogs.length === 0) return { current: null, trend7d: null, sparkValues: [], lastLogDate: null };

    const sorted = [...bodyWeightLogs].sort((a, b) => b.date.localeCompare(a.date));
    const now = sorted[0].weightKg;

    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 7);
    const week7 = sorted.find((l) => new Date(l.date) <= cutoff);
    const diff = week7 ? Math.round((now - week7.weightKg) * 10) / 10 : null;

    const sparkValues = sorted.slice(0, 8).reverse().map((l) => l.weightKg);
    return { current: now, trend7d: diff, sparkValues, lastLogDate: sorted[0].date };
  }, [bodyWeightLogs]);

  const bmiValue = useMemo(
    () => current && profile?.heightCm ? bmi(current, profile.heightCm) : null,
    [current, profile?.heightCm]
  );

  const bodyFat = useMemo(() => {
    if (!profile || !profile.heightCm) return null;
    const latest = bodyMeasurementLogs[0]?.measurements;
    if (!latest?.waistCm || !latest?.neckCm) return null;
    return estimateNavyBF(
      profile.gender ?? "male",
      profile.heightCm,
      latest.waistCm,
      latest.neckCm,
      latest.hipsCm
    );
  }, [bodyMeasurementLogs, profile]);

  function openInput() {
    setRawVal(current ? String(unit === "lb" ? Math.round(current * 22.0462) / 10 : current) : "");
    setShowInput(true);
    setTimeout(() => inputRef.current?.focus(), 80);
  }

  function cancelInput() {
    setShowInput(false);
    setRawVal("");
  }

  function confirmLog() {
    const parsed = parseFloat(rawVal.replace(",", "."));
    if (!isNaN(parsed) && parsed > 0) {
      const kg = unit === "lb" ? parsed / 2.20462 : parsed;
      addWeightLog(Math.round(kg * 100) / 100);
    }
    cancelInput();
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") confirmLog();
    if (e.key === "Escape") cancelInput();
  }

  function confirmMeasure() {
    const waist = parseFloat(waistRaw);
    const neck = parseFloat(neckRaw);
    if (isNaN(waist) || waist <= 0 || isNaN(neck) || neck <= 0) return;
    const m: BodyMeasurements = { waistCm: waist, neckCm: neck };
    const hips = parseFloat(hipsRaw);
    if (!isNaN(hips) && hips > 0) m.hipsCm = hips;
    addMeasurementLog(m);
    setShowMeasure(false);
    setWaistRaw(""); setNeckRaw(""); setHipsRaw("");
  }

  // Show minimal log-prompt card before first entry
  if (!current) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.06 }}
        className="bg-trainer-surface border border-white/8 rounded-[16px] p-4"
      >
        <div className="flex items-center gap-2 mb-3">
          <div className="w-7 h-7 rounded-[8px] bg-trainer-success/12 flex items-center justify-center">
            <Scale size={13} className="text-trainer-success" />
          </div>
          <p className="text-sm font-bold text-white flex-1">Body Stats</p>
        </div>
        <AnimatePresence mode="wait">
          {showInput ? (
            <motion.div key="input" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex items-center gap-2">
              <input
                ref={inputRef}
                type="number"
                step="0.1"
                value={rawVal}
                onChange={(e) => setRawVal(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={`Weight in ${unit}`}
                className="flex-1 bg-trainer-elevated border border-white/10 rounded-[10px] px-3 py-2 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-trainer-success/40"
              />
              <button onClick={confirmLog} className="w-8 h-8 rounded-[8px] bg-trainer-success/15 flex items-center justify-center text-trainer-success shrink-0">
                <Check size={13} />
              </button>
              <button onClick={cancelInput} className="w-8 h-8 rounded-[8px] bg-white/6 flex items-center justify-center text-white/40 shrink-0">
                <X size={13} />
              </button>
            </motion.div>
          ) : (
            <motion.button
              key="prompt"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={openInput}
              className="w-full flex items-center justify-center gap-2 bg-trainer-elevated border border-dashed border-white/10 rounded-[10px] py-3 text-sm text-white/40 hover:text-white/60 hover:border-white/20 transition-colors"
            >
              <Plus size={13} />
              Log your weight to track progress
            </motion.button>
          )}
        </AnimatePresence>
      </motion.div>
    );
  }

  const displayWeight = unit === "lb" ? Math.round(current * 22.0462) / 10 : current;
  const displayTrend  = trend7d !== null
    ? (unit === "lb" ? Math.round(trend7d * 2.20462 * 10) / 10 : trend7d)
    : null;

  const TrendIcon = displayTrend === null
    ? null
    : displayTrend === 0
    ? Minus
    : displayTrend > 0
    ? TrendingUp
    : TrendingDown;

  const trendColor = displayTrend === null || displayTrend === 0
    ? "text-white/30"
    : displayTrend > 0
    ? "text-red-400"
    : "text-trainer-success";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.06 }}
      className="bg-trainer-surface border border-white/8 rounded-[16px] p-4"
    >
      <div className="flex items-center gap-2 mb-3">
        <div className="w-7 h-7 rounded-[8px] bg-trainer-success/12 flex items-center justify-center">
          <Scale size={13} className="text-trainer-success" />
        </div>
        <p className="text-sm font-bold text-white flex-1">Body Stats</p>
        {/* Measure button */}
        <button
          onClick={() => { setShowMeasure((v) => !v); setShowInput(false); }}
          className={cn(
            "w-7 h-7 rounded-full flex items-center justify-center transition-colors",
            showMeasure
              ? "bg-sky-400/20 text-sky-400"
              : "bg-white/8 text-white/30 hover:text-white/60"
          )}
          aria-label="Log measurements"
        >
          <Ruler size={11} />
        </button>
        {/* Weight log button */}
        <button
          onClick={showInput ? cancelInput : openInput}
          className="w-7 h-7 rounded-full bg-trainer-success/10 flex items-center justify-center text-trainer-success hover:bg-trainer-success/20 transition-colors"
          aria-label="Log weight"
        >
          {showInput ? <X size={11} /> : <Plus size={11} />}
        </button>
      </div>

      {/* Inline weight input */}
      <AnimatePresence>
        {showInput && (
          <motion.div
            key="weight-input"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden mb-3"
          >
            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                type="number"
                step="0.1"
                value={rawVal}
                onChange={(e) => setRawVal(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={`New weight (${unit})`}
                className="flex-1 bg-trainer-elevated border border-white/10 rounded-[10px] px-3 py-2 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-trainer-success/40 tabular-nums"
              />
              <button onClick={confirmLog} className="w-8 h-8 rounded-[8px] bg-trainer-success/15 flex items-center justify-center text-trainer-success shrink-0 hover:bg-trainer-success/25 transition-colors">
                <Check size={13} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Inline measurement form */}
      <AnimatePresence>
        {showMeasure && (
          <motion.div
            key="measure-form"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden mb-3"
          >
            <div className="bg-trainer-elevated rounded-[12px] p-3 flex flex-col gap-2.5">
              <p className="text-[10px] font-semibold text-sky-400/80 uppercase tracking-widest">Log Measurements (cm)</p>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-[10px] text-white/35 mb-1">Waist *</p>
                  <input
                    type="number"
                    step="0.5"
                    value={waistRaw}
                    onChange={(e) => setWaistRaw(e.target.value)}
                    placeholder="e.g. 80"
                    className="w-full bg-trainer-surface border border-white/10 rounded-[8px] px-2.5 py-1.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-sky-400/40 tabular-nums"
                  />
                </div>
                <div>
                  <p className="text-[10px] text-white/35 mb-1">Neck *</p>
                  <input
                    type="number"
                    step="0.5"
                    value={neckRaw}
                    onChange={(e) => setNeckRaw(e.target.value)}
                    placeholder="e.g. 38"
                    className="w-full bg-trainer-surface border border-white/10 rounded-[8px] px-2.5 py-1.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-sky-400/40 tabular-nums"
                  />
                </div>
                {isFemale && (
                  <div className="col-span-2">
                    <p className="text-[10px] text-white/35 mb-1">Hips (for body fat)</p>
                    <input
                      type="number"
                      step="0.5"
                      value={hipsRaw}
                      onChange={(e) => setHipsRaw(e.target.value)}
                      placeholder="e.g. 95"
                      className="w-full bg-trainer-surface border border-white/10 rounded-[8px] px-2.5 py-1.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-sky-400/40 tabular-nums"
                    />
                  </div>
                )}
              </div>
              <button
                onClick={confirmMeasure}
                disabled={!waistRaw || !neckRaw}
                className="w-full py-2 rounded-[8px] bg-sky-400/15 text-sky-400 text-xs font-semibold hover:bg-sky-400/25 transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
              >
                <Check size={12} />
                Save Measurements
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-end justify-between gap-3">
        {/* Weight + trend */}
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-black text-white tabular-nums leading-none">
              {displayWeight}
            </span>
            <span className="text-sm text-white/35">{unit}</span>
          </div>

          {displayTrend !== null && TrendIcon && (
            <div className={cn("flex items-center gap-1 mt-1", trendColor)}>
              <TrendIcon size={11} />
              <span className="text-[11px] font-semibold tabular-nums">
                {displayTrend > 0 ? "+" : ""}{displayTrend} {unit} vs 7 days ago
              </span>
            </div>
          )}
          {lastLogDate && (
            <p className="text-[10px] text-white/20 mt-0.5">{formatRelativeDate(lastLogDate)}</p>
          )}
        </div>

        {/* Sparkline */}
        <WeightSparkline values={sparkValues} />
      </div>

      {/* BMI + BF% row */}
      {(bmiValue !== null || bodyFat !== null) && (
        <div className="grid grid-cols-2 gap-2 mt-3">
          {bmiValue !== null && (
            <div className="bg-trainer-elevated rounded-[10px] px-3 py-2">
              <p className="text-[9px] text-white/25 uppercase tracking-widest font-semibold mb-0.5">BMI</p>
              <p className="text-base font-bold text-white tabular-nums">{bmiValue}</p>
              <p className={cn("text-[10px] font-semibold mt-0.5", bmiCategory(bmiValue).color)}>
                {bmiCategory(bmiValue).label}
              </p>
            </div>
          )}
          {bodyFat !== null && (
            <div className="bg-trainer-elevated rounded-[10px] px-3 py-2">
              <p className="text-[9px] text-white/25 uppercase tracking-widest font-semibold mb-0.5">Body Fat</p>
              <div className="flex items-baseline gap-0.5">
                <p className="text-base font-bold text-white tabular-nums">{bodyFat}</p>
                <span className="text-xs text-white/35">%</span>
              </div>
              <p className={cn("text-[10px] font-semibold mt-0.5", bfCategory(bodyFat, profile?.gender ?? "male").color)}>
                {bfCategory(bodyFat, profile?.gender ?? "male").label}
              </p>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}
