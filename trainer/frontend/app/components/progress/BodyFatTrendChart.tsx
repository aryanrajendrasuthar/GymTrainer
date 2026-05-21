"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { type BodyMeasurementEntry } from "@/app/store/progressStore";

// US Navy body fat formula
function navyBodyFat(
  gender: "male" | "female" | "other",
  heightCm: number,
  waistCm: number,
  neckCm: number,
  hipsCm?: number
): number | null {
  if (heightCm <= 0 || waistCm <= 0 || neckCm <= 0) return null;
  const h = Math.log10(heightCm);
  if (gender === "male") {
    if (waistCm <= neckCm) return null;
    return Math.round((86.010 * Math.log10(waistCm - neckCm) - 70.041 * h + 36.76) * 10) / 10;
  }
  if (!hipsCm || hipsCm <= 0) return null;
  if (waistCm + hipsCm <= neckCm) return null;
  return Math.round((163.205 * Math.log10(waistCm + hipsCm - neckCm) - 97.684 * h - 78.387) * 10) / 10;
}

interface DataPoint {
  date: string;
  bf: number;
}

interface Props {
  logs: BodyMeasurementEntry[];
  gender: "male" | "female" | "other";
  heightCm: number;
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-trainer-elevated border border-white/15 rounded-[10px] px-3 py-2.5 shadow-xl">
      <p className="text-[11px] text-white/40 mb-1">{label}</p>
      <p className="text-sm font-bold text-trainer-indigo tabular-nums">{payload[0].value}%</p>
    </div>
  );
}

export function BodyFatTrendChart({ logs, gender, heightCm }: Props) {
  const data: DataPoint[] = [];

  for (const entry of [...logs].sort((a, b) => a.date.localeCompare(b.date))) {
    const m = entry.measurements;
    if (!m.waistCm || !m.neckCm) continue;
    const bf = navyBodyFat(gender, heightCm, m.waistCm, m.neckCm, m.hipsCm);
    if (bf === null || bf < 2 || bf > 60) continue;
    data.push({
      date: new Date(entry.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      bf,
    });
  }

  if (data.length < 2) return null;

  const values = data.map((d) => d.bf);
  const min = Math.floor(Math.min(...values) - 1);
  const max = Math.ceil(Math.max(...values) + 1);

  return (
    <div className="bg-trainer-surface border border-white/8 rounded-[16px] p-4">
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs text-white/35 uppercase tracking-widest font-semibold">
          Body Fat % Trend
        </p>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-bold text-trainer-indigo/70 tabular-nums">
            {data[data.length - 1]!.bf}%
          </span>
          <span className="text-[9px] text-white/20 tabular-nums">{data.length} entries</span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={140}>
        <LineChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis
            dataKey="date"
            tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            domain={[min, max]}
            tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `${v}%`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Line
            type="monotone"
            dataKey="bf"
            stroke="#6C63FF"
            strokeWidth={2}
            dot={{ fill: "#6C63FF", r: 3, strokeWidth: 0 }}
            activeDot={{ r: 5, fill: "#6C63FF" }}
          />
        </LineChart>
      </ResponsiveContainer>
      <div className="flex items-center justify-between mt-1">
        {(() => {
          const delta = Math.round((data[data.length - 1]!.bf - data[0]!.bf) * 10) / 10;
          if (delta === 0) return <span />;
          return (
            <span className={`text-[9px] font-semibold ${delta < 0 ? "text-trainer-success" : "text-red-400"}`}>
              {delta > 0 ? "+" : ""}{delta}% since first entry
            </span>
          );
        })()}
        <p className="text-[9px] text-white/20">US Navy method</p>
      </div>
    </div>
  );
}
