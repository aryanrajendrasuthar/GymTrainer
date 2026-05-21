"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calculator, X, ChevronDown } from "lucide-react";
import { cn } from "@/app/lib/utils";

interface Props {
  unit: "kg" | "lb";
}

const PERCENT_ZONES = [
  { pct: 100, reps: "1",    label: "1RM",     color: "text-red-400" },
  { pct: 95,  reps: "2",    label: "~95%",    color: "text-orange-400" },
  { pct: 90,  reps: "3",    label: "~90%",    color: "text-amber-400" },
  { pct: 85,  reps: "5",    label: "~85%",    color: "text-yellow-400" },
  { pct: 80,  reps: "6–8",  label: "~80%",    color: "text-lime-400" },
  { pct: 75,  reps: "8–10", label: "~75%",    color: "text-trainer-success" },
  { pct: 70,  reps: "10–12",label: "~70%",    color: "text-teal-400" },
  { pct: 65,  reps: "12–15",label: "~65%",    color: "text-sky-400" },
];

function epley(weight: number, reps: number): number {
  if (reps === 1) return weight;
  return weight * (1 + reps / 30);
}

function repsMatchesZone(zoneReps: string, r: number): boolean {
  if (zoneReps.includes("–")) {
    const [lo, hi] = zoneReps.split("–").map(Number);
    return r >= lo! && r <= hi!;
  }
  return r === Number(zoneReps);
}

function roundToStep(value: number, unit: "kg" | "lb"): string {
  const step = unit === "lb" ? 5 : 2.5;
  return (Math.round(value / step) * step).toFixed(unit === "lb" ? 0 : 1);
}

export function OneRMCalculatorSheet({ unit }: Props) {
  const [open, setOpen] = useState(false);
  const [weight, setWeight] = useState("");
  const [reps, setReps] = useState("5");

  const w = parseFloat(weight);
  const r = parseInt(reps);
  const e1rm = !isNaN(w) && !isNaN(r) && w > 0 && r >= 1 && r <= 30 ? epley(w, r) : null;

  return (
    <>
      {/* Trigger button */}
      <motion.button
        whileTap={{ scale: 0.93 }}
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] bg-white/6 border border-white/10 text-white/50 text-xs font-semibold hover:text-white/75 hover:border-white/20 transition-colors"
      >
        <Calculator size={12} />
        1RM Calc
      </motion.button>

      {/* Bottom sheet */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 380, damping: 40 }}
              className="fixed bottom-0 inset-x-0 z-50 bg-trainer-elevated border-t border-white/10 rounded-t-[24px] max-h-[88vh] flex flex-col"
            >
              {/* Handle */}
              <div className="flex justify-center pt-3 pb-1 shrink-0">
                <div className="w-9 h-1 rounded-full bg-white/15" />
              </div>

              {/* Header */}
              <div className="flex items-center justify-between px-5 pb-3 shrink-0">
                <div className="flex items-center gap-2">
                  <Calculator size={16} className="text-trainer-indigo" />
                  <p className="text-base font-bold text-white">e1RM Calculator</p>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  className="w-8 h-8 rounded-full bg-white/8 flex items-center justify-center text-white/40 hover:text-white transition-colors"
                >
                  <X size={15} />
                </button>
              </div>

              <div className="overflow-y-auto flex-1 px-5 pb-8">
                {/* Inputs */}
                <div className="grid grid-cols-2 gap-3 mb-5">
                  <div>
                    <p className="text-xs text-white/40 mb-1.5">Weight ({unit})</p>
                    <input
                      type="number"
                      step={unit === "lb" ? 5 : 2.5}
                      min="1"
                      placeholder={unit === "lb" ? "e.g. 225" : "e.g. 100"}
                      value={weight}
                      onChange={(e) => setWeight(e.target.value)}
                      className="w-full bg-trainer-surface border border-white/10 rounded-[10px] px-3 py-2.5 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-trainer-indigo/40 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
                      style={{ fontSize: "16px" }}
                    />
                  </div>
                  <div>
                    <p className="text-xs text-white/40 mb-1.5">Reps completed</p>
                    <select
                      value={reps}
                      onChange={(e) => setReps(e.target.value)}
                      className="w-full bg-trainer-surface border border-white/10 rounded-[10px] px-3 py-2.5 text-sm text-white focus:outline-none focus:border-trainer-indigo/40 appearance-none"
                      style={{ fontSize: "16px" }}
                    >
                      {Array.from({ length: 20 }, (_, i) => i + 1).map((n) => (
                        <option key={n} value={n}>{n} rep{n !== 1 ? "s" : ""}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Result */}
                {e1rm ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.97 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="mb-5"
                  >
                    <div className="flex items-center justify-between p-4 rounded-[14px] bg-trainer-indigo/10 border border-trainer-indigo/25 mb-4">
                      <div>
                        <p className="text-xs text-white/35 mb-0.5">Estimated 1-Rep Max</p>
                        <p className="text-3xl font-black text-white tabular-nums">
                          {roundToStep(e1rm, unit)}
                          <span className="text-sm font-normal text-white/40 ml-1">{unit}</span>
                        </p>
                        <p className="text-[10px] text-white/30 mt-1">Epley formula · ±5% typical variance</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] text-white/30">Input</p>
                        <p className="text-sm font-bold text-white/60 tabular-nums">{weight}{unit} × {reps}</p>
                        <p className="text-[10px] font-bold text-trainer-indigo/60 tabular-nums mt-0.5">
                          {Math.round((w / e1rm) * 100)}% of 1RM
                        </p>
                      </div>
                    </div>

                    {/* % training zones */}
                    <p className="text-[10px] text-white/30 uppercase tracking-widest font-semibold mb-2.5">
                      Training Zones
                    </p>
                    <div className="flex flex-col gap-1.5">
                      {PERCENT_ZONES.map(({ pct, reps: repsLabel, label, color }) => {
                        const zoneWeight = roundToStep((e1rm * pct) / 100, unit);
                        const isActive = pct === 100;
                        const isCurrentZone = r > 1 && repsMatchesZone(repsLabel, r);
                        return (
                          <div
                            key={pct}
                            className={cn(
                              "flex items-center gap-3 px-3 py-2 rounded-[10px]",
                              isActive ? "bg-trainer-indigo/10 border border-trainer-indigo/20" :
                              isCurrentZone ? "bg-white/8 border border-white/15" : "bg-white/4"
                            )}
                          >
                            <span className={cn("text-xs font-bold w-10 tabular-nums shrink-0", color)}>
                              {label}
                            </span>
                            <span className="text-sm font-bold text-white tabular-nums flex-1">
                              {zoneWeight}
                              <span className="text-xs font-normal text-white/35 ml-0.5">{unit}</span>
                            </span>
                            <div className="flex flex-col items-end gap-0.5 shrink-0">
                              <span className="text-xs text-white/30">{repsLabel} reps</span>
                              {isCurrentZone && (
                                <span className="text-[8px] font-bold text-white/50 bg-white/10 px-1 rounded">your zone</span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 gap-2">
                    <ChevronDown size={24} className="text-white/15 animate-bounce" />
                    <p className="text-sm text-white/25">Enter weight and reps above</p>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
