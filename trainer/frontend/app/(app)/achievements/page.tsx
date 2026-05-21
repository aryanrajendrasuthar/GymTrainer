"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { Trophy, Lock, ChevronRight } from "lucide-react";
import {
  useAchievementStore,
  ACHIEVEMENT_DEFS,
  type AchievementId,
} from "@/app/store/achievementStore";
import { useSessionStore } from "@/app/store/sessionStore";
import { estimateOneRepMax } from "@/app/lib/progression-engine";
import { cn } from "@/app/lib/utils";

// ─── Tier config ────────────────────────────────────────────────────────────

const TIER_ORDER = ["platinum", "gold", "silver", "bronze"] as const;
type Tier = (typeof TIER_ORDER)[number];

const TIER_STYLE: Record<Tier, { label: string; ring: string; bg: string; badge: string; glow: string }> = {
  platinum: {
    label: "Platinum",
    ring: "ring-cyan-300/70",
    bg: "bg-cyan-900/20",
    badge: "bg-cyan-500/15 text-cyan-300 border-cyan-500/25",
    glow: "shadow-[0_0_18px_rgba(103,232,249,0.35)]",
  },
  gold: {
    label: "Gold",
    ring: "ring-yellow-400/80",
    bg: "bg-yellow-900/20",
    badge: "bg-yellow-500/15 text-yellow-300 border-yellow-500/25",
    glow: "shadow-[0_0_18px_rgba(234,179,8,0.35)]",
  },
  silver: {
    label: "Silver",
    ring: "ring-slate-300/60",
    bg: "bg-slate-700/20",
    badge: "bg-slate-500/15 text-slate-300 border-slate-500/25",
    glow: "shadow-[0_0_18px_rgba(203,213,225,0.25)]",
  },
  bronze: {
    label: "Bronze",
    ring: "ring-amber-600/60",
    bg: "bg-amber-900/20",
    badge: "bg-amber-800/15 text-amber-500 border-amber-600/25",
    glow: "shadow-[0_0_14px_rgba(180,83,9,0.30)]",
  },
};

// ─── Grouped achievement list ────────────────────────────────────────────────

function buildTierGroups(): Record<Tier, AchievementId[]> {
  const groups: Record<Tier, AchievementId[]> = {
    platinum: [], gold: [], silver: [], bronze: [],
  };
  for (const [id, def] of Object.entries(ACHIEVEMENT_DEFS) as [AchievementId, typeof ACHIEVEMENT_DEFS[AchievementId]][]) {
    groups[def.tier as Tier].push(id);
  }
  return groups;
}

const TIER_GROUPS = buildTierGroups();

// ─── Progress helpers ─────────────────────────────────────────────────────────

function computeCurrentStreak(sessions: { date: string }[]): number {
  if (!sessions.length) return 0;
  const uniqueDays = Array.from(new Set(sessions.map((s) => s.date))).sort().reverse();
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  if (uniqueDays[0] !== today && uniqueDays[0] !== yesterday) return 0;
  let streak = 1;
  for (let i = 1; i < uniqueDays.length; i++) {
    const prev = new Date(uniqueDays[i - 1]!).getTime();
    const curr = new Date(uniqueDays[i]!).getTime();
    if (prev - curr === 86400000) streak++;
    else break;
  }
  return streak;
}

function getAchievementProgress(
  id: AchievementId,
  stats: { sessionCount: number; streak: number; prCount: number; totalVolumeKg: number; physioCount: number; uniqueExercises: number }
): number {
  const { sessionCount, streak, prCount, totalVolumeKg, physioCount, uniqueExercises } = stats;
  switch (id) {
    case "first_workout": return Math.min(1, sessionCount);
    case "sessions_5":    return Math.min(1, sessionCount / 5);
    case "sessions_10":   return Math.min(1, sessionCount / 10);
    case "sessions_25":   return Math.min(1, sessionCount / 25);
    case "sessions_50":   return Math.min(1, sessionCount / 50);
    case "sessions_100":  return Math.min(1, sessionCount / 100);
    case "streak_3":      return Math.min(1, streak / 3);
    case "streak_7":      return Math.min(1, streak / 7);
    case "streak_14":     return Math.min(1, streak / 14);
    case "streak_30":     return Math.min(1, streak / 30);
    case "first_pr":      return Math.min(1, prCount);
    case "pr_5":          return Math.min(1, prCount / 5);
    case "pr_10":         return Math.min(1, prCount / 10);
    case "volume_50000":  return Math.min(1, totalVolumeKg / 50000);
    case "first_physio":  return Math.min(1, physioCount);
    case "physio_7":      return Math.min(1, physioCount / 7);
    case "exercises_10":  return Math.min(1, uniqueExercises / 10);
    case "exercises_25":  return Math.min(1, uniqueExercises / 25);
    default: return 0;
  }
}

// ─── Coming Up Next card ──────────────────────────────────────────────────────

function ComingUpNext({
  items,
}: {
  items: { id: AchievementId; pct: number }[];
}) {
  if (!items.length) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05 }}
      className="bg-trainer-surface border border-white/8 rounded-[16px] p-4 flex flex-col gap-3"
    >
      <p className="text-[10px] text-white/35 uppercase tracking-widest font-semibold">Coming Up Next</p>
      {items.map(({ id, pct }, i) => {
        const def = ACHIEVEMENT_DEFS[id];
        const tier = def.tier as Tier;
        const style = TIER_STYLE[tier];
        const barColor =
          tier === "platinum" ? "bg-cyan-300" :
          tier === "gold" ? "bg-yellow-400" :
          tier === "silver" ? "bg-slate-300" : "bg-amber-500";
        return (
          <motion.div
            key={id}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.08 + i * 0.04 }}
            className="flex items-center gap-3"
          >
            <div className="w-8 h-8 rounded-full bg-white/6 ring-1 ring-white/10 flex items-center justify-center text-base shrink-0">
              <Lock size={12} className="text-white/20" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs font-semibold text-white/70 truncate">{def.title}</p>
                <span className={cn("text-[9px] font-bold px-1.5 py-0.5 rounded-full border ml-2 shrink-0", style.badge)}>
                  {Math.round(pct * 100)}%
                </span>
              </div>
              <div className="h-1 bg-white/8 rounded-full overflow-hidden">
                <motion.div
                  className={cn("h-full rounded-full", barColor)}
                  initial={{ width: 0 }}
                  animate={{ width: `${pct * 100}%` }}
                  transition={{ duration: 0.55, ease: "easeOut", delay: 0.15 + i * 0.05 }}
                />
              </div>
            </div>
          </motion.div>
        );
      })}
    </motion.div>
  );
}

// ─── Achievement card ─────────────────────────────────────────────────────────

function AchievementCard({
  id,
  unlockedAt,
  index,
}: {
  id: AchievementId;
  unlockedAt?: string;
  index: number;
}) {
  const def = ACHIEVEMENT_DEFS[id];
  const isUnlocked = !!unlockedAt;
  const tier = def.tier as Tier;
  const style = TIER_STYLE[tier];

  const isRecent = unlockedAt
    ? Date.now() - new Date(unlockedAt).getTime() < 7 * 86400000
    : false;

  const unlockDate = unlockedAt
    ? new Date(unlockedAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.25 }}
      className={cn(
        "flex items-center gap-4 p-4 rounded-[14px] border transition-all",
        isUnlocked
          ? "bg-trainer-surface border-white/8"
          : "bg-trainer-elevated/50 border-white/5 opacity-55"
      )}
    >
      {/* Icon badge */}
      <div className={cn(
        "w-14 h-14 rounded-full ring-2 flex items-center justify-center text-2xl shrink-0 transition-all",
        isUnlocked
          ? cn(style.ring, style.bg, isRecent && style.glow)
          : "ring-white/8 bg-white/4 grayscale"
      )}>
        {isUnlocked ? (
          <span role="img">{def.icon}</span>
        ) : (
          <Lock size={18} className="text-white/20" />
        )}
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className={cn("text-sm font-bold", isUnlocked ? "text-white" : "text-white/30")}>
            {def.title}
          </p>
          <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border capitalize", style.badge)}>
            {style.label}
          </span>
          {isRecent && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-trainer-indigo/15 text-trainer-indigo border border-trainer-indigo/25">
              New!
            </span>
          )}
        </div>
        <p className={cn("text-xs mt-0.5 leading-relaxed", isUnlocked ? "text-white/50" : "text-white/25")}>
          {def.description}
        </p>
        {unlockDate && (
          <p className="text-[10px] text-white/25 mt-1">Unlocked {unlockDate}</p>
        )}
      </div>
    </motion.div>
  );
}

// ─── Tier section ─────────────────────────────────────────────────────────────

function TierSection({
  tier,
  ids,
  unlockedMap,
  globalIndex,
}: {
  tier: Tier;
  ids: AchievementId[];
  unlockedMap: Partial<Record<AchievementId, string>>;
  globalIndex: number;
}) {
  const style = TIER_STYLE[tier];
  const unlockedCount = ids.filter((id) => !!unlockedMap[id]).length;

  return (
    <div className="flex flex-col gap-3">
      {/* Tier header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={cn("text-xs font-bold px-2.5 py-1 rounded-full border", style.badge)}>
            {style.label}
          </span>
        </div>
        <span className="text-xs text-white/30 tabular-nums">
          {unlockedCount}/{ids.length}
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-0.5 bg-white/6 rounded-full overflow-hidden">
        <motion.div
          className={cn("h-full rounded-full", tier === "platinum" ? "bg-cyan-300" : tier === "gold" ? "bg-yellow-400" : tier === "silver" ? "bg-slate-300" : "bg-amber-600")}
          initial={{ width: 0 }}
          animate={{ width: ids.length > 0 ? `${(unlockedCount / ids.length) * 100}%` : "0%" }}
          transition={{ duration: 0.6, ease: "easeOut", delay: 0.2 }}
        />
      </div>

      {/* Achievement cards */}
      <div className="flex flex-col gap-2.5">
        {ids.map((id, i) => (
          <AchievementCard
            key={id}
            id={id}
            unlockedAt={unlockedMap[id]}
            index={globalIndex + i}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AchievementsPage() {
  const { unlocked, prCount, totalVolumeKg, physioSessionCount } = useAchievementStore();
  const { recentSessions, allExerciseLogs } = useSessionStore();

  const totalCount = Object.keys(ACHIEVEMENT_DEFS).length;
  const unlockedCount = Object.keys(unlocked).length;

  const tierProgress = useMemo(() =>
    TIER_ORDER.map((tier) => {
      const ids = TIER_GROUPS[tier];
      return { tier, count: ids.filter((id) => !!unlocked[id]).length, total: ids.length };
    }),
    [unlocked]
  );

  const comingUpNext = useMemo(() => {
    const sessionCount = recentSessions.length;
    const streak = computeCurrentStreak(recentSessions);
    const uniqueExercises = new Set(allExerciseLogs.map((l) => l.exerciseId)).size;
    const stats = { sessionCount, streak, prCount, totalVolumeKg, physioCount: physioSessionCount, uniqueExercises };

    return (Object.keys(ACHIEVEMENT_DEFS) as AchievementId[])
      .filter((id) => !unlocked[id])
      .map((id) => ({ id, pct: getAchievementProgress(id, stats) }))
      .filter(({ pct }) => pct > 0 && pct < 1)
      .sort((a, b) => b.pct - a.pct)
      .slice(0, 3);
  }, [unlocked, recentSessions, allExerciseLogs, prCount, totalVolumeKg, physioSessionCount]);

  let globalIdx = 0;

  return (
    <div className="flex flex-col min-h-full pb-24 page-enter">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="px-5 pt-14 pb-6"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-[12px] bg-yellow-500/15 flex items-center justify-center">
            <Trophy size={20} className="text-yellow-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Achievements</h1>
            <p className="text-sm text-white/40">{unlockedCount} of {totalCount} unlocked</p>
          </div>
        </div>

        {/* Overall progress bar */}
        <div className="h-1.5 bg-white/6 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-yellow-400 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: totalCount > 0 ? `${(unlockedCount / totalCount) * 100}%` : "0%" }}
            transition={{ duration: 0.7, ease: "easeOut", delay: 0.15 }}
          />
        </div>

        {/* Tier summary chips */}
        <div className="flex gap-2 mt-3 flex-wrap">
          {tierProgress.map(({ tier, count, total }) => {
            const style = TIER_STYLE[tier];
            return (
              <span
                key={tier}
                className={cn("text-[11px] font-semibold px-2.5 py-1 rounded-full border", style.badge)}
              >
                {style.label} {count}/{total}
              </span>
            );
          })}
        </div>
      </motion.div>

      {/* Coming up next */}
      {comingUpNext.length > 0 && (
        <div className="px-5 pb-2">
          <ComingUpNext items={comingUpNext} />
        </div>
      )}

      {/* Tier sections */}
      <div className="flex flex-col gap-8 px-5">
        {TIER_ORDER.map((tier) => {
          const ids = TIER_GROUPS[tier];
          const startIdx = globalIdx;
          globalIdx += ids.length;
          return (
            <TierSection
              key={tier}
              tier={tier}
              ids={ids}
              unlockedMap={unlocked}
              globalIndex={startIdx}
            />
          );
        })}
      </div>
    </div>
  );
}
