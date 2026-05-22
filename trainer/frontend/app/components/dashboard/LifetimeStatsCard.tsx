"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { Flame, Trophy, Clock, Dumbbell, TrendingUp, Zap } from "lucide-react";
import { useSessionStore } from "@/app/store/sessionStore";
import { useSettingsStore } from "@/app/store/settingsStore";
import { useUserStore } from "@/app/store/userStore";
import { estimateOneRepMax } from "@/app/lib/progression-engine";
import { formatVolume, cn } from "@/app/lib/utils";

// MET-based calorie estimator (same as SessionComplete)
function estimateCalories(weightKg: number, durationMin: number, exerciseIds: string[]): number {
  if (!weightKg || durationMin <= 0) return 0;
  const metabolicIds = ["battle-ropes", "burpee", "mountain-climbers", "box-jump", "jump-rope", "kettlebell-swing"];
  const heavyIds = ["barbell-deadlift", "barbell-squat", "barbell-bench-press", "overhead-press", "barbell-bent-over-row"];
  const isMetabolic = exerciseIds.some((id) => metabolicIds.includes(id));
  const heavyCount = exerciseIds.filter((id) => heavyIds.includes(id)).length;
  const met = isMetabolic ? 7.0 : heavyCount >= 2 ? 5.5 : 4.0;
  return Math.round(met * weightKg * (durationMin / 60));
}

function formatBigNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

// ─── Stat tile ────────────────────────────────────────────────────────────────

function StatTile({
  icon: Icon,
  label,
  value,
  sub,
  color,
  bg,
  delay,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  sub?: string;
  color: string;
  bg: string;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay, type: "spring", stiffness: 280, damping: 24 }}
      className="bg-trainer-elevated rounded-[14px] p-3 flex flex-col gap-2"
    >
      <div className={cn("w-8 h-8 rounded-[9px] flex items-center justify-center", bg)}>
        <Icon size={15} className={color} />
      </div>
      <div>
        <p className="text-lg font-black text-white tabular-nums leading-tight">{value}</p>
        {sub && <p className="text-[10px] text-white/30 tabular-nums">{sub}</p>}
      </div>
      <p className="text-[10px] text-white/35 uppercase tracking-widest font-semibold">{label}</p>
    </motion.div>
  );
}

// ─── Card ─────────────────────────────────────────────────────────────────────

export function LifetimeStatsCard() {
  const { recentSessions, allExerciseLogs } = useSessionStore();
  const { settings } = useSettingsStore();
  const { profile } = useUserStore();

  const unit = (settings.weightUnit ?? profile?.units ?? "kg") as "kg" | "lb";
  const userWeightKg = profile?.weightKg ?? 70;

  const stats = useMemo(() => {
    const totalSessions = recentSessions.length;
    if (totalSessions === 0) return null;

    const totalVolumeKg = recentSessions.reduce((s, se) => s + se.totalVolumeKg, 0);
    const totalMinutes  = recentSessions.reduce((s, se) => s + se.durationMinutes, 0);

    // Estimated calories (sum per session)
    const totalCalories = recentSessions.reduce((sum, se) => {
      const ids = se.exercisesCompleted.map((e) => e.exerciseId);
      return sum + estimateCalories(userWeightKg, se.durationMinutes, ids);
    }, 0);

    // Total PRs set (unique exercise best e1RM records)
    const prMap = new Map<string, number>();
    for (const log of allExerciseLogs) {
      for (const s of log.sets) {
        const e = estimateOneRepMax(s.weightUsed, s.repsCompleted);
        const prev = prMap.get(log.exerciseId) ?? 0;
        if (e > prev) prMap.set(log.exerciseId, e);
      }
    }
    const totalPRs = prMap.size;

    // Longest streak
    const uniqueDays = Array.from(
      new Set(recentSessions.map((s) => s.date))
    ).sort();
    let longestStreak = 0, currentStreak = 0;
    for (let i = 0; i < uniqueDays.length; i++) {
      if (i === 0) {
        currentStreak = 1;
      } else {
        const prev = new Date(uniqueDays[i - 1]);
        const curr = new Date(uniqueDays[i]);
        const diff = (curr.getTime() - prev.getTime()) / 86_400_000;
        if (diff === 1) {
          currentStreak++;
        } else {
          longestStreak = Math.max(longestStreak, currentStreak);
          currentStreak = 1;
        }
      }
    }
    longestStreak = Math.max(longestStreak, currentStreak);

    const firstDate = recentSessions.reduce((min, s) => (s.date < min ? s.date : min), recentSessions[0]!.date);
    const weeksSince = Math.max(1, (Date.now() - new Date(firstDate).getTime()) / (7 * 86400000));
    const avgPerWeek = Math.round((totalSessions / weeksSince) * 10) / 10;
    const avgSessionMin = Math.round(totalMinutes / totalSessions);
    const firstDateLabel = new Date(firstDate).toLocaleDateString("en-US", { month: "short", year: "numeric" });
    const totalSets = allExerciseLogs.reduce((s, l) => s + l.sets.length, 0);

    return { totalSessions, totalVolumeKg, totalMinutes, totalCalories, totalPRs, longestStreak, avgPerWeek, avgSessionMin, firstDateLabel, totalSets };
  }, [recentSessions, allExerciseLogs, userWeightKg]);

  if (!stats) return null;

  const displayVolume = formatVolume(stats.totalVolumeKg, unit);
  const hours = Math.floor(stats.totalMinutes / 60);
  const minutes = stats.totalMinutes % 60;
  const timeStr = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;

  const tiles = [
    {
      icon: Dumbbell,
      label: "Workouts",
      value: formatBigNumber(stats.totalSessions),
      sub: `${stats.avgPerWeek}/wk avg`,
      color: "text-trainer-indigo",
      bg: "bg-trainer-indigo/15",
    },
    {
      icon: TrendingUp,
      label: "Volume",
      value: displayVolume,
      sub: `${formatBigNumber(stats.totalSets)} sets`,
      color: "text-trainer-success",
      bg: "bg-trainer-success/15",
    },
    {
      icon: Clock,
      label: "Hours Trained",
      value: timeStr,
      sub: `~${stats.avgSessionMin}min/session`,
      color: "text-trainer-warning",
      bg: "bg-trainer-warning/15",
    },
    {
      icon: Flame,
      label: "Cal Burned",
      value: formatBigNumber(stats.totalCalories),
      sub: "est.",
      color: "text-orange-400",
      bg: "bg-orange-400/12",
    },
    {
      icon: Trophy,
      label: "PRs Set",
      value: stats.totalPRs.toString(),
      color: "text-trainer-gold",
      bg: "bg-trainer-gold/12",
    },
    {
      icon: Zap,
      label: "Best Streak",
      value: `${stats.longestStreak}d`,
      color: "text-sky-400",
      bg: "bg-sky-400/12",
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.07 }}
      className="bg-trainer-surface border border-white/8 rounded-[16px] p-4"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-[8px] bg-trainer-gold/12 flex items-center justify-center">
            <Trophy size={13} className="text-trainer-gold" />
          </div>
          <p className="text-sm font-bold text-white">Lifetime Stats</p>
        </div>
        <span className="text-[10px] text-white/25">since {stats.firstDateLabel}</span>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {tiles.map((t, i) => (
          <StatTile key={t.label} {...t} delay={i * 0.05} />
        ))}
      </div>
    </motion.div>
  );
}
