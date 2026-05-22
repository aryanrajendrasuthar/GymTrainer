"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Flame, ChevronDown, ChevronUp } from "lucide-react";
import { calculateBMR, calculateTDEE } from "@/app/lib/nutrition";
import { cn } from "@/app/lib/utils";
import type { ActivityLevel } from "@/app/types";

const ACTIVITY_LEVELS: { key: ActivityLevel; label: string; desc: string }[] = [
  { key: "sedentary",   label: "Sedentary",    desc: "Desk job, no exercise"    },
  { key: "light",       label: "Light",         desc: "1–2 workouts / week"      },
  { key: "moderate",    label: "Moderate",      desc: "3–4 workouts / week"      },
  { key: "active",      label: "Active",        desc: "5–6 workouts / week"      },
  { key: "very-active", label: "Very Active",   desc: "Intense training daily"   },
];

const SCENARIOS = [
  { key: "cut",      label: "Cut",      delta: -400, textColor: "text-amber-400",   bgColor: "bg-amber-400/10",   borderColor: "border-amber-400/20"   },
  { key: "maintain", label: "Maintain", delta: 0,    textColor: "text-sky-400",     bgColor: "bg-sky-400/10",     borderColor: "border-sky-400/20"     },
  { key: "bulk",     label: "Bulk",     delta: 250,  textColor: "text-emerald-400", bgColor: "bg-emerald-400/10", borderColor: "border-emerald-400/20" },
] as const;

type ScenarioKey = "cut" | "maintain" | "bulk";

interface Props {
  weightKg: number;
  heightCm: number;
  age: number;
  gender: "male" | "female" | "other";
  activityLevel: ActivityLevel;
}

export function TDEECard({ weightKg, heightCm, age, gender, activityLevel }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [scenario, setScenario] = useState<ScenarioKey>("maintain");

  const bmr   = Math.round(calculateBMR(weightKg, heightCm, age, gender));
  const tdee  = calculateTDEE(bmr, activityLevel);
  const sel   = SCENARIOS.find((s) => s.key === scenario)!;
  const target = Math.max(1200, tdee + sel.delta);

  const proteinG = Math.round(weightKg * (scenario === "cut" ? 2.2 : scenario === "bulk" ? 2.0 : 1.8));
  const fatG     = Math.round((target * 0.28) / 9);
  const carbsG   = Math.round(Math.max(0, target - proteinG * 4 - fatG * 9) / 4);

  return (
    <div className="bg-trainer-surface border border-white/8 rounded-[16px] overflow-hidden">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center gap-3 p-4 text-left"
      >
        <div className="w-9 h-9 rounded-[10px] bg-orange-500/12 flex items-center justify-center shrink-0">
          <Flame size={16} className="text-orange-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-white">TDEE / BMR</p>
          <div className="flex items-center gap-2 mt-0.5">
            <p className="text-[11px] text-white/35">
              Maintenance:{" "}
              <span className="text-white/65 font-semibold tabular-nums">{tdee.toLocaleString()} kcal</span>
              <span className="text-white/30"> · </span>
              <span className="text-white/50 font-semibold tabular-nums">{Math.round(weightKg * 1.8)}g protein</span>
              <span className="text-white/30"> · </span>
              <span className="text-white/30 tabular-nums">{Math.round(tdee / weightKg)} kcal/kg</span>
            </p>
            <span className="text-[10px] text-trainer-success/70 font-semibold tabular-nums shrink-0">
              +{(tdee - bmr).toLocaleString()} activity
            </span>
          </div>
        </div>
        {expanded
          ? <ChevronUp size={14} className="text-white/30 shrink-0" />
          : <ChevronDown size={14} className="text-white/30 shrink-0" />}
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="overflow-hidden border-t border-white/6"
          >
            <div className="p-4 flex flex-col gap-4">

              {/* BMR + TDEE hero */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-trainer-elevated rounded-[12px] p-3">
                  <p className="text-[10px] text-white/30 uppercase tracking-widest font-semibold mb-1">BMR</p>
                  <p className="text-2xl font-black text-white tabular-nums">{bmr.toLocaleString()}</p>
                  <p className="text-[10px] text-white/25 mt-0.5">kcal at complete rest</p>
                </div>
                <div className="bg-trainer-elevated rounded-[12px] p-3">
                  <p className="text-[10px] text-white/30 uppercase tracking-widest font-semibold mb-1">TDEE</p>
                  <p className="text-2xl font-black text-trainer-indigo tabular-nums">{tdee.toLocaleString()}</p>
                  <p className="text-[10px] text-white/25 mt-0.5">kcal with activity</p>
                </div>
              </div>

              {/* Activity level comparison table */}
              <div>
                <p className="text-[10px] text-white/25 uppercase tracking-widest font-semibold mb-2">
                  By Activity Level
                </p>
                <div className="flex flex-col gap-0.5">
                  {ACTIVITY_LEVELS.map((lvl) => {
                    const lvlTdee    = calculateTDEE(bmr, lvl.key);
                    const isCurrent  = lvl.key === activityLevel;
                    return (
                      <div
                        key={lvl.key}
                        className={cn(
                          "flex items-center justify-between px-3 py-2 rounded-[8px]",
                          isCurrent
                            ? "bg-trainer-indigo/12 border border-trainer-indigo/20"
                            : "bg-white/3"
                        )}
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className={cn("text-xs font-semibold", isCurrent ? "text-white" : "text-white/45")}>
                              {lvl.label}
                            </span>
                            {isCurrent && (
                              <span className="text-[9px] font-black text-trainer-indigo bg-trainer-indigo/15 px-1.5 py-0.5 rounded-full">
                                YOU
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-white/20">{lvl.desc}</p>
                        </div>
                        <span className={cn("text-sm font-bold tabular-nums shrink-0 ml-2", isCurrent ? "text-trainer-indigo" : "text-white/35")}>
                          {lvlTdee.toLocaleString()}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Calorie goal scenarios */}
              <div>
                <p className="text-[10px] text-white/25 uppercase tracking-widest font-semibold mb-2">
                  Calorie Goal
                </p>
                <div className="flex gap-2 mb-3">
                  {SCENARIOS.map((s) => (
                    <button
                      key={s.key}
                      onClick={() => setScenario(s.key)}
                      className={cn(
                        "flex-1 py-2 rounded-[10px] text-xs font-bold border transition-all",
                        scenario === s.key
                          ? `${s.bgColor} ${s.borderColor} ${s.textColor}`
                          : "bg-white/4 border-white/8 text-white/35 hover:text-white/60"
                      )}
                    >
                      {s.label}
                      <span className="block text-[10px] font-normal mt-0.5 opacity-70">
                        {s.delta > 0 ? `+${s.delta}` : s.delta === 0 ? "±0" : s.delta} kcal
                      </span>
                    </button>
                  ))}
                </div>

                {/* Macro breakdown grid */}
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { label: "Calories", value: target.toLocaleString(),             sub: "kcal/day" },
                    { label: "Protein",  value: `${proteinG}g`,                      sub: `${Math.round(proteinG * 4 / target * 100)}%` },
                    { label: "Carbs",    value: `${carbsG}g`,                        sub: `${Math.round(carbsG * 4 / target * 100)}%` },
                    { label: "Fat",      value: `${fatG}g`,                          sub: `${Math.round(fatG * 9 / target * 100)}%` },
                  ].map(({ label, value, sub }) => (
                    <div key={label} className="bg-trainer-elevated rounded-[10px] p-2.5 text-center">
                      <p className="text-[10px] text-white/30 mb-1">{label}</p>
                      <p className={cn("text-sm font-bold tabular-nums", sel.textColor)}>{value}</p>
                      <p className="text-[9px] text-white/25 mt-0.5">{sub}</p>
                    </div>
                  ))}
                </div>
              </div>

              <p className="text-[9px] text-white/15">
                Mifflin-St Jeor formula · these are estimates, not medical advice
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
