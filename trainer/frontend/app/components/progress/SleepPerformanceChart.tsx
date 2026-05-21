"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { Moon } from "lucide-react";
import {
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
} from "recharts";
import { useSleepStore } from "@/app/store/sleepStore";
import { formatVolume, cn } from "@/app/lib/utils";
import type { WorkoutSession } from "@/app/types";

interface Props {
  sessions: WorkoutSession[];
  unit: "kg" | "lb";
}

interface DataPoint {
  sleep: number;
  volume: number;
  date: string;
}

function pearsonR(xs: number[], ys: number[]): number | null {
  const n = xs.length;
  if (n < 3) return null;
  const xMean = xs.reduce((a, b) => a + b, 0) / n;
  const yMean = ys.reduce((a, b) => a + b, 0) / n;
  const num = xs.reduce((sum, x, i) => sum + (x - xMean) * (ys[i]! - yMean), 0);
  const den = Math.sqrt(
    xs.reduce((sum, x) => sum + (x - xMean) ** 2, 0) *
    ys.reduce((sum, y) => sum + (y - yMean) ** 2, 0)
  );
  return den === 0 ? null : num / den;
}

function CustomDot(props: Record<string, unknown>) {
  const { cx, cy } = props as { cx: number; cy: number };
  return <circle cx={cx} cy={cy} r={4} fill="#6c63ff" fillOpacity={0.7} stroke="#6c63ff" strokeWidth={1} />;
}

export function SleepPerformanceChart({ sessions, unit }: Props) {
  const { getLast } = useSleepStore();
  const sleepLogs = getLast(90);

  const { data, r, avgVolumeLowSleep, avgVolumeHighSleep } = useMemo(() => {
    const sleepByDate = new Map(sleepLogs.map((l) => [l.date, l.hoursSlept]));

    const data: DataPoint[] = [];
    for (const session of sessions) {
      const dateStr = session.date.slice(0, 10);
      // Use sleep from the night before (or same day)
      const prevDate = new Date(new Date(dateStr).getTime() - 86400000)
        .toISOString()
        .slice(0, 10);
      const sleep = sleepByDate.get(prevDate) ?? sleepByDate.get(dateStr);
      if (sleep === undefined) continue;
      const vol = unit === "lb" ? session.totalVolumeKg * 2.20462 : session.totalVolumeKg;
      data.push({ sleep, volume: Math.round(vol), date: dateStr });
    }

    if (data.length < 4) return { data, r: null, avgVolumeLowSleep: 0, avgVolumeHighSleep: 0 };

    const r = pearsonR(data.map((d) => d.sleep), data.map((d) => d.volume));

    const low  = data.filter((d) => d.sleep < 7);
    const high = data.filter((d) => d.sleep >= 7);
    const avgVolumeLowSleep  = low.length  ? low.reduce((a, b) => a + b.volume, 0) / low.length   : 0;
    const avgVolumeHighSleep = high.length ? high.reduce((a, b) => a + b.volume, 0) / high.length : 0;

    return { data, r, avgVolumeLowSleep, avgVolumeHighSleep };
  }, [sessions, sleepLogs, unit]);

  if (data.length < 4) {
    return (
      <div className="bg-trainer-surface border border-white/8 rounded-[16px] p-4 flex items-center gap-3">
        <Moon size={16} className="text-indigo-400 shrink-0" />
        <p className="text-sm text-white/30">Log sleep for 4+ workout days to see sleep vs. performance correlation.</p>
      </div>
    );
  }

  const rLabel =
    r === null ? "—"
    : r > 0.5  ? "Strong positive"
    : r > 0.2  ? "Moderate positive"
    : r < -0.5 ? "Strong negative"
    : r < -0.2 ? "Moderate negative"
    : "Weak / no";

  const rColor =
    r === null ? "text-white/40"
    : r > 0.2  ? "text-trainer-success"
    : r < -0.2 ? "text-red-400"
    : "text-white/40";

  const pctDiff = avgVolumeLowSleep > 0
    ? Math.round(((avgVolumeHighSleep - avgVolumeLowSleep) / avgVolumeLowSleep) * 100)
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-trainer-surface border border-white/8 rounded-[16px] p-4"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Moon size={13} className="text-indigo-400" />
          <p className="text-xs text-white/35 uppercase tracking-widest font-semibold">Sleep × Volume</p>
        </div>
        <span className="text-[10px] text-white/20 tabular-nums">{data.length} sessions</span>
      </div>

      {/* Correlation summary */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="bg-trainer-elevated rounded-[10px] p-2.5">
          <p className="text-[9px] text-white/30 mb-0.5">Correlation</p>
          <p className={cn("text-sm font-bold", rColor)}>
            {r !== null ? r.toFixed(2) : "—"}
          </p>
          <p className={cn("text-[8px] font-semibold mt-0.5", rColor)}>{rLabel}</p>
        </div>
        <div className="bg-trainer-elevated rounded-[10px] p-2.5">
          <p className="text-[9px] text-white/30 mb-0.5">&lt;7h sleep</p>
          <p className="text-sm font-bold text-white/65 tabular-nums">
            {formatVolume(avgVolumeLowSleep, unit)}
          </p>
          <p className="text-[8px] text-white/25 mt-0.5">avg volume</p>
        </div>
        <div className="bg-trainer-elevated rounded-[10px] p-2.5">
          <p className="text-[9px] text-white/30 mb-0.5">7h+ sleep</p>
          <p className={cn("text-sm font-bold tabular-nums", pctDiff > 0 ? "text-trainer-success" : "text-white/65")}>
            {formatVolume(avgVolumeHighSleep, unit)}
          </p>
          <p className={cn("text-[8px] mt-0.5 font-semibold", pctDiff > 0 ? "text-trainer-success" : "text-white/25")}>
            {pctDiff > 0 ? `+${pctDiff}%` : pctDiff < 0 ? `${pctDiff}%` : "same"}
          </p>
        </div>
      </div>

      {/* Scatter plot */}
      <ResponsiveContainer width="100%" height={110}>
        <ScatterChart margin={{ top: 4, right: 4, bottom: 0, left: -24 }}>
          <XAxis
            dataKey="sleep"
            type="number"
            name="Sleep"
            unit="h"
            domain={[4, 10]}
            tick={{ fontSize: 8, fill: "rgba(255,255,255,0.25)" }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            dataKey="volume"
            type="number"
            name="Volume"
            tick={{ fontSize: 8, fill: "rgba(255,255,255,0.2)" }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            contentStyle={{
              background: "#1a1a2e",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 8,
              fontSize: 11,
            }}
            labelStyle={{ color: "rgba(255,255,255,0.4)" }}
            formatter={(value, name) => [
              name === "Sleep" ? `${value}h` : formatVolume(Number(value), unit),
              name,
            ]}
          />
          <ReferenceLine
            x={7}
            stroke="rgba(255,255,255,0.12)"
            strokeDasharray="3 3"
            strokeWidth={1}
          />
          <Scatter data={data} shape={<CustomDot />} />
        </ScatterChart>
      </ResponsiveContainer>

      <p className="text-[9px] text-white/15 mt-1.5">
        Based on {data.length} workouts · dashed line = 7h sleep threshold
      </p>
    </motion.div>
  );
}
