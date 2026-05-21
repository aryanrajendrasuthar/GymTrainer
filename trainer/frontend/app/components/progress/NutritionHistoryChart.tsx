"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
} from "recharts";
import { type DailyMacroLog } from "@/app/store/nutritionStore";

interface NutritionHistoryChartProps {
  logs: DailyMacroLog[];
  targetCalories: number;
  targetProteinG: number;
}

type View = "calories" | "protein";

function CustomTooltip({ active, payload, label, view }: {
  active?: boolean;
  payload?: readonly { value: number }[];
  label?: string;
  view: View;
}) {
  if (!active || !payload?.length) return null;
  const val = payload[0]?.value ?? 0;
  return (
    <div className="bg-trainer-elevated border border-white/12 rounded-[10px] px-3 py-2 text-xs shadow-lg">
      <p className="text-white/40 mb-1">{label}</p>
      <p className="text-white font-semibold tabular-nums">
        {val} {view === "calories" ? "kcal" : "g protein"}
      </p>
    </div>
  );
}

import { useState } from "react";
import { cn } from "@/app/lib/utils";
import { motion } from "framer-motion";

export function NutritionHistoryChart({ logs, targetCalories, targetProteinG }: NutritionHistoryChartProps) {
  const [view, setView] = useState<View>("calories");

  if (logs.length === 0) return null;

  // Build 7-day grid (always show last 7 days, fill missing with 0)
  const days: { date: string; label: string; calories: number; protein: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    const label = i === 0 ? "Today" : d.toLocaleDateString("en-US", { weekday: "short" });
    const log = logs.find((l) => l.date === dateStr);
    days.push({ date: dateStr, label, calories: log?.calories ?? 0, protein: log?.proteinG ?? 0 });
  }

  const target = view === "calories" ? targetCalories : targetProteinG;
  const dataKey = view === "calories" ? "calories" : "protein";
  const barColor = view === "calories" ? "#6c63ff" : "#34d399";
  const targetColor = view === "calories" ? "#6c63ff" : "#34d399";

  const avg = Math.round(days.filter((d) => d[dataKey] > 0).reduce((s, d) => s + d[dataKey], 0) / Math.max(1, days.filter((d) => d[dataKey] > 0).length));

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-trainer-surface border border-white/8 rounded-[16px] p-4"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <p className="text-xs text-white/35 uppercase tracking-widest font-semibold">
            7-Day Nutrition
          </p>
          {avg > 0 && target > 0 && (() => {
            const delta = avg - target;
            const pct = Math.round((delta / target) * 100);
            const positive = delta > 0;
            return (
              <span className={cn(
                "text-[9px] font-bold px-1.5 py-0.5 rounded-full border tabular-nums",
                Math.abs(pct) <= 5
                  ? "text-trainer-success bg-trainer-success/8 border-trainer-success/20"
                  : positive
                  ? "text-amber-400 bg-amber-400/8 border-amber-400/20"
                  : "text-red-400 bg-red-400/8 border-red-400/20"
              )}>
                {positive ? "+" : ""}{pct}% vs target
              </span>
            );
          })()}
        </div>
        <div className="flex gap-0.5 p-0.5 bg-trainer-elevated rounded-[8px]">
          {(["calories", "protein"] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={cn(
                "px-2.5 py-1 rounded-[6px] text-[11px] font-semibold transition-all capitalize",
                view === v ? "bg-trainer-surface text-white" : "text-white/35 hover:text-white/60"
              )}
            >
              {v === "calories" ? "Kcal" : "Protein"}
            </button>
          ))}
        </div>
      </div>

      {/* Avg vs target */}
      {avg > 0 && target > 0 && (
        <div className="flex items-center gap-3 mb-3">
          <div>
            <p className="text-[10px] text-white/30">7-day avg</p>
            <p className="text-lg font-bold tabular-nums" style={{ color: barColor }}>
              {avg}
              <span className="text-xs font-normal text-white/35 ml-1">{view === "calories" ? "kcal" : "g"}</span>
            </p>
          </div>
          {target > 0 && (
            <div className="h-8 w-px bg-white/8" />
          )}
          {target > 0 && (
            <div>
              <p className="text-[10px] text-white/30">target</p>
              <p className="text-lg font-bold text-white/50 tabular-nums">
                {target}
                <span className="text-xs font-normal text-white/25 ml-1">{view === "calories" ? "kcal" : "g"}</span>
              </p>
            </div>
          )}
          {(() => {
            const compliant = days.filter((d) => {
              const val = d[dataKey];
              return val > 0 && val >= target * 0.9 && val <= target * 1.2;
            }).length;
            return (
              <span className={cn(
                "text-[10px] font-bold px-2 py-0.5 rounded-full border ml-auto shrink-0",
                compliant >= 5
                  ? "text-trainer-success bg-trainer-success/8 border-trainer-success/20"
                  : compliant >= 3
                  ? "text-amber-400 bg-amber-400/8 border-amber-400/20"
                  : "text-white/30 bg-white/4 border-white/10"
              )}>
                {compliant}/7d on target
              </span>
            );
          })()}
        </div>
      )}

      <ResponsiveContainer width="100%" height={100}>
        <BarChart data={days} margin={{ top: 4, right: 0, bottom: 0, left: -32 }} barCategoryGap="30%">
          <XAxis
            dataKey="label"
            tick={{ fontSize: 9, fill: "rgba(255,255,255,0.3)" }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tick={{ fontSize: 9, fill: "rgba(255,255,255,0.2)" }}
            tickLine={false}
            axisLine={false}
            domain={[0, "auto"]}
          />
          <Tooltip content={(p) => <CustomTooltip active={p.active} payload={p.payload as readonly { value: number }[]} label={String(p.label ?? "")} view={view} />} />
          {target > 0 && (
            <ReferenceLine
              y={target}
              stroke={targetColor}
              strokeOpacity={0.3}
              strokeDasharray="4 3"
              strokeWidth={1}
            />
          )}
          <Bar
            dataKey={dataKey}
            fill={barColor}
            fillOpacity={0.75}
            radius={[3, 3, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </motion.div>
  );
}
