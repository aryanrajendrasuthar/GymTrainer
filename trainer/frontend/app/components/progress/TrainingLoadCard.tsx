"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { Activity, TrendingUp, TrendingDown, Minus } from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
} from "recharts";
import { cn } from "@/app/lib/utils";
import { type WorkoutSession } from "@/app/types";

interface TrainingLoadCardProps {
  sessions: WorkoutSession[];
  unit: "kg" | "lb";
}

function weekStart(d: Date): string {
  const day = new Date(d);
  day.setHours(0, 0, 0, 0);
  const dow = (day.getDay() + 6) % 7; // Mon=0
  day.setDate(day.getDate() - dow);
  return day.toISOString().slice(0, 10);
}

function weekLabel(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function TrainingLoadCard({ sessions, unit }: TrainingLoadCardProps) {
  const { weeks, thisWeekLoad, lastWeekLoad, peakWeekLoad, trend, acuteLoad, chronicLoad, acwr } = useMemo(() => {
    // Group volume by week
    const byWeek: Record<string, number> = {};
    for (const s of sessions) {
      const ws = weekStart(new Date(s.date));
      byWeek[ws] = (byWeek[ws] ?? 0) + (unit === "lb" ? s.totalVolumeKg * 2.20462 : s.totalVolumeKg);
    }

    const sorted = Object.entries(byWeek)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-12);

    const weeks = sorted.map(([date, volume]) => ({
      label: weekLabel(date),
      volume: Math.round(volume),
    }));

    const thisWeekLoad = weeks[weeks.length - 1]?.volume ?? 0;
    const lastWeekLoad = weeks[weeks.length - 2]?.volume ?? 0;
    const peakWeekLoad = Math.max(0, ...weeks.map((w) => w.volume));

    const pctChange = lastWeekLoad > 0 ? ((thisWeekLoad - lastWeekLoad) / lastWeekLoad) * 100 : 0;
    const trend: "build" | "maintain" | "deload" =
      pctChange > 10 ? "build" : pctChange < -10 ? "deload" : "maintain";

    // ACWR: acute (last 1 wk) / chronic (avg last 4 wks)
    const last4 = sorted.slice(-4).map(([, v]) => v);
    const acuteLoad = last4[last4.length - 1] ?? 0;
    const chronicLoad = last4.length > 0 ? last4.reduce((a, b) => a + b, 0) / last4.length : 0;
    const acwr = chronicLoad > 0 ? Math.round((acuteLoad / chronicLoad) * 100) / 100 : 0;

    return { weeks, thisWeekLoad, lastWeekLoad, peakWeekLoad, trend, acuteLoad, chronicLoad, acwr };
  }, [sessions, unit]);

  if (weeks.length < 2) return null;

  const TrendIcon = trend === "build" ? TrendingUp : trend === "deload" ? TrendingDown : Minus;
  const trendColor = trend === "build"
    ? "text-trainer-success"
    : trend === "deload"
    ? "text-amber-400"
    : "text-white/50";
  const trendLabel = trend === "build" ? "Building" : trend === "deload" ? "Deloading" : "Maintaining";

  // ACWR risk zones: <0.8 = undertrained, 0.8-1.3 = optimal, >1.3 = injury risk
  const acwrColor = acwr > 1.3 ? "text-red-400" : acwr < 0.8 && acwr > 0 ? "text-amber-400" : "text-trainer-success";
  const acwrLabel = acwr > 1.5 ? "Overreaching" : acwr > 1.3 ? "High load" : acwr < 0.8 && acwr > 0 ? "Undertrained" : "Optimal zone";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-trainer-surface border border-white/8 rounded-[16px] p-4"
    >
      <div className="flex items-center gap-2 mb-4">
        <Activity size={13} className="text-trainer-indigo" />
        <p className="text-xs text-white/35 uppercase tracking-widest font-semibold">
          Training Load
        </p>
      </div>

      {/* Key metrics */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div>
          <p className="text-[10px] text-white/30 mb-0.5">This week</p>
          <p className="text-lg font-bold text-white tabular-nums">
            {Math.round(thisWeekLoad / 1000) > 0
              ? `${(thisWeekLoad / 1000).toFixed(1)}k`
              : thisWeekLoad}
            <span className="text-[10px] font-normal text-white/30 ml-0.5">{unit}</span>
          </p>
          {peakWeekLoad > thisWeekLoad && (
            <p className="text-[9px] text-white/20 tabular-nums">
              peak {peakWeekLoad >= 1000 ? `${(peakWeekLoad / 1000).toFixed(1)}k` : peakWeekLoad}
            </p>
          )}
        </div>
        <div>
          <p className="text-[10px] text-white/30 mb-0.5">Trend</p>
          <div className="flex items-center gap-1">
            <TrendIcon size={14} className={trendColor} />
            <p className={cn("text-sm font-bold", trendColor)}>{trendLabel}</p>
          </div>
        </div>
        <div>
          <p className="text-[10px] text-white/30 mb-0.5">ACWR</p>
          <p className={cn("text-lg font-bold tabular-nums", acwrColor)}>
            {acwr > 0 ? acwr.toFixed(2) : "—"}
          </p>
          {acwr > 0 && (
            <p className={cn("text-[9px] font-semibold", acwrColor)}>{acwrLabel}</p>
          )}
        </div>
      </div>

      {/* Area chart */}
      <ResponsiveContainer width="100%" height={90}>
        <AreaChart data={weeks} margin={{ top: 4, right: 0, bottom: 0, left: -32 }}>
          <defs>
            <linearGradient id="loadGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6c63ff" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#6c63ff" stopOpacity={0.03} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="label"
            tick={{ fontSize: 8, fill: "rgba(255,255,255,0.25)" }}
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fontSize: 8, fill: "rgba(255,255,255,0.2)" }}
            tickLine={false}
            axisLine={false}
            domain={[0, "auto"]}
          />
          <Tooltip
            contentStyle={{ background: "#1a1a2e", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 11 }}
            labelStyle={{ color: "rgba(255,255,255,0.4)" }}
            itemStyle={{ color: "#6c63ff" }}
            formatter={(v) => [`${Number(v ?? 0).toLocaleString()} ${unit}`, "Volume"]}
          />
          {chronicLoad > 0 && (
            <ReferenceLine
              y={chronicLoad}
              stroke="#6c63ff"
              strokeOpacity={0.3}
              strokeDasharray="3 3"
              strokeWidth={1}
              label={{
                value: "4wk avg",
                position: "insideTopLeft",
                fill: "rgba(108,99,255,0.35)",
                fontSize: 9,
                fontWeight: 600,
              }}
            />
          )}
          <Area
            type="monotone"
            dataKey="volume"
            stroke="#6c63ff"
            strokeWidth={2}
            fill="url(#loadGrad)"
            dot={false}
            activeDot={{ r: 3, strokeWidth: 0, fill: "#6c63ff" }}
          />
        </AreaChart>
      </ResponsiveContainer>

      {/* ACWR zone bar */}
      {acwr > 0 && (
        <div className="mt-3">
          <div className="flex items-center justify-between mb-1">
            <p className="text-[9px] text-white/20 uppercase tracking-widest font-semibold">ACWR Zone</p>
            <p className="text-[9px] text-white/30 tabular-nums">{acwr.toFixed(2)}</p>
          </div>
          <div className="relative h-2 rounded-full overflow-hidden flex">
            {/* 0–0.8 undertrained */}
            <div className="bg-amber-400/40" style={{ width: "40%" }} />
            {/* 0.8–1.3 optimal */}
            <div className="bg-trainer-success/50" style={{ width: "25%" }} />
            {/* 1.3–1.5 high */}
            <div className="bg-orange-400/50" style={{ width: "10%" }} />
            {/* 1.5–2.0 overreaching */}
            <div className="bg-red-500/50" style={{ width: "25%" }} />
          </div>
          {/* Pin marker: acwr clamped to 0–2.0 */}
          <div className="relative h-0" style={{ marginTop: "-6px" }}>
            <motion.div
              className="absolute w-2 h-2 rounded-full bg-white shadow"
              style={{ marginLeft: "-4px", marginTop: "-1px" }}
              animate={{ left: `${Math.min(Math.max(acwr / 2, 0), 1) * 100}%` }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            />
          </div>
          <div className="flex justify-between mt-2">
            {(["Under", "Optimal", "", "Over"] as const).map((z, i) => (
              z ? <span key={i} className="text-[8px] text-white/20">{z}</span> : <span key={i} />
            ))}
          </div>
        </div>
      )}

      <p className="text-[9px] text-white/15 mt-2">
        ACWR = acute/chronic workload ratio · 0.8–1.3 is optimal · dashed line = 4-week chronic avg
      </p>
    </motion.div>
  );
}
