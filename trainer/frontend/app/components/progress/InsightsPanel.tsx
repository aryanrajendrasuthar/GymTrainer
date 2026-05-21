"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Calendar, Zap, Target, Minus, Clock, type LucideIcon } from "lucide-react";
import { exerciseMap } from "@/app/data/exercises";
import { estimateOneRepMax } from "@/app/lib/progression-engine";
import { formatVolume, cn } from "@/app/lib/utils";
import type { WorkoutSession, ExerciseLog } from "@/app/types";

interface Props {
  sessions: WorkoutSession[];
  allLogs: ExerciseLog[];
  unit: "kg" | "lb";
}

// ─── Computation helpers ───────────────────────────────────────────────────────

function computeBestDay(sessions: WorkoutSession[]): { day: string; avgVolume: number } | null {
  if (sessions.length < 6) return null;
  const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const byDow: Record<number, number[]> = {};
  for (const s of sessions) {
    const dow = (new Date(s.date).getDay() + 6) % 7; // Mon=0
    if (!byDow[dow]) byDow[dow] = [];
    byDow[dow].push(s.totalVolumeKg);
  }
  let bestDow = -1, bestAvg = 0;
  for (const [dowStr, vols] of Object.entries(byDow)) {
    if (vols.length < 2) continue;
    const avg = vols.reduce((a, b) => a + b, 0) / vols.length;
    if (avg > bestAvg) { bestAvg = avg; bestDow = Number(dowStr); }
  }
  if (bestDow === -1) return null;
  return { day: DAYS[bestDow]!, avgVolume: bestAvg };
}

function computeVolumeTrend(sessions: WorkoutSession[]): { pct: number; direction: "up" | "down" | "flat"; recentVol: number; earlierVol: number } | null {
  const now = Date.now();
  const cut28 = now - 28 * 86400000;
  const cut56 = now - 56 * 86400000;
  const recent = sessions.filter((s) => new Date(s.date).getTime() >= cut28);
  const earlier = sessions.filter((s) => {
    const t = new Date(s.date).getTime();
    return t >= cut56 && t < cut28;
  });
  if (recent.length < 2 || earlier.length < 2) return null;
  const recentVol = recent.reduce((a, s) => a + s.totalVolumeKg, 0);
  const earlierVol = earlier.reduce((a, s) => a + s.totalVolumeKg, 0);
  if (earlierVol === 0) return null;
  const pct = Math.round(((recentVol - earlierVol) / earlierVol) * 100);
  return { pct, direction: pct > 5 ? "up" : pct < -5 ? "down" : "flat", recentVol: Math.round(recentVol), earlierVol: Math.round(earlierVol) };
}

function computeTopImproving(allLogs: ExerciseLog[]): { name: string; pct: number } | null {
  const now = Date.now();
  const cut8 = now - 56 * 86400000;   // 8 weeks ago
  const cut16 = now - 112 * 86400000; // 16 weeks ago

  const byExercise: Record<string, { recent: number[]; earlier: number[] }> = {};
  for (const log of allLogs) {
    const t = new Date(log.loggedAt).getTime();
    if (t < cut16) continue;
    const e1rms = log.sets
      .map((s) => estimateOneRepMax(s.weightUsed, s.repsCompleted))
      .filter((v) => v > 0);
    const best = e1rms.length ? Math.max(...e1rms) : 0;
    if (best === 0) continue;
    if (!byExercise[log.exerciseId]) byExercise[log.exerciseId] = { recent: [], earlier: [] };
    if (t >= cut8) byExercise[log.exerciseId].recent.push(best);
    else byExercise[log.exerciseId].earlier.push(best);
  }

  let bestId: string | null = null, bestPct = 0;
  for (const [id, { recent, earlier }] of Object.entries(byExercise)) {
    if (recent.length < 2 || earlier.length < 2) continue;
    const recentBest = Math.max(...recent);
    const earlierBest = Math.max(...earlier);
    if (earlierBest === 0) continue;
    const pct = ((recentBest - earlierBest) / earlierBest) * 100;
    if (pct > bestPct) { bestPct = pct; bestId = id; }
  }

  if (!bestId || bestPct < 1) return null;
  return { name: exerciseMap[bestId]?.name ?? bestId, pct: Math.round(bestPct) };
}

function computeLongestStreak(sessions: WorkoutSession[]): number {
  if (!sessions.length) return 0;
  const uniqueDays = Array.from(new Set(
    sessions.map((s) => { const d = new Date(s.date); d.setHours(0, 0, 0, 0); return d.getTime(); })
  )).sort((a, b) => a - b);

  let longest = 1, current = 1;
  for (let i = 1; i < uniqueDays.length; i++) {
    if (uniqueDays[i]! - uniqueDays[i - 1]! === 86400000) {
      current++;
      if (current > longest) longest = current;
    } else {
      current = 1;
    }
  }
  return longest;
}

function computeBestTimeOfDay(allLogs: ExerciseLog[]): { label: string; sessionCount: number } | null {
  if (allLogs.length < 8) return null;

  // Deduplicate by session: take the earliest loggedAt per sessionId
  const sessionHours = new Map<string, number>();
  for (const log of allLogs) {
    const hour = new Date(log.loggedAt).getHours();
    const existing = sessionHours.get(log.sessionId);
    if (existing === undefined || hour < existing) {
      sessionHours.set(log.sessionId, hour);
    }
  }

  const buckets: Record<string, number> = {
    "Early morning (5–8 AM)": 0,
    "Morning (8–12 PM)": 0,
    "Afternoon (12–5 PM)": 0,
    "Evening (5–9 PM)": 0,
    "Night (9 PM+)": 0,
  };

  sessionHours.forEach((hour) => {
    if (hour >= 5 && hour < 8) buckets["Early morning (5–8 AM)"]++;
    else if (hour >= 8 && hour < 12) buckets["Morning (8–12 PM)"]++;
    else if (hour >= 12 && hour < 17) buckets["Afternoon (12–5 PM)"]++;
    else if (hour >= 17 && hour < 21) buckets["Evening (5–9 PM)"]++;
    else if (hour >= 21 || hour < 5) buckets["Night (9 PM+)"]++;
  });

  const top = Object.entries(buckets)
    .filter(([, c]) => c >= 3)
    .sort(([, a], [, b]) => b - a)[0];

  if (!top) return null;
  return { label: top[0], sessionCount: top[1] };
}

function computeAvgPerWeek(sessions: WorkoutSession[]): number | null {
  if (sessions.length < 3) return null;
  const sorted = [...sessions].sort((a, b) => a.date.localeCompare(b.date));
  const firstDate = new Date(sorted[0]!.date).getTime();
  const lastDate = new Date(sorted[sorted.length - 1]!.date).getTime();
  const weeks = Math.max(1, (lastDate - firstDate) / (7 * 86400000));
  return Math.round((sessions.length / weeks) * 10) / 10;
}

// ─── Insight card ──────────────────────────────────────────────────────────────

function InsightCard({
  icon: Icon,
  iconColor,
  iconBg,
  title,
  value,
  sub,
  delay,
}: {
  icon: LucideIcon;
  iconColor: string;
  iconBg: string;
  title: string;
  value: string;
  sub: string;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="bg-trainer-surface border border-white/8 rounded-[16px] p-4 flex items-start gap-3"
    >
      <div className={cn("w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0 mt-0.5", iconBg)}>
        <Icon size={16} className={iconColor} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] text-white/35 uppercase tracking-widest font-semibold mb-1">{title}</p>
        <p className="text-base font-bold text-white leading-tight">{value}</p>
        <p className="text-xs text-white/35 mt-0.5 leading-relaxed">{sub}</p>
      </div>
    </motion.div>
  );
}

// ─── Volume trend row ──────────────────────────────────────────────────────────

function VolumeTrendInsight({ pct, direction, recentVol, earlierVol, unit }: { pct: number; direction: "up" | "down" | "flat"; recentVol: number; earlierVol: number; unit: "kg" | "lb" }) {
  const Icon = direction === "up" ? TrendingUp : direction === "down" ? TrendingDown : Minus;
  const color = direction === "up" ? "text-trainer-success" : direction === "down" ? "text-red-400" : "text-white/40";
  const bg = direction === "up" ? "bg-trainer-success/12" : direction === "down" ? "bg-red-400/12" : "bg-white/6";
  const label = direction === "up" ? `+${pct}% vs prev 4 weeks` : direction === "down" ? `${pct}% vs prev 4 weeks` : "Stable vs prev 4 weeks";
  const recentStr = formatVolume(recentVol, unit);
  const earlierStr = formatVolume(earlierVol, unit);
  const sub = direction === "up"
    ? `${recentStr} recent vs ${earlierStr} prior 4 weeks — progressive overload is working.`
    : direction === "down"
    ? `${recentStr} recent vs ${earlierStr} prior 4 weeks. Consider increasing frequency or load.`
    : `~${recentStr} per 4 weeks — volume is stable. Try adding a set or two per session.`;

  return (
    <InsightCard
      icon={Icon}
      iconColor={color}
      iconBg={bg}
      title="Volume Trend"
      value={label}
      sub={sub}
      delay={0.08}
    />
  );
}

// ─── Panel ─────────────────────────────────────────────────────────────────────

export function InsightsPanel({ sessions, allLogs, unit }: Props) {
  const bestDay = useMemo(() => computeBestDay(sessions), [sessions]);
  const volumeTrend = useMemo(() => computeVolumeTrend(sessions), [sessions]);
  const topImproving = useMemo(() => computeTopImproving(allLogs), [allLogs]);
  const longestStreak = useMemo(() => computeLongestStreak(sessions), [sessions]);
  const avgPerWeek = useMemo(() => computeAvgPerWeek(sessions), [sessions]);
  const bestTimeOfDay = useMemo(() => computeBestTimeOfDay(allLogs), [allLogs]);

  if (sessions.length < 3) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-trainer-surface border border-white/8 rounded-[16px] p-6 text-center"
      >
        <p className="text-sm text-white/30">Log at least 3 workouts to unlock insights.</p>
      </motion.div>
    );
  }

  const insightCount = [
    volumeTrend,
    bestDay,
    topImproving,
    avgPerWeek !== null,
    longestStreak >= 2,
    bestTimeOfDay,
  ].filter(Boolean).length;

  return (
    <div className="flex flex-col gap-3">
      {insightCount > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold text-white">Training Insights</p>
          <span className="text-[10px] font-bold text-trainer-indigo/70 bg-trainer-indigo/8 border border-trainer-indigo/15 px-2 py-0.5 rounded-full tabular-nums">
            {insightCount} insights
          </span>
        </div>
      )}
      {/* Volume trend */}
      {volumeTrend && (
        <VolumeTrendInsight pct={volumeTrend.pct} direction={volumeTrend.direction} recentVol={volumeTrend.recentVol} earlierVol={volumeTrend.earlierVol} unit={unit} />
      )}

      {/* Best training day */}
      {bestDay && (
        <InsightCard
          icon={Calendar}
          iconColor="text-trainer-indigo"
          iconBg="bg-trainer-indigo/12"
          title="Strongest Day"
          value={bestDay.day}
          sub={`Your ${bestDay.day} sessions average ${formatVolume(bestDay.avgVolume, unit)} — your highest-volume training day.`}
          delay={0.12}
        />
      )}

      {/* Top improving lift */}
      {topImproving && (
        <InsightCard
          icon={Zap}
          iconColor="text-yellow-400"
          iconBg="bg-yellow-400/12"
          title="Fastest Improving Lift"
          value={topImproving.name}
          sub={`+${topImproving.pct}% e1RM improvement in the last 8 weeks vs the 8 weeks before.`}
          delay={0.16}
        />
      )}

      {/* Avg sessions per week */}
      {avgPerWeek !== null && (
        <InsightCard
          icon={Target}
          iconColor="text-trainer-success"
          iconBg="bg-trainer-success/12"
          title="Training Frequency"
          value={`${avgPerWeek}× / week`}
          sub={
            avgPerWeek >= 4 ? "High frequency — great for muscle gain." :
            avgPerWeek >= 3 ? "Solid training frequency. Consistent progress expected." :
            "Consider adding one more session per week for faster results."
          }
          delay={0.2}
        />
      )}

      {/* Longest streak */}
      {longestStreak >= 2 && (
        <InsightCard
          icon={TrendingUp}
          iconColor="text-trainer-warning"
          iconBg="bg-trainer-warning/12"
          title="Longest Streak"
          value={`${longestStreak} consecutive days`}
          sub="Your best run of back-to-back training days. Keep building consistency."
          delay={0.24}
        />
      )}

      {/* Best training time */}
      {bestTimeOfDay && (
        <InsightCard
          icon={Clock}
          iconColor="text-trainer-indigo"
          iconBg="bg-trainer-indigo/12"
          title="Peak Training Time"
          value={bestTimeOfDay.label}
          sub={`${bestTimeOfDay.sessionCount} of your sessions fall in this window — your most consistent training slot.`}
          delay={0.28}
        />
      )}

      {/* Empty state for specific insights */}
      {!volumeTrend && !bestDay && !topImproving && (
        <div className="bg-trainer-surface border border-white/8 rounded-[16px] p-5 text-center">
          <p className="text-sm text-white/30">Keep training to unlock more pattern insights.</p>
        </div>
      )}
    </div>
  );
}
