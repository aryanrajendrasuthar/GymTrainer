"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Flame, ChevronDown, ChevronUp, Check, BookmarkPlus, X, Zap } from "lucide-react";
import { useNutritionStore, type MealPreset, type DietType, DIET_TYPE_META } from "@/app/store/nutritionStore";
import { useUserStore } from "@/app/store/userStore";
import { cn } from "@/app/lib/utils";

// ─── Diet filter options ──────────────────────────────────────────────────────

const DIET_FILTERS: Array<{ key: DietType | "all"; label: string; emoji: string }> = [
  { key: "all",              label: "All",           emoji: ""   },
  { key: "veg",              label: "Veg",           emoji: "🌱" },
  { key: "veg-egg",          label: "Veg + Eggs",    emoji: "🥚" },
  { key: "non-veg-chicken",  label: "Chicken",       emoji: "🍗" },
  { key: "non-veg-all",      label: "All Meat",      emoji: "🥩" },
];

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

// ─── Macro Split Ring ─────────────────────────────────────────────────────────

function MacroRing({
  proteinG,
  carbsG,
  fatG,
}: {
  proteinG: number;
  carbsG: number;
  fatG: number;
}) {
  const proteinKcal = proteinG * 4;
  const carbsKcal   = carbsG * 4;
  const fatKcal     = fatG * 9;
  const total       = proteinKcal + carbsKcal + fatKcal;
  if (total === 0) return null;

  const R  = 36;      // outer radius
  const r  = 26;      // inner radius (donut hole)
  const CX = 44;
  const CY = 44;
  const circumference = 2 * Math.PI * R;

  // Build arcs: protein (sky), carbs (amber), fat (rose)
  const slices = [
    { label: "Protein", kcal: proteinKcal, color: "#38bdf8", pct: proteinKcal / total },
    { label: "Carbs",   kcal: carbsKcal,   color: "#f59e0b", pct: carbsKcal / total   },
    { label: "Fat",     kcal: fatKcal,     color: "#f43f5e", pct: fatKcal / total     },
  ];

  let offset = 0;
  const arcs = slices.map((s) => {
    const dashArray = s.pct * circumference;
    const dashOffset = circumference - offset * circumference;
    offset += s.pct;
    return { ...s, dashArray, dashOffset };
  });

  return (
    <div className="flex items-center gap-4 px-3 py-3 bg-trainer-elevated rounded-[12px]">
      {/* SVG donut */}
      <svg width={88} height={88} viewBox="0 0 88 88" className="-rotate-90 shrink-0">
        {/* track */}
        <circle cx={CX} cy={CY} r={R} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={R - r} />
        {arcs.map((arc) => (
          <circle
            key={arc.label}
            cx={CX}
            cy={CY}
            r={R}
            fill="none"
            stroke={arc.color}
            strokeWidth={R - r}
            strokeDasharray={`${arc.dashArray} ${circumference}`}
            strokeDashoffset={arc.dashOffset}
            strokeLinecap="butt"
          />
        ))}
        {/* Centre hole label */}
        <text
          x={CX}
          y={CY + 4}
          textAnchor="middle"
          fontSize="10"
          fontWeight="700"
          fill="rgba(255,255,255,0.7)"
          className="rotate-90"
          style={{ transform: `rotate(90deg)`, transformOrigin: `${CX}px ${CY}px` }}
        >
          {Math.round(total)}
        </text>
        <text
          x={CX}
          y={CY + 14}
          textAnchor="middle"
          fontSize="7"
          fill="rgba(255,255,255,0.3)"
          style={{ transform: `rotate(90deg)`, transformOrigin: `${CX}px ${CY}px` }}
        >
          kcal
        </text>
      </svg>

      {/* Legend */}
      <div className="flex flex-col gap-1.5 flex-1 min-w-0">
        {slices.map((s) => (
          <div key={s.label} className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <div className="w-2 h-2 rounded-full shrink-0" style={{ background: s.color }} />
              <span className="text-xs text-white/50 truncate">{s.label}</span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-xs font-bold text-white/75 tabular-nums">
                {s.label === "Protein" ? `${proteinG}g` : s.label === "Carbs" ? `${carbsG}g` : `${fatG}g`}
              </span>
              <span className="text-[10px] text-white/25 tabular-nums w-8 text-right">
                {Math.round(s.pct * 100)}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Card ─────────────────────────────────────────────────────────────────────

export function NutritionLogCard() {
  const { profile } = useUserStore();
  const { logMacros, addMacros, getToday, getLast, mealPresets, savePreset, deletePreset } = useNutritionStore();

  const targets = profile?.nutritionTargets;
  const todayLog = getToday();
  const last7Logs = getLast(7);

  const [expanded, setExpanded] = useState(false);
  const [protein, setProtein] = useState(todayLog?.proteinG ?? 0);
  const [carbs, setCarbs] = useState(todayLog?.carbsG ?? 0);
  const [fat, setFat] = useState(todayLog?.fatG ?? 0);
  const [saved, setSaved] = useState(false);

  // Preset save form state
  const [showSavePreset, setShowSavePreset] = useState(false);
  const [savePresetName, setSavePresetName] = useState("");
  const [saveDietType, setSaveDietType] = useState<DietType | null>(null);

  // Quick-add filter
  const [dietFilter, setDietFilter] = useState<DietType | "all">("all");
  const [addedPresetId, setAddedPresetId] = useState<string | null>(null);

  if (!targets) return null;

  const loggedCalories = Math.round(protein * 4 + carbs * 4 + fat * 9);
  const calPct = targets.dailyCalories > 0 ? loggedCalories / targets.dailyCalories : 0;
  const calOver = loggedCalories > targets.dailyCalories;

  function handleSave() {
    logMacros({ proteinG: protein, carbsG: carbs, fatG: fat, calories: loggedCalories });
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  function handleAddPreset(preset: MealPreset) {
    addMacros({ proteinG: preset.proteinG, carbsG: preset.carbsG, fatG: preset.fatG, calories: preset.calories });
    setAddedPresetId(preset.id);
    setTimeout(() => setAddedPresetId(null), 1200);
  }

  function handleSavePreset() {
    if (!savePresetName.trim() || loggedCalories === 0 || !saveDietType) return;
    savePreset({
      name: savePresetName.trim(),
      calories: loggedCalories,
      proteinG: protein,
      carbsG: carbs,
      fatG: fat,
      dietType: saveDietType,
    });
    setSavePresetName("");
    setSaveDietType(null);
    setShowSavePreset(false);
  }

  const filteredPresets = mealPresets.filter((p) =>
    dietFilter === "all" ? true : p.dietType === dietFilter || p.dietType === undefined
  );

  // Only show diet filter row if there are presets with at least two distinct diet types
  const distinctDietTypes = new Set(mealPresets.map((p) => p.dietType).filter(Boolean));
  const showDietFilter = mealPresets.length >= 2 && distinctDietTypes.size >= 2;

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
              ? calOver
                ? `${todayLog.calories} kcal · ${todayLog.calories - targets.dailyCalories} over`
                : `${todayLog.calories} kcal · ${targets.dailyCalories - todayLog.calories} remaining`
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
        {last7Logs.length > 1 && targets.proteinG > 0 && (() => {
          const compliance = last7Logs.filter((l) => l.proteinG >= targets.proteinG * 0.9).length;
          return compliance > 0 ? (
            <div className="flex justify-end">
              <span className={cn(
                "text-[9px] font-bold px-1.5 py-0.5 rounded-full border tabular-nums",
                compliance >= 5
                  ? "text-trainer-success bg-trainer-success/8 border-trainer-success/20"
                  : compliance >= 3
                  ? "text-amber-400 bg-amber-400/8 border-amber-400/20"
                  : "text-white/25 bg-white/4 border-white/10"
              )}>
                {compliance}/7d protein ✓
              </span>
            </div>
          ) : null;
        })()}
      </div>

      {/* 7-day calorie history bars */}
      {!expanded && last7Logs.length > 1 && targets && (
        <div className="px-4 pb-3">
          <div className="flex items-end gap-1 h-7">
            {Array.from({ length: 7 }).map((_, i) => {
              const d = new Date();
              d.setDate(d.getDate() - (6 - i));
              const dateStr = d.toISOString().slice(0, 10);
              const entry = last7Logs.find((l) => l.date === dateStr);
              const pct = entry ? Math.min(1.15, entry.calories / targets.dailyCalories) : 0;
              const over = pct > 1;
              const barColor = !entry ? "bg-white/6" : over ? "bg-trainer-warning/60" : "bg-trainer-indigo/60";
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
                  <div
                    className={cn("w-full rounded-[3px]", barColor)}
                    style={{ height: `${Math.max(3, pct * 24)}px` }}
                  />
                  <span className="text-[8px] text-white/20">
                    {d.toLocaleDateString("en-US", { weekday: "narrow" })}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

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

              {/* Macro split ring — only when values are entered */}
              {loggedCalories > 0 && (
                <MacroRing proteinG={protein} carbsG={carbs} fatG={fat} />
              )}

              {/* Calorie preview */}
              <div className="flex items-center justify-between px-3 py-2 rounded-[10px] bg-trainer-elevated">
                <span className="text-xs text-white/40">Calculated calories</span>
                <span className={cn("text-sm font-bold tabular-nums", calOver ? "text-trainer-warning" : "text-white/75")}>
                  {loggedCalories} kcal
                  {calOver && <span className="text-xs font-normal text-trainer-warning/60 ml-1">over</span>}
                </span>
              </div>

              {/* Meal presets quick-add */}
              {mealPresets.length > 0 && (
                <div>
                  <p className="text-[11px] text-white/30 uppercase tracking-widest font-semibold mb-2">Quick Add</p>

                  {/* Diet type filter tabs */}
                  {showDietFilter && (
                    <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-2 mb-2 -mx-4 px-4">
                      {DIET_FILTERS.map((f) => {
                        const count = f.key === "all"
                          ? mealPresets.length
                          : mealPresets.filter((p) => p.dietType === f.key || (f.key !== "all" && p.dietType === undefined)).length;
                        if (f.key !== "all" && count === 0) return null;
                        return (
                          <button
                            key={f.key}
                            onClick={() => setDietFilter(f.key)}
                            className={cn(
                              "shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-all whitespace-nowrap",
                              dietFilter === f.key
                                ? "bg-trainer-indigo/15 border-trainer-indigo/35 text-white"
                                : "bg-white/4 border-white/8 text-white/35 hover:text-white/60"
                            )}
                          >
                            {f.emoji && <span>{f.emoji}</span>}
                            {f.label}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2">
                    {filteredPresets.length === 0 ? (
                      <p className="text-xs text-white/20 py-1">No presets for this diet type.</p>
                    ) : (
                      filteredPresets.map((preset) => {
                        const meta = preset.dietType ? DIET_TYPE_META[preset.dietType] : null;
                        return (
                          <div key={preset.id} className="flex items-center gap-1 group">
                            <button
                              onClick={() => handleAddPreset(preset)}
                              className={cn(
                                "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all",
                                addedPresetId === preset.id
                                  ? "bg-trainer-success/15 border-trainer-success/30 text-trainer-success"
                                  : "bg-white/5 border-white/10 text-white/60 hover:border-trainer-indigo/30 hover:text-white/80"
                              )}
                            >
                              {addedPresetId === preset.id ? (
                                <>
                                  <Zap size={9} className="text-trainer-success" />
                                  Added!
                                </>
                              ) : (
                                <>
                                  {meta && <span className="text-[11px] leading-none">{meta.emoji}</span>}
                                  {preset.name}
                                  <span className="text-white/30 text-[10px]">{preset.calories}kcal</span>
                                </>
                              )}
                            </button>
                            <button
                              onClick={() => deletePreset(preset.id)}
                              className="opacity-0 group-hover:opacity-100 w-4 h-4 rounded-full bg-white/8 flex items-center justify-center text-white/30 hover:text-red-400 transition-all"
                            >
                              <X size={8} />
                            </button>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}

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

              {/* Save as meal preset */}
              <AnimatePresence>
                {!showSavePreset ? (
                  <button
                    onClick={() => setShowSavePreset(true)}
                    className="flex items-center justify-center gap-1.5 w-full py-2 text-xs text-white/30 hover:text-white/55 transition-colors"
                  >
                    <BookmarkPlus size={12} />
                    Save as meal preset
                  </button>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="flex flex-col gap-2.5 p-3 bg-trainer-elevated rounded-[12px] border border-white/8">
                      <div className="flex items-center justify-between">
                        <p className="text-[11px] text-white/40 font-semibold uppercase tracking-widest">New Preset</p>
                        <button
                          onClick={() => { setShowSavePreset(false); setSavePresetName(""); setSaveDietType(null); }}
                          className="w-6 h-6 rounded-full bg-white/6 flex items-center justify-center text-white/30 hover:text-white/60"
                        >
                          <X size={11} />
                        </button>
                      </div>

                      {/* Name input */}
                      <input
                        type="text"
                        placeholder="Meal name (e.g. Dal & rice)"
                        value={savePresetName}
                        onChange={(e) => setSavePresetName(e.target.value)}
                        className="w-full bg-trainer-surface border border-white/10 rounded-[8px] px-3 py-2 text-xs text-white placeholder:text-white/20 focus:outline-none focus:border-trainer-indigo/40"
                        style={{ fontSize: "16px" }}
                        autoFocus
                      />

                      {/* Diet type selector */}
                      <div>
                        <p className="text-[10px] text-white/30 mb-1.5">Diet type</p>
                        <div className="grid grid-cols-2 gap-1.5">
                          {(Object.entries(DIET_TYPE_META) as [DietType, typeof DIET_TYPE_META[DietType]][]).map(([key, meta]) => (
                            <button
                              key={key}
                              onClick={() => setSaveDietType(key)}
                              className={cn(
                                "flex items-center gap-1.5 px-2.5 py-2 rounded-[8px] text-xs font-semibold border transition-all text-left",
                                saveDietType === key
                                  ? "bg-trainer-indigo/15 border-trainer-indigo/35 text-white"
                                  : "bg-white/4 border-white/8 text-white/40 hover:text-white/65 hover:border-white/15"
                              )}
                            >
                              <span className="text-base leading-none">{meta.emoji}</span>
                              <span>{meta.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      <button
                        onClick={handleSavePreset}
                        disabled={!savePresetName.trim() || !saveDietType || loggedCalories === 0}
                        className="w-full py-2 rounded-[8px] bg-trainer-indigo/15 border border-trainer-indigo/30 text-trainer-indigo text-xs font-bold hover:bg-trainer-indigo/25 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        Save Preset
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
