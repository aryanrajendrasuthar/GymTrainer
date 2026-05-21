"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { Activity, Moon, Flame, Sparkles, type LucideIcon } from "lucide-react";
import { useSessionStore } from "@/app/store/sessionStore";
import { useSleepStore } from "@/app/store/sleepStore";
import { exerciseMap } from "@/app/data/exercises";
import { cn } from "@/app/lib/utils";
import type { WorkoutSession } from "@/app/types";

const MUSCLE_GROUPS: { key: string; aliases: string[] }[] = [
  { key: "chest",      aliases: ["chest", "pectoralis-major-upper", "pectoralis-major-lower", "pectoralis-minor"] },
  { key: "back",       aliases: ["back", "lats", "latissimus-dorsi", "rhomboids", "teres-major"] },
  { key: "shoulders",  aliases: ["shoulders", "anterior-deltoid", "lateral-deltoid", "posterior-deltoid"] },
  { key: "biceps",     aliases: ["biceps", "biceps-brachii-long", "biceps-brachii-short", "brachialis"] },
  { key: "triceps",    aliases: ["triceps", "triceps-long", "triceps-lateral", "triceps-medial"] },
  { key: "quads",      aliases: ["quads", "quadriceps-rectus-femoris", "quadriceps-vastus-lateralis"] },
  { key: "hamstrings", aliases: ["hamstrings", "hamstrings-biceps-femoris", "hamstrings-semimembranosus"] },
  { key: "glutes",     aliases: ["glutes", "gluteus-maximus", "gluteus-medius"] },
  { key: "core",       aliases: ["core", "abs", "rectus-abdominis-upper", "rectus-abdominis-lower"] },
  { key: "calves",     aliases: ["calves", "gastrocnemius", "soleus"] },
];

function weekStart(d: Date): string {
  const day = new Date(d);
  day.setHours(0, 0, 0, 0);
  const dow = (day.getDay() + 6) % 7;
  day.setDate(day.getDate() - dow);
  return day.toISOString().slice(0, 10);
}

function computeACWR(sessions: WorkoutSession[]): number {
  const byWeek: Record<string, number> = {};
  for (const s of sessions) {
    const ws = weekStart(new Date(s.date));
    byWeek[ws] = (byWeek[ws] ?? 0) + s.totalVolumeKg;
  }
  const sorted = Object.entries(byWeek).sort(([a], [b]) => a.localeCompare(b)).slice(-4);
  if (!sorted.length) return 0;
  const values = sorted.map(([, v]) => v);
  const acute = values[values.length - 1] ?? 0;
  const chronic = values.reduce((a, b) => a + b, 0) / values.length;
  return chronic > 0 ? acute / chronic : 0;
}

function SubIndicator({
  icon: Icon,
  label,
  value,
  score,
  maxScore,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  score: number;
  maxScore: number;
}) {
  const pct = score / maxScore;
  const barColor = pct >= 0.7 ? "bg-trainer-success" : pct >= 0.45 ? "bg-amber-400" : "bg-red-400";
  const textColor = pct >= 0.7 ? "text-trainer-success" : pct >= 0.45 ? "text-amber-400" : "text-red-400";
  return (
    <div className="flex flex-col gap-1.5 p-2.5 rounded-[10px] bg-trainer-elevated">
      <div className="flex items-center gap-1">
        <Icon size={10} className={textColor} />
        <span className="text-[9px] text-white/30 font-medium uppercase tracking-wide">{label}</span>
      </div>
      <p className={cn("text-sm font-black tabular-nums leading-none", textColor)}>{value}</p>
      <div className="h-1 bg-white/8 rounded-full overflow-hidden">
        <motion.div
          className={cn("h-full rounded-full", barColor)}
          initial={{ width: 0 }}
          animate={{ width: `${pct * 100}%` }}
          transition={{ duration: 0.6, ease: "easeOut", delay: 0.35 }}
        />
      </div>
    </div>
  );
}

export function RecoveryScoreCard() {
  const { allExerciseLogs, recentSessions } = useSessionStore();
  const { getToday: getSleepToday, getLast: getSleepLast } = useSleepStore();

  const sleepEntry = getSleepToday() ?? getSleepLast(2)[0] ?? null;

  const { score, sleepScore, muscleScore, loadScore, acwr, recoveredCount, muscleStatus } = useMemo(() => {
    // Sleep subscore (0–35)
    let sleepScore = 0;
    if (sleepEntry) {
      const hoursScore =
        sleepEntry.hoursSlept >= 7.5 && sleepEntry.hoursSlept <= 9 ? 20
        : sleepEntry.hoursSlept >= 6.5 ? 13
        : sleepEntry.hoursSlept >= 5.5 ? 7
        : 3;
      const qualityScore = (sleepEntry.quality - 1) * 3.75; // 0–15
      sleepScore = Math.round(hoursScore + qualityScore);
    }

    // Muscle recovery subscore (0–35)
    const now = Date.now();
    const cutoff72h = now - 72 * 3600000;
    const recentLogs = allExerciseLogs.filter((l) => new Date(l.loggedAt).getTime() >= cutoff72h);
    const muscleLastTrained = new Map<string, number>();
    for (const log of recentLogs) {
      const ex = exerciseMap[log.exerciseId];
      if (!ex) continue;
      const hoursAgo = (now - new Date(log.loggedAt).getTime()) / 3600000;
      for (const m of [...ex.primaryMuscles, ...ex.secondaryMuscles]) {
        const existing = muscleLastTrained.get(m);
        if (existing === undefined || hoursAgo < existing) muscleLastTrained.set(m, hoursAgo);
      }
    }
    let recoveredCount = 0;
    for (const g of MUSCLE_GROUPS) {
      const hoursAgo = g.aliases.reduce<number | null>((min, alias) => {
        const h = muscleLastTrained.get(alias);
        if (h === undefined) return min;
        return min === null || h < min ? h : min;
      }, null);
      if (hoursAgo === null || hoursAgo >= 48) recoveredCount++;
    }
    const muscleScore = Math.round((recoveredCount / MUSCLE_GROUPS.length) * 35);

    // Per-muscle fatigue for breakdown display
    const muscleStatus = MUSCLE_GROUPS.map((g) => {
      const hoursAgo = g.aliases.reduce<number | null>((min, alias) => {
        const h = muscleLastTrained.get(alias);
        if (h === undefined) return min;
        return min === null || h < min ? h : min;
      }, null);
      return { key: g.key, hoursAgo };
    }).filter((m) => m.hoursAgo !== null && m.hoursAgo < 48);

    // Training load subscore (0–30)
    const acwr = computeACWR(recentSessions);
    let loadScore: number;
    if (acwr === 0) loadScore = 25;
    else if (acwr >= 0.8 && acwr <= 1.3) loadScore = 30;
    else if (acwr > 1.3 && acwr <= 1.5) loadScore = 20;
    else if (acwr > 1.5) loadScore = 10;
    else loadScore = 20; // acwr < 0.8

    const score = sleepScore + muscleScore + loadScore;
    return { score, sleepScore, muscleScore, loadScore, acwr, recoveredCount, muscleStatus };
  }, [allExerciseLogs, recentSessions, sleepEntry]);

  if (recentSessions.length === 0 && !sleepEntry) return null;

  const { label, color, ringColor, advice } =
    score >= 85 ? { label: "Peak",     color: "text-trainer-success", ringColor: "#22c55e", advice: "Ready for max effort" }
    : score >= 70 ? { label: "Good",   color: "text-trainer-success", ringColor: "#4ade80", advice: "Train at full intensity" }
    : score >= 55 ? { label: "Moderate", color: "text-amber-400",     ringColor: "#f59e0b", advice: "Moderate session OK" }
    : score >= 40 ? { label: "Low",    color: "text-orange-400",       ringColor: "#fb923c", advice: "Keep it light today" }
    :               { label: "Poor",   color: "text-red-400",          ringColor: "#f87171", advice: "Rest day recommended" };

  const R = 28;
  const circumference = 2 * Math.PI * R;
  const dashOffset = circumference * (1 - score / 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.08 }}
      className="rounded-[20px] bg-trainer-surface border border-white/8 p-4"
    >
      <div className="flex items-center gap-4">
        {/* Animated ring gauge */}
        <div className="relative shrink-0">
          <svg width="72" height="72" className="-rotate-90">
            <circle cx="36" cy="36" r={R} strokeWidth="5" stroke="rgba(255,255,255,0.06)" fill="none" />
            <motion.circle
              cx="36" cy="36" r={R}
              strokeWidth="5"
              stroke={ringColor}
              fill="none"
              strokeLinecap="round"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset: dashOffset }}
              transition={{ duration: 1, ease: "easeOut", delay: 0.1 }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-[17px] font-black text-white tabular-nums leading-none">{score}</span>
            <span className="text-[7px] text-white/30 uppercase tracking-wide mt-0.5">/ 100</span>
          </div>
        </div>

        {/* Label + advice */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1">
            <Sparkles size={11} className="text-white/30" />
            <p className="text-[10px] text-white/35 uppercase tracking-widest font-semibold">Recovery Score</p>
          </div>
          <p className={cn("text-xl font-black leading-tight", color)}>{label}</p>
          <p className="text-[11px] text-white/35 mt-0.5">{advice}</p>
          <span className={cn(
            "inline-flex mt-1.5 text-[9px] font-bold px-2 py-0.5 rounded-full border",
            score >= 70
              ? "text-trainer-success bg-trainer-success/8 border-trainer-success/20"
              : score >= 55
              ? "text-amber-400 bg-amber-400/8 border-amber-400/20"
              : "text-red-400 bg-red-400/8 border-red-400/20"
          )}>
            {score >= 85 ? "Max intensity" : score >= 70 ? "Full intensity" : score >= 55 ? "~80% intensity" : score >= 40 ? "Light session only" : "Rest day"}
          </span>
        </div>
      </div>

      {/* Sub-indicators */}
      <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-white/6">
        <SubIndicator
          icon={Moon}
          label="Sleep"
          value={sleepEntry ? `${sleepEntry.hoursSlept}h` : "—"}
          score={sleepScore}
          maxScore={35}
        />
        <SubIndicator
          icon={Flame}
          label="Muscles"
          value={`${recoveredCount}/10`}
          score={muscleScore}
          maxScore={35}
        />
        <SubIndicator
          icon={Activity}
          label="Load"
          value={acwr > 0 ? acwr.toFixed(2) : "—"}
          score={loadScore}
          maxScore={30}
        />
      </div>

      {/* Muscle fatigue breakdown */}
      {muscleStatus.length > 0 && (
        <div className="mt-2.5 pt-2.5 border-t border-white/5">
          <p className="text-[9px] text-white/20 uppercase tracking-widest font-semibold mb-1.5">
            Still recovering
          </p>
          <div className="flex flex-wrap gap-1.5">
            {muscleStatus.map(({ key, hoursAgo }) => {
              const h = hoursAgo!;
              const isHeavy = h < 24;
              return (
                <span
                  key={key}
                  className={cn(
                    "flex items-center gap-1 text-[9px] font-semibold px-1.5 py-0.5 rounded-full capitalize",
                    isHeavy
                      ? "bg-red-500/10 text-red-400/80"
                      : "bg-amber-400/10 text-amber-400/70"
                  )}
                >
                  {key}
                  <span className="opacity-70">{Math.round(h)}h</span>
                </span>
              );
            })}
          </div>
        </div>
      )}
    </motion.div>
  );
}
