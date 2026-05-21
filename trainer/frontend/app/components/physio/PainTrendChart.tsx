"use client";

import { useMemo } from "react";
import { TrendingDown, TrendingUp, Minus } from "lucide-react";
import { cn } from "@/app/lib/utils";
import type { PhysioCondition } from "@/app/types";

interface PainEntry {
  condition: PhysioCondition;
  level: number;
  loggedAt: string;
}

interface PainTrendChartProps {
  condition: PhysioCondition;
  painHistory: PainEntry[];
  className?: string;
}

const W = 240;
const H = 56;
const PAD = 6;

export function PainTrendChart({ condition, painHistory, className }: PainTrendChartProps) {
  const entries = useMemo(() => {
    return painHistory
      .filter((p) => p.condition === condition)
      .sort((a, b) => new Date(a.loggedAt).getTime() - new Date(b.loggedAt).getTime())
      .slice(-14);
  }, [condition, painHistory]);

  if (entries.length < 3) return null;

  const min = Math.min(...entries.map((e) => e.level));
  const max = Math.max(...entries.map((e) => e.level));
  const range = Math.max(max - min, 1);

  const plotH = H - PAD * 2;
  const plotW = W - PAD * 2;

  const pts = entries.map((e, i) => {
    const x = PAD + (i / (entries.length - 1)) * plotW;
    const y = PAD + plotH - ((e.level - min) / range) * plotH;
    return { x, y, level: e.level };
  });

  const polyline = pts.map((p) => `${p.x},${p.y}`).join(" ");

  const first = entries[0].level;
  const last = entries[entries.length - 1].level;
  const delta = last - first;

  const trendColor =
    delta < -1 ? "#34D399" : delta > 1 ? "#F87171" : "#9CA3AF";
  const TrendIcon = delta < -1 ? TrendingDown : delta > 1 ? TrendingUp : Minus;

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <div className="flex items-center justify-between">
        <p className="text-[10px] text-white/30 uppercase tracking-wider font-semibold">
          Pain Trend ({entries.length} readings)
        </p>
        <div className="flex items-center gap-1.5">
          <TrendIcon size={11} style={{ color: trendColor }} />
          <span className="text-[11px] font-bold tabular-nums" style={{ color: trendColor }}>
            {delta > 0 ? "+" : ""}{delta.toFixed(0)}
          </span>
          {delta < -1 && first > 0 && (
            <span className="text-[9px] font-semibold text-trainer-success bg-trainer-success/10 px-1.5 py-0.5 rounded-full">
              {Math.round(Math.abs(delta) / first * 100)}% better
            </span>
          )}
        </div>
      </div>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        style={{ height: H }}
        aria-hidden
      >
        {/* Fill area */}
        <defs>
          <linearGradient id={`pain-grad-${condition}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={trendColor} stopOpacity="0.18" />
            <stop offset="100%" stopColor={trendColor} stopOpacity="0" />
          </linearGradient>
        </defs>
        <polygon
          points={`${pts[0].x},${H} ${polyline} ${pts[pts.length - 1].x},${H}`}
          fill={`url(#pain-grad-${condition})`}
        />
        {/* Line */}
        <polyline
          points={polyline}
          fill="none"
          stroke={trendColor}
          strokeWidth="1.5"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {/* Dots */}
        {pts.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={i === pts.length - 1 ? 3 : 1.5} fill={trendColor} />
        ))}
      </svg>

      <div className="flex items-center justify-between">
        <span className="text-[10px] text-white/25">
          {new Date(entries[0].loggedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
        </span>
        <span className="text-[10px] font-semibold" style={{ color: trendColor }}>
          Now: {last}/10
        </span>
      </div>
    </div>
  );
}
