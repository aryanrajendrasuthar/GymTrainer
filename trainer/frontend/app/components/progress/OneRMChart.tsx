"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from "recharts";
import { cn } from "@/app/lib/utils";

export interface OneRMDataPoint {
  date: string;
  estimated1RM: number;
  topWeight: number;
  topReps: number;
}

interface OneRMChartProps {
  data: OneRMDataPoint[];
  unit: "kg" | "lb";
  exerciseName: string;
  className?: string;
}

function CustomTooltip({
  active,
  payload,
  label,
  unit,
}: {
  active?: boolean;
  payload?: { value: number; payload: OneRMDataPoint }[];
  label?: string;
  unit: "kg" | "lb";
}) {
  if (!active || !payload?.length) return null;
  const item = payload[0];
  return (
    <div className="bg-trainer-elevated border border-white/15 rounded-[10px] px-3 py-2.5 shadow-xl">
      <p className="text-[11px] text-white/40 mb-1">{label}</p>
      <p className="text-sm font-bold text-trainer-indigo tabular-nums">
        {item.value}{unit} e1RM
      </p>
      <p className="text-[11px] text-white/40">
        {item.payload.topWeight}{unit} × {item.payload.topReps}
      </p>
    </div>
  );
}

export function OneRMChart({ data, unit, className }: OneRMChartProps) {
  if (data.length < 2) {
    return (
      <div
        className={cn(
          "flex items-center justify-center h-36 rounded-[12px] bg-white/3 border border-white/6",
          className
        )}
      >
        <p className="text-sm text-white/25 text-center px-4">
          Log {2 - data.length} more session{data.length === 0 ? "s" : ""} to see progression
        </p>
      </div>
    );
  }

  const maxE1RM = Math.max(...data.map((d) => d.estimated1RM));
  const minE1RM = Math.min(...data.map((d) => d.estimated1RM));
  const padding = (maxE1RM - minE1RM) * 0.2 || 5;
  const delta = data.length >= 2
    ? Math.round(((data[data.length - 1]!.estimated1RM - data[0]!.estimated1RM) / data[0]!.estimated1RM) * 100)
    : null;

  return (
    <div className={className}>
      <div className="h-36">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="rgba(255,255,255,0.05)"
            vertical={false}
          />
          <XAxis
            dataKey="date"
            tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            domain={[minE1RM - padding, maxE1RM + padding]}
            tick={{ fill: "rgba(255,255,255,0.25)", fontSize: 10 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            content={<CustomTooltip unit={unit} />}
            cursor={{ stroke: "rgba(108,99,255,0.25)", strokeWidth: 1 }}
          />
          <ReferenceLine
            y={maxE1RM}
            stroke="rgba(255,215,0,0.25)"
            strokeDasharray="4 4"
            label={{
              value: `PR ${maxE1RM}${unit}`,
              position: "insideTopRight",
              fill: "rgba(255,215,0,0.5)",
              fontSize: 9,
              fontWeight: 600,
            }}
          />
          <Line
            type="monotone"
            dataKey="estimated1RM"
            stroke="#6C63FF"
            strokeWidth={2}
            dot={{ r: 3, fill: "#6C63FF", stroke: "#0A0A0F", strokeWidth: 2 }}
            activeDot={{ r: 5, fill: "#6C63FF", stroke: "#0A0A0F", strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
      </div>
      {delta !== null && (
        <div className="flex items-center justify-between mt-1.5 px-1">
          <span className="text-[10px] text-white/25 tabular-nums">{data.length} sessions</span>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-trainer-gold/40 tabular-nums">peak {maxE1RM}{unit}</span>
            <span className={cn("text-[10px] font-bold tabular-nums", delta >= 0 ? "text-trainer-success" : "text-red-400")}>
              {delta >= 0 ? "+" : ""}{delta}% overall
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
