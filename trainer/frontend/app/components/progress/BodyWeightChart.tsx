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
import { type BodyWeightEntry } from "@/app/store/progressStore";

interface BodyWeightChartProps {
  data: BodyWeightEntry[];
  unit: "kg" | "lb";
  goalWeightKg?: number;
  className?: string;
}

function toDisplayWeight(kg: number, unit: "kg" | "lb") {
  return unit === "lb" ? Math.round(kg * 2.20462 * 10) / 10 : kg;
}

function CustomTooltip({
  active,
  payload,
  label,
  unit,
}: {
  active?: boolean;
  payload?: { value: number }[];
  label?: string;
  unit: "kg" | "lb";
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-trainer-elevated border border-white/15 rounded-[10px] px-3 py-2.5 shadow-xl">
      <p className="text-[11px] text-white/40 mb-1">{label}</p>
      <p className="text-sm font-bold text-trainer-success tabular-nums">
        {payload[0].value} {unit}
      </p>
    </div>
  );
}

export function BodyWeightChart({ data, unit, goalWeightKg, className }: BodyWeightChartProps) {
  if (data.length < 2) {
    return (
      <div
        className={cn(
          "flex items-center justify-center h-36 rounded-[12px] bg-white/3 border border-white/6",
          className
        )}
      >
        <p className="text-sm text-white/25 text-center px-4">
          Log {2 - data.length} more weigh-in{data.length === 0 ? "s" : ""} to see trend
        </p>
      </div>
    );
  }

  const displayData = [...data]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((entry) => ({
      date: new Date(entry.date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      weight: toDisplayWeight(entry.weightKg, unit),
    }));

  const weights = displayData.map((d) => d.weight);
  const goalDisplay = goalWeightKg ? toDisplayWeight(goalWeightKg, unit) : null;
  const allValues = goalDisplay ? [...weights, goalDisplay] : weights;
  const minW = Math.min(...allValues);
  const maxW = Math.max(...allValues);
  const padding = (maxW - minW) * 0.3 || 2;
  const avgW = Math.round((weights.reduce((a, b) => a + b, 0) / weights.length) * 10) / 10;

  return (
    <div className={cn("h-36", className)}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={displayData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
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
            domain={[minW - padding, maxW + padding]}
            tick={{ fill: "rgba(255,255,255,0.25)", fontSize: 10 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            content={<CustomTooltip unit={unit} />}
            cursor={{ stroke: "rgba(0,212,170,0.25)", strokeWidth: 1 }}
          />
          <ReferenceLine
            y={avgW}
            stroke="rgba(0,212,170,0.2)"
            strokeDasharray="4 4"
            label={{
              value: `avg ${avgW}${unit}`,
              position: "insideTopLeft",
              fill: "rgba(0,212,170,0.35)",
              fontSize: 9,
              fontWeight: 600,
            }}
          />
          {goalDisplay !== null && (
            <ReferenceLine
              y={goalDisplay}
              stroke="rgba(108,99,255,0.55)"
              strokeDasharray="5 3"
              label={{
                value: `Goal ${goalDisplay}${unit}`,
                position: "insideTopRight",
                fill: "rgba(108,99,255,0.7)",
                fontSize: 9,
                fontWeight: 600,
              }}
            />
          )}
          <Line
            type="monotone"
            dataKey="weight"
            stroke="#00D4AA"
            strokeWidth={2}
            dot={{ r: 3, fill: "#00D4AA", stroke: "#0A0A0F", strokeWidth: 2 }}
            activeDot={{ r: 5, fill: "#00D4AA", stroke: "#0A0A0F", strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
