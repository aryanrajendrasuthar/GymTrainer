"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Trophy, Lock, ChevronRight } from "lucide-react";
import { useAchievementStore, ACHIEVEMENT_DEFS, type AchievementId } from "@/app/store/achievementStore";
import { cn } from "@/app/lib/utils";

const TIER_RING: Record<string, string> = {
  bronze:   "ring-amber-600/60",
  silver:   "ring-slate-300/60",
  gold:     "ring-yellow-400/80",
  platinum: "ring-cyan-300/80",
};

const TIER_BG: Record<string, string> = {
  bronze:   "bg-amber-900/20",
  silver:   "bg-slate-700/20",
  gold:     "bg-yellow-900/20",
  platinum: "bg-cyan-900/20",
};

const ORDERED: AchievementId[] = [
  "first_workout","sessions_5","sessions_10","sessions_25","sessions_50","sessions_100",
  "streak_3","streak_7","streak_14","streak_30",
  "first_pr","pr_5","pr_10",
  "volume_1000","volume_50000",
  "exercises_10","exercises_25",
  "first_physio","physio_7",
  "early_bird","night_owl","marathon_session","no_rest_week","split_change",
];

export function AchievementsCard() {
  const { unlocked } = useAchievementStore();
  const unlockedCount = Object.keys(unlocked).length;

  const tierCounts = { bronze: 0, silver: 0, gold: 0, platinum: 0 };
  for (const id of Object.keys(unlocked)) {
    const def = ACHIEVEMENT_DEFS[id as AchievementId];
    if (def) tierCounts[def.tier as keyof typeof tierCounts]++;
  }
  const tierPills = [
    { tier: "bronze",   color: "text-amber-600 bg-amber-900/20 border-amber-600/25"   },
    { tier: "silver",   color: "text-slate-300 bg-slate-700/20 border-slate-300/25"   },
    { tier: "gold",     color: "text-yellow-400 bg-yellow-900/20 border-yellow-400/25" },
    { tier: "platinum", color: "text-cyan-300 bg-cyan-900/20 border-cyan-300/25"       },
  ].filter((t) => tierCounts[t.tier as keyof typeof tierCounts] > 0);

  const nextLockedId = ORDERED.find((id) => !unlocked[id]);
  const nextDef = nextLockedId ? ACHIEVEMENT_DEFS[nextLockedId] : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.1 }}
      className="rounded-[20px] bg-trainer-surface border border-white/8 p-4 overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-[8px] bg-yellow-500/15 flex items-center justify-center">
            <Trophy size={14} className="text-yellow-400" />
          </div>
          <p className="text-sm font-bold text-white">Achievements</p>
        </div>
        <Link
          href="/achievements"
          className="flex items-center gap-0.5 text-xs text-trainer-indigo/70 hover:text-trainer-indigo transition-colors"
        >
          {unlockedCount}/{ORDERED.length}
          <ChevronRight size={12} />
        </Link>
      </div>

      {/* Progress bar */}
      <div className="flex items-center gap-2 mb-3">
        <div className="flex-1 h-1 bg-white/6 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-yellow-400/60 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${(unlockedCount / ORDERED.length) * 100}%` }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          />
        </div>
        <span className="text-[9px] font-bold text-white/25 tabular-nums shrink-0">
          {Math.round((unlockedCount / ORDERED.length) * 100)}%
        </span>
      </div>

      {/* Tier pills */}
      {tierPills.length > 0 && (
        <div className="flex gap-1.5 mb-3">
          {tierPills.map((t) => (
            <span key={t.tier} className={cn("text-[9px] font-bold px-2 py-0.5 rounded-full border capitalize", t.color)}>
              {tierCounts[t.tier as keyof typeof tierCounts]} {t.tier}
            </span>
          ))}
        </div>
      )}

      {/* Horizontal badge scroll */}
      <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1 -mx-1 px-1">
        {ORDERED.map((id, i) => {
          const def = ACHIEVEMENT_DEFS[id];
          const isUnlocked = !!unlocked[id];

          return (
            <motion.div
              key={id}
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.025, duration: 0.25 }}
              className="flex flex-col items-center gap-1.5 shrink-0 w-[60px]"
            >
              <div className={cn(
                "w-12 h-12 rounded-full ring-2 flex items-center justify-center text-xl transition-all",
                isUnlocked
                  ? cn(TIER_RING[def.tier], TIER_BG[def.tier])
                  : "ring-white/8 bg-white/4 grayscale opacity-35"
              )}>
                <span>{def.icon}</span>
              </div>
              <p className={cn(
                "text-[9px] font-semibold text-center leading-tight line-clamp-2",
                isUnlocked ? "text-white/70" : "text-white/25"
              )}>
                {isUnlocked ? def.title : <Lock size={9} className="text-white/20 mx-auto" />}
              </p>
            </motion.div>
          );
        })}
      </div>

      {nextDef && (
        <div className="mt-3 pt-3 border-t border-white/5 flex items-center gap-2">
          <span className="text-[10px] text-white/25">Next:</span>
          <span className="text-base leading-none">{nextDef.icon}</span>
          <span className="text-[10px] text-white/45 font-medium">{nextDef.title}</span>
        </div>
      )}
    </motion.div>
  );
}
