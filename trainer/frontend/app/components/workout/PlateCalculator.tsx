"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";

const KG_PLATES = [20, 15, 10, 5, 2.5, 1.25] as const;
const LB_PLATES = [45, 35, 25, 10, 5, 2.5] as const;
const BAR_KG = 20;
const BAR_LB = 45;

const PLATE_COLORS: Record<number, string> = {
  // kg
  20: "bg-red-500",
  15: "bg-yellow-500",
  10: "bg-green-500",
  5: "bg-blue-500",
  2.5: "bg-white",
  1.25: "bg-zinc-400",
  // lb (some overlap, precedence goes to kg definitions above)
  45: "bg-red-500",
  35: "bg-yellow-500",
  25: "bg-green-500",
  // 10 and 5 and 2.5 already covered
};

function calcPlates(
  totalWeight: number,
  barWeight: number,
  plates: readonly number[]
): { plate: number; count: number }[] {
  let remaining = (totalWeight - barWeight) / 2;
  if (remaining <= 0) return [];
  const result: { plate: number; count: number }[] = [];
  for (const p of plates) {
    if (remaining >= p) {
      const count = Math.floor(remaining / p);
      result.push({ plate: p, count });
      remaining = Math.round((remaining - count * p) * 1000) / 1000;
    }
  }
  return result;
}

interface PlateCalculatorProps {
  weightKg: number;
  unit: "kg" | "lb";
}

export function PlateCalculator({ weightKg, unit }: PlateCalculatorProps) {
  const displayWeight = unit === "lb" ? Math.round(weightKg * 2.20462 * 4) / 4 : weightKg;
  const barWeight = unit === "lb" ? BAR_LB : BAR_KG;
  const plates = unit === "lb" ? LB_PLATES : KG_PLATES;

  const platesNeeded = useMemo(
    () => calcPlates(displayWeight, barWeight, plates),
    [displayWeight, barWeight, plates]
  );

  const totalLoaded = barWeight + platesNeeded.reduce((sum, p) => sum + p.plate * p.count * 2, 0);
  const isExact = Math.abs(totalLoaded - displayWeight) < 0.01;

  if (displayWeight <= barWeight) {
    return (
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: "auto" }}
        exit={{ opacity: 0, height: 0 }}
        className="overflow-hidden"
      >
        <div className="mt-3 rounded-[10px] bg-trainer-surface border border-white/6 p-3">
          <p className="text-xs text-white/35 text-center">
            Weight ≤ bar weight ({barWeight} {unit}) — no plates needed
          </p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      className="overflow-hidden"
    >
      <div className="mt-3 rounded-[10px] bg-trainer-surface border border-white/6 p-3 space-y-3">
        {/* Visual bar */}
        <div className="flex items-center justify-center gap-1.5">
          {/* Left plates */}
          <div className="flex flex-row-reverse items-center gap-0.5">
            {platesNeeded.map(({ plate, count }) =>
              Array.from({ length: count }).map((_, i) => (
                <div
                  key={`L-${plate}-${i}`}
                  className={`${PLATE_COLORS[plate] ?? "bg-zinc-400"} rounded-[3px] opacity-90`}
                  style={{ width: 10, height: plate >= 20 ? 36 : plate >= 10 ? 28 : plate >= 5 ? 22 : 16 }}
                />
              ))
            )}
          </div>

          {/* Bar */}
          <div className="h-3 w-20 bg-zinc-600 rounded-full" />

          {/* Right plates */}
          <div className="flex items-center gap-0.5">
            {platesNeeded.map(({ plate, count }) =>
              Array.from({ length: count }).map((_, i) => (
                <div
                  key={`R-${plate}-${i}`}
                  className={`${PLATE_COLORS[plate] ?? "bg-zinc-400"} rounded-[3px] opacity-90`}
                  style={{ width: 10, height: plate >= 20 ? 36 : plate >= 10 ? 28 : plate >= 5 ? 22 : 16 }}
                />
              ))
            )}
          </div>
        </div>

        {/* Per-side plate list */}
        <div>
          <p className="text-[10px] text-white/30 mb-1.5 text-center">Per side</p>
          <div className="flex flex-wrap justify-center gap-1.5">
            {platesNeeded.length === 0 ? (
              <p className="text-xs text-white/25">Empty bar</p>
            ) : (
              platesNeeded.map(({ plate, count }) => (
                <div
                  key={plate}
                  className="flex items-center gap-1 bg-trainer-elevated rounded-[6px] px-2 py-1"
                >
                  <div
                    className={`w-2 h-2 rounded-sm ${PLATE_COLORS[plate] ?? "bg-zinc-400"}`}
                  />
                  <span className="text-[11px] font-semibold text-white/70 tabular-nums">
                    {count}× {plate}{unit}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Total */}
        {(() => {
          const platesPerSide = platesNeeded.reduce((s, p) => s + p.count, 0);
          return (
            <p className="text-[10px] text-white/30 text-center">
              Bar {barWeight} + plates {platesNeeded.reduce((s, p) => s + p.plate * p.count * 2, 0)}{unit}
              {" = "}
              <span className={isExact ? "text-trainer-success" : "text-amber-400"}>
                {Math.round(totalLoaded * 100) / 100}{unit}
              </span>
              {!isExact && <span className="text-amber-400"> (closest possible)</span>}
              <span className="text-white/20">
                {" · "}{platesPerSide} plate{platesPerSide !== 1 ? "s" : ""}/side
              </span>
            </p>
          );
        })()}

        {/* Warm-up suggestions */}
        <div className="pt-2 border-t border-white/5">
          <p className="text-[9px] text-white/25 text-center mb-1.5 uppercase tracking-wider">Warm-up ramp</p>
          <div className="flex justify-center gap-2">
            {[
              { label: "Empty bar", weight: barWeight },
              { label: "50%", weight: Math.round(displayWeight * 0.5 * 2) / 2 },
              { label: "75%", weight: Math.round(displayWeight * 0.75 * 2) / 2 },
            ].map(({ label, weight }) => (
              <div key={label} className="flex flex-col items-center gap-0.5 bg-trainer-elevated rounded-[8px] px-2.5 py-1.5">
                <span className="text-[9px] text-white/25">{label}</span>
                <span className="text-[11px] font-semibold text-white/55 tabular-nums">{weight}{unit}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
