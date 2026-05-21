"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import { cn } from "@/app/lib/utils";
import { type BodyMeasurementEntry } from "@/app/store/progressStore";

const METRICS = [
  { key: "waistCm",     label: "Waist",   color: "#f59e0b" },
  { key: "chestCm",     label: "Chest",   color: "#6c63ff" },
  { key: "hipsCm",      label: "Hips",    color: "#ec4899" },
  { key: "leftArmCm",   label: "L. Arm",  color: "#34d399" },
  { key: "rightArmCm",  label: "R. Arm",  color: "#22d3ee" },
  { key: "leftThighCm", label: "Thigh",   color: "#fb923c" },
  { key: "neckCm",      label: "Neck",    color: "#a78bfa" },
] as const;

type MetricKey = (typeof METRICS)[number]["key"];

interface MeasurementTrendChartProps {
  logs: BodyMeasurementEntry[];
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-trainer-elevated border border-white/12 rounded-[10px] px-3 py-2 text-xs shadow-lg">
      <p className="text-white/40 mb-1">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-white/70">{p.name}:</span>
          <span className="text-white font-semibold tabular-nums">{p.value} cm</span>
        </div>
      ))}
    </div>
  );
}

export function MeasurementTrendChart({ logs }: MeasurementTrendChartProps) {
  const [activeMetrics, setActiveMetrics] = useState<Set<MetricKey>>(
    new Set<MetricKey>(["waistCm", "leftArmCm"])
  );

  if (logs.length < 2) return null;

  // Build chart data (oldest first)
  const chartData = [...logs]
    .reverse()
    .slice(-20)
    .map((entry) => ({
      date: new Date(entry.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      ...entry.measurements,
    }));

  function toggleMetric(key: MetricKey) {
    setActiveMetrics((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        if (next.size === 1) return prev; // keep at least one
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }

  // Compute deltas vs oldest entry
  const oldest = logs[logs.length - 1]?.measurements;
  const latest = logs[0]?.measurements;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-trainer-surface border border-white/8 rounded-[16px] p-4"
    >
      <p className="text-xs text-white/35 uppercase tracking-widest font-semibold mb-3">
        Measurement Trends (cm)
      </p>

      {/* Metric toggle chips */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        {METRICS.filter((m) => logs.some((l) => l.measurements[m.key] !== undefined)).map((m) => {
          const isActive = activeMetrics.has(m.key);
          const delta = oldest && latest
            ? (latest[m.key] ?? 0) - (oldest[m.key] ?? 0)
            : null;
          return (
            <button
              key={m.key}
              onClick={() => toggleMetric(m.key)}
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all border",
                isActive
                  ? "border-transparent text-white"
                  : "bg-white/4 border-white/8 text-white/35 hover:text-white/60"
              )}
              style={isActive ? { background: m.color + "22", borderColor: m.color + "44", color: m.color } : {}}
            >
              {m.label}
              {delta !== null && Math.abs(delta) >= 0.5 && (
                <span className={cn(
                  "text-[9px] font-bold",
                  delta < 0 ? "text-trainer-success" : "text-red-400"
                )}>
                  {delta > 0 ? "+" : ""}{delta.toFixed(1)}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={140}>
        <LineChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: -24 }}>
          <XAxis
            dataKey="date"
            tick={{ fontSize: 9, fill: "rgba(255,255,255,0.25)" }}
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fontSize: 9, fill: "rgba(255,255,255,0.25)" }}
            tickLine={false}
            axisLine={false}
            domain={["auto", "auto"]}
          />
          <Tooltip content={<CustomTooltip />} />
          {METRICS.filter((m) => activeMetrics.has(m.key)).map((m) => (
            <Line
              key={m.key}
              type="monotone"
              dataKey={m.key}
              name={m.label}
              stroke={m.color}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 3, strokeWidth: 0 }}
              connectNulls
            />
          ))}
        </LineChart>
      </ResponsiveContainer>

      <p className="text-[10px] text-white/15 mt-2 text-right">{logs.length} total entries · last {chartData.length} shown · tap to toggle</p>
    </motion.div>
  );
}
