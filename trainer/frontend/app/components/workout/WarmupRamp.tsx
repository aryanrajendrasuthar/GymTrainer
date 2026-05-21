"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Flame, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/app/lib/utils";

interface WarmupSet {
  percent: number;
  reps: number;
}

const RAMP: WarmupSet[] = [
  { percent: 0.5,  reps: 8 },
  { percent: 0.6,  reps: 5 },
  { percent: 0.7,  reps: 3 },
  { percent: 0.8,  reps: 2 },
  { percent: 0.9,  reps: 1 },
];

function round(weight: number, unit: "kg" | "lb"): number {
  // Round to nearest 2.5 for kg, nearest 5 for lb
  const step = unit === "lb" ? 5 : 2.5;
  return Math.max(0, Math.round(weight / step) * step);
}

interface WarmupRampProps {
  workingWeightKg: number;
  unit: "kg" | "lb";
}

export function WarmupRamp({ workingWeightKg, unit }: WarmupRampProps) {
  const [open, setOpen] = useState(false);

  const displayWorking = unit === "lb"
    ? Math.round(workingWeightKg * 2.20462 * 4) / 4
    : workingWeightKg;

  if (displayWorking <= 0) return null;

  return (
    <div className="mb-3">
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "w-full flex items-center justify-between px-3 py-2.5 rounded-[10px] border transition-colors text-left",
          open
            ? "bg-amber-500/8 border-amber-500/25"
            : "bg-white/4 border-white/6 hover:border-white/15"
        )}
      >
        <div className="flex items-center gap-2">
          <Flame size={13} className={open ? "text-amber-400" : "text-white/30"} />
          <div>
            <span className={cn("text-xs font-semibold", open ? "text-amber-400" : "text-white/40")}>
              Warm-up Ramp
            </span>
            {!open && (
              <span className="text-[10px] text-white/25 ml-1.5">{RAMP.length} sets · ~{Math.ceil(RAMP.length * 0.6)}min</span>
            )}
          </div>
        </div>
        {open ? (
          <ChevronUp size={13} className="text-white/30" />
        ) : (
          <ChevronDown size={13} className="text-white/30" />
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-2 rounded-[10px] bg-trainer-surface border border-white/6 p-3 space-y-1.5">
              <p className="text-[10px] text-white/30 mb-2 text-center">
                Working weight: {displayWorking} {unit}
              </p>
              {RAMP.map(({ percent, reps }) => {
                const rawKg = workingWeightKg * percent;
                const displayW = unit === "lb"
                  ? round(rawKg * 2.20462, "lb")
                  : round(rawKg, "kg");
                return (
                  <div
                    key={percent}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="h-2 rounded-full bg-amber-400/60"
                        style={{ width: `${percent * 60}px` }}
                      />
                      <span className="text-[11px] text-white/40 tabular-nums">
                        {Math.round(percent * 100)}%
                      </span>
                    </div>
                    <span className="text-sm font-semibold text-white/70 tabular-nums">
                      {displayW} {unit} × {reps}
                    </span>
                  </div>
                );
              })}
              <div className="border-t border-white/6 pt-2 mt-2 flex items-center justify-between">
                <span className="text-[11px] text-amber-400 font-semibold">Working set</span>
                <span className="text-sm font-bold text-white tabular-nums">
                  {displayWorking} {unit}
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
