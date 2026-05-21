"use client";

import { History, Trophy, Star } from "lucide-react";
import { type SetLog } from "@/app/types";
import { formatRelativeDate } from "@/app/lib/utils";
import { cn } from "@/app/lib/utils";

interface PreviousPerformanceData {
  lastSession?: {
    date: string;
    sets: SetLog[];
  };
  personalBest?: {
    weightKg: number;
    reps: number;
    unit: "kg" | "lb";
  };
  isFirstTime: boolean;
  suggestedBeginnerWeight?: number;
}

interface PreviousPerformancePanelProps {
  data: PreviousPerformanceData;
  unit?: "kg" | "lb";
  className?: string;
}

export function PreviousPerformancePanel({
  data,
  unit = "kg",
  className,
}: PreviousPerformancePanelProps) {
  if (data.isFirstTime) {
    return (
      <div className={cn("bg-trainer-indigo/8 border border-trainer-indigo/20 rounded-[12px] p-3", className)}>
        <div className="flex items-center gap-2 mb-1">
          <Star size={14} className="text-trainer-indigo shrink-0" />
          <span className="text-xs font-medium text-trainer-indigo">First time doing this exercise</span>
        </div>
        <p className="text-xs text-white/50">
          Enter your starting weight.
          {data.suggestedBeginnerWeight ? (
            <> Suggested for beginners: <span className="text-white/80 font-medium">{data.suggestedBeginnerWeight}{unit}</span></>
          ) : null}
        </p>
      </div>
    );
  }

  if (!data.lastSession) return null;

  return (
    <div className={cn("bg-trainer-elevated/60 border border-white/8 rounded-[12px] p-3 space-y-2.5", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <History size={13} className="text-white/30" />
          <span className="text-[11px] font-medium text-white/40 uppercase tracking-wider">
            Last Session
          </span>
        </div>
        <span className="text-[11px] text-white/30">
          {formatRelativeDate(data.lastSession.date)}
        </span>
      </div>

      {/* Set-by-set data */}
      <div className="space-y-1">
        {data.lastSession.sets.map((set) => (
          <div key={set.setNumber} className="flex items-center justify-between">
            <span className="text-[11px] text-white/40">Set {set.setNumber}</span>
            <span className="text-[11px] text-white/70 font-medium tabular-nums">
              {set.repsCompleted} reps @ {set.weightUsed}{unit}
            </span>
          </div>
        ))}
        {data.lastSession.sets.length > 0 && (() => {
          const vol = Math.round(data.lastSession!.sets.reduce((s, set) => s + set.repsCompleted * set.weightUsed, 0));
          return (
            <div className="flex items-center justify-between pt-1 border-t border-white/5">
              <span className="text-[10px] text-white/25">Session volume</span>
              <span className="text-[10px] font-semibold text-white/40 tabular-nums">{vol} {unit}</span>
            </div>
          );
        })()}
      </div>

      {/* Personal best */}
      {data.personalBest && (
        <div className="flex items-center justify-between pt-1.5 border-t border-white/6">
          <div className="flex items-center gap-1.5">
            <Trophy size={12} className="text-trainer-gold" />
            <span className="text-[11px] font-medium text-trainer-gold">Personal Best</span>
          </div>
          <span className="text-[11px] font-semibold text-trainer-gold tabular-nums">
            {data.personalBest.weightKg}{unit} × {data.personalBest.reps}
          </span>
        </div>
      )}
    </div>
  );
}
