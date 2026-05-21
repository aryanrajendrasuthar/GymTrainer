"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Minus, BarChart2 } from "lucide-react";
import { useSessionStore } from "@/app/store/sessionStore";
import { useSettingsStore } from "@/app/store/settingsStore";
import { useUserStore } from "@/app/store/userStore";
import { formatVolume, cn } from "@/app/lib/utils";
import type { WorkoutSession } from "@/app/types";

interface WeekStats {
  sessions: number;
  volumeKg: number;
  avgDurationMin: number;
  totalSets: number;
}

function getWeekStats(sessions: WorkoutSession[], startOffset: number): WeekStats {
  const now  = new Date();
  const end  = new Date(now); end.setDate(now.getDate() - startOffset);     end.setHours(23, 59, 59, 999);
  const start = new Date(now); start.setDate(now.getDate() - startOffset - 6); start.setHours(0, 0, 0, 0);

  const slice = sessions.filter((s) => {
    const d = new Date(s.date);
    return d >= start && d <= end;
  });

  const volumeKg = slice.reduce((sum, s) => sum + s.totalVolumeKg, 0);
  const totalDuration = slice.reduce((sum, s) => sum + s.durationMinutes, 0);
  const totalSets = slice.reduce((sum, s) => sum + s.exercisesCompleted.reduce((a, e) => a + e.sets.length, 0), 0);

  return {
    sessions: slice.length,
    volumeKg,
    avgDurationMin: slice.length > 0 ? Math.round(totalDuration / slice.length) : 0,
    totalSets,
  };
}

function pctChange(current: number, previous: number): number | null {
  if (previous === 0) return current > 0 ? 100 : null;
  return Math.round(((current - previous) / previous) * 100);
}

function DeltaChip({ pct }: { pct: number | null }) {
  if (pct === null) return <span className="text-[10px] text-white/20">—</span>;

  const positive = pct >= 0;
  const abs      = Math.abs(pct);
  const Icon     = pct === 0 ? Minus : positive ? TrendingUp : TrendingDown;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 text-[10px] font-bold",
        pct === 0 ? "text-white/30" : positive ? "text-trainer-success" : "text-red-400"
      )}
    >
      <Icon size={10} />
      {pct === 0 ? "same" : `${positive ? "+" : ""}${pct}%`}
    </span>
  );
}

export function WeekComparisonCard() {
  const { recentSessions } = useSessionStore();
  const { settings } = useSettingsStore();
  const { profile } = useUserStore();

  const unit = (settings.weightUnit ?? profile?.units ?? "kg") as "kg" | "lb";

  const { thisWeek, lastWeek } = useMemo(() => ({
    thisWeek: getWeekStats(recentSessions, 0),
    lastWeek: getWeekStats(recentSessions, 7),
  }), [recentSessions]);

  // Don't render if no data at all
  if (thisWeek.sessions === 0 && lastWeek.sessions === 0) return null;

  const sessionsPct  = pctChange(thisWeek.sessions, lastWeek.sessions);
  const volumePct    = pctChange(thisWeek.volumeKg, lastWeek.volumeKg);
  const durationPct  = pctChange(thisWeek.avgDurationMin, lastWeek.avgDurationMin);
  const setsPct      = pctChange(thisWeek.totalSets, lastWeek.totalSets);

  const thisVol = unit === "lb" ? thisWeek.volumeKg * 2.20462 : thisWeek.volumeKg;
  const lastVol = unit === "lb" ? lastWeek.volumeKg * 2.20462 : lastWeek.volumeKg;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05 }}
      className="bg-trainer-surface border border-white/8 rounded-[16px] p-4"
    >
      <div className="flex items-center gap-2 mb-3">
        <div className="w-7 h-7 rounded-[8px] bg-trainer-indigo/15 flex items-center justify-center">
          <BarChart2 size={13} className="text-trainer-indigo" />
        </div>
        <p className="text-sm font-bold text-white">Week vs Last Week</p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {/* Sessions */}
        <div className="bg-trainer-elevated rounded-[10px] p-2.5">
          <p className="text-[9px] text-white/25 uppercase tracking-widest font-semibold mb-1.5">Sessions</p>
          <p className="text-lg font-black text-white tabular-nums leading-none">{thisWeek.sessions}</p>
          <p className="text-[10px] text-white/25 tabular-nums mt-0.5">was {lastWeek.sessions}</p>
          <div className="mt-1.5">
            <DeltaChip pct={sessionsPct} />
          </div>
        </div>

        {/* Volume */}
        <div className="bg-trainer-elevated rounded-[10px] p-2.5">
          <p className="text-[9px] text-white/25 uppercase tracking-widest font-semibold mb-1.5">Volume</p>
          <p className="text-base font-black text-white tabular-nums leading-none">
            {formatVolume(thisWeek.volumeKg, unit)}
          </p>
          <p className="text-[10px] text-white/25 tabular-nums mt-0.5">
            {lastVol > 0 ? formatVolume(lastWeek.volumeKg, unit) : "none"}
          </p>
          <div className="mt-1.5">
            <DeltaChip pct={volumePct} />
          </div>
        </div>

        {/* Avg duration */}
        <div className="bg-trainer-elevated rounded-[10px] p-2.5">
          <p className="text-[9px] text-white/25 uppercase tracking-widest font-semibold mb-1.5">Avg Duration</p>
          <p className="text-lg font-black text-white tabular-nums leading-none">
            {thisWeek.avgDurationMin > 0 ? `${thisWeek.avgDurationMin}m` : "—"}
          </p>
          <p className="text-[10px] text-white/25 tabular-nums mt-0.5">
            {lastWeek.avgDurationMin > 0 ? `${lastWeek.avgDurationMin}m` : "none"}
          </p>
          <div className="mt-1.5">
            <DeltaChip pct={durationPct} />
          </div>
        </div>

        {/* Total sets */}
        <div className="bg-trainer-elevated rounded-[10px] p-2.5">
          <p className="text-[9px] text-white/25 uppercase tracking-widest font-semibold mb-1.5">Total Sets</p>
          <p className="text-lg font-black text-white tabular-nums leading-none">
            {thisWeek.totalSets > 0 ? thisWeek.totalSets : "—"}
          </p>
          <p className="text-[10px] text-white/25 tabular-nums mt-0.5">
            {lastWeek.totalSets > 0 ? `was ${lastWeek.totalSets}` : "none"}
          </p>
          <div className="mt-1.5">
            <DeltaChip pct={setsPct} />
          </div>
        </div>
      </div>

      {/* Summary footer */}
      {(volumePct !== null || sessionsPct !== null) && (
        <div className="mt-2.5 pt-2.5 border-t border-white/5 flex items-center justify-between">
          <p className="text-[10px] text-white/25">vs last week</p>
          <div className="flex items-center gap-2">
            {volumePct !== null && (
              <span className={cn(
                "text-[10px] font-bold",
                volumePct > 0 ? "text-trainer-success" : volumePct < 0 ? "text-red-400" : "text-white/30"
              )}>
                {volumePct > 0 ? "+" : ""}{volumePct}% volume
              </span>
            )}
            {sessionsPct !== null && (
              <span className={cn(
                "text-[10px] font-semibold",
                sessionsPct > 0 ? "text-trainer-success/70" : sessionsPct < 0 ? "text-red-400/70" : "text-white/25"
              )}>
                · {sessionsPct > 0 ? "+" : ""}{sessionsPct}% sessions
              </span>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
}
