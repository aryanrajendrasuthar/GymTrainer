"use client";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from "recharts";
import { cn } from "@/app/lib/utils";

export interface WeeklyVolumeData {
  week: string;
  volume: number;
  sessions: number;
}

interface VolumeChartProps {
  data: WeeklyVolumeData[];
  unit: "kg" | "lb";
  className?: string;
}

function CustomTooltip({
  active,
  payload,
  label,
  unit,
}: {
  active?: boolean;
  payload?: { value: number; payload: WeeklyVolumeData }[];
  label?: string;
  unit: "kg" | "lb";
}) {
  if (!active || !payload?.length) return null;
  const item = payload[0];
  return (
    <div className="bg-trainer-elevated border border-white/15 rounded-[10px] px-3 py-2.5 shadow-xl">
      <p className="text-[11px] text-white/40 mb-1">{label}</p>
      <p className="text-sm font-bold text-white tabular-nums">
        {item.value.toLocaleString()} {unit}
      </p>
      <p className="text-[11px] text-white/40">
        {item.payload.sessions} session{item.payload.sessions !== 1 ? "s" : ""}
      </p>
    </div>
  );
}

export function VolumeChart({ data, unit, className }: VolumeChartProps) {
  const hasData = data.some((d) => d.volume > 0);

  if (!hasData) {
    return (
      <div
        className={cn(
          "flex items-center justify-center h-40 rounded-[12px] bg-white/3 border border-white/6",
          className
        )}
      >
        <p className="text-sm text-white/25">No volume data yet</p>
      </div>
    );
  }

  const maxVol = Math.max(...data.map((d) => d.volume));
  const nonZeroData = data.filter((d) => d.volume > 0);
  const avgVol = nonZeroData.length > 1
    ? Math.round(nonZeroData.reduce((a, d) => a + d.volume, 0) / nonZeroData.length)
    : 0;
  const totalSessions = data.reduce((s, d) => s + d.sessions, 0);

  return (
    <div className={className}><div className="h-44">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="volumeGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6C63FF" stopOpacity={0.4} />
              <stop offset="100%" stopColor="#6C63FF" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="rgba(255,255,255,0.05)"
            vertical={false}
          />
          <XAxis
            dataKey="week"
            tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            domain={[0, maxVol * 1.15]}
            tick={{ fill: "rgba(255,255,255,0.25)", fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(v))}
          />
          <Tooltip
            content={<CustomTooltip unit={unit} />}
            cursor={{ stroke: "rgba(108,99,255,0.3)", strokeWidth: 1 }}
          />
          <Area
            type="monotone"
            dataKey="volume"
            stroke="#6C63FF"
            strokeWidth={2}
            fill="url(#volumeGrad)"
            dot={false}
            activeDot={{ r: 4, fill: "#6C63FF", stroke: "#0A0A0F", strokeWidth: 2 }}
          />
          {avgVol > 0 && (
            <ReferenceLine
              y={avgVol}
              stroke="rgba(108,99,255,0.4)"
              strokeDasharray="4 3"
              strokeWidth={1}
            />
          )}
        </AreaChart>
      </ResponsiveContainer>
      </div>
      {totalSessions > 0 && (
        <div className="flex items-center justify-between mt-1.5 px-1">
          <span className="text-[10px] text-white/25 tabular-nums">{totalSessions} sessions</span>
          {avgVol > 0 && (
            <span className="text-[10px] text-trainer-indigo/60 tabular-nums">
              ~{avgVol.toLocaleString()} {unit} avg/wk
            </span>
          )}
        </div>
      )}
    </div>
  );
}
