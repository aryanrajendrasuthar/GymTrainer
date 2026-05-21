"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Zap, TrendingUp, Star, X, ChevronRight, Flame } from "lucide-react";
import Link from "next/link";
import { type WorkoutSession, type ExerciseLog } from "@/app/types";

interface Milestone {
  id: string;
  icon: React.ElementType;
  iconColor: string;
  bgColor: string;
  borderColor: string;
  title: string;
  body: string;
  cta?: { label: string; href: string };
}

function detectMilestones(
  sessions: WorkoutSession[],
  allLogs: ExerciseLog[],
  streak: number
): Milestone[] {
  const milestones: Milestone[] = [];
  const total = sessions.length;
  const lifetimeVolumeKg = sessions.reduce((s, se) => s + se.totalVolumeKg, 0);

  if (total === 1) {
    milestones.push({
      id: "first-session",
      icon: Star,
      iconColor: "text-trainer-gold",
      bgColor: "bg-trainer-gold/8",
      borderColor: "border-trainer-gold/25",
      title: "First session logged!",
      body: "You've taken the first step. The hardest one is always the first.",
    });
  }

  if (total === 5) {
    milestones.push({
      id: "sessions-5",
      icon: Flame,
      iconColor: "text-orange-400",
      bgColor: "bg-orange-400/8",
      borderColor: "border-orange-400/25",
      title: "5 sessions done!",
      body: "You've built a habit. Keep the momentum going.",
    });
  }

  if (total === 10) {
    milestones.push({
      id: "sessions-10",
      icon: TrendingUp,
      iconColor: "text-trainer-indigo",
      bgColor: "bg-trainer-indigo/8",
      borderColor: "border-trainer-indigo/25",
      title: "10 sessions complete",
      body: "You're past the hardest phase — the body is adapting. Push harder now.",
      cta: { label: "View progress", href: "/progress" },
    });
  }

  if (total === 25) {
    milestones.push({
      id: "sessions-25",
      icon: Trophy,
      iconColor: "text-trainer-gold",
      bgColor: "bg-trainer-gold/8",
      borderColor: "border-trainer-gold/25",
      title: "25 sessions — serious athlete",
      body: "Most people quit before this point. You didn't. Check your progress stats.",
      cta: { label: "View progress", href: "/progress" },
    });
  }

  if (total === 50) {
    milestones.push({
      id: "sessions-50",
      icon: Trophy,
      iconColor: "text-trainer-gold",
      bgColor: "bg-trainer-gold/8",
      borderColor: "border-trainer-gold/25",
      title: "50 sessions logged!",
      body: "You're in the top 5% of people who stick with training. Incredible.",
      cta: { label: "View records", href: "/progress" },
    });
  }

  if (streak === 7) {
    milestones.push({
      id: "streak-7",
      icon: Zap,
      iconColor: "text-amber-400",
      bgColor: "bg-amber-400/8",
      borderColor: "border-amber-400/25",
      title: "7-day streak!",
      body: "A full week of training. Your body is thanking you.",
    });
  }

  if (streak === 14) {
    milestones.push({
      id: "streak-14",
      icon: Zap,
      iconColor: "text-amber-400",
      bgColor: "bg-amber-400/8",
      borderColor: "border-amber-400/25",
      title: "2-week streak!",
      body: "Two consecutive weeks. Your routine is locked in.",
    });
  }

  if (streak === 30) {
    milestones.push({
      id: "streak-30",
      icon: Trophy,
      iconColor: "text-trainer-gold",
      bgColor: "bg-trainer-gold/8",
      borderColor: "border-trainer-gold/25",
      title: "30-day streak — elite!",
      body: "A full month without missing a day. You're operating at a different level.",
    });
  }

  if (lifetimeVolumeKg >= 10000 && total >= 5) {
    milestones.push({
      id: "volume-10k",
      icon: TrendingUp,
      iconColor: "text-trainer-success",
      bgColor: "bg-trainer-success/8",
      borderColor: "border-trainer-success/25",
      title: "10,000 kg lifted!",
      body: "You've moved 10 tonnes of iron. That's elite-level dedication.",
    });
  }

  if (lifetimeVolumeKg >= 50000 && total >= 10) {
    milestones.push({
      id: "volume-50k",
      icon: Trophy,
      iconColor: "text-trainer-gold",
      bgColor: "bg-trainer-gold/8",
      borderColor: "border-trainer-gold/25",
      title: "50,000 kg lifetime volume",
      body: "50 tonnes. You are in rare company.",
    });
  }

  // Progressive overload suggestion: > 8 sessions, volume flat last 2 weeks
  if (total >= 8) {
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
    const fourWeeksAgo = new Date();
    fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);

    const recentVol = sessions
      .filter((s) => new Date(s.date) >= twoWeeksAgo)
      .reduce((sum, s) => sum + s.totalVolumeKg, 0);
    const priorVol = sessions
      .filter((s) => new Date(s.date) >= fourWeeksAgo && new Date(s.date) < twoWeeksAgo)
      .reduce((sum, s) => sum + s.totalVolumeKg, 0);

    if (priorVol > 0 && recentVol > 0 && recentVol <= priorVol * 1.02) {
      milestones.push({
        id: "suggest-overload",
        icon: TrendingUp,
        iconColor: "text-trainer-indigo",
        bgColor: "bg-trainer-indigo/8",
        borderColor: "border-trainer-indigo/25",
        title: "Time to push harder",
        body: "Your volume hasn't increased in 2 weeks. Try adding 2.5 kg or 1 extra set to your main lifts.",
      });
    }
  }

  return milestones;
}

const STORAGE_KEY = "trainer-dismissed-milestones";

function getDismissed(): string[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
  } catch {
    return [];
  }
}

function saveDismissed(ids: string[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  } catch {
    // ignore
  }
}

interface MilestoneBannerProps {
  sessions: WorkoutSession[];
  allLogs: ExerciseLog[];
  streak: number;
}

export function MilestoneBanner({ sessions, allLogs, streak }: MilestoneBannerProps) {
  const [dismissed, setDismissed] = useState<string[]>([]);

  useEffect(() => {
    setDismissed(getDismissed());
  }, []);

  const milestones = useMemo(
    () => detectMilestones(sessions, allLogs, streak),
    [sessions, allLogs, streak]
  );

  const visible = milestones.filter((m) => !dismissed.includes(m.id));
  const current = visible[0] ?? null;

  function dismiss(id: string) {
    const next = [...dismissed, id];
    setDismissed(next);
    saveDismissed(next);
  }

  return (
    <AnimatePresence mode="wait">
      {current && (
        <motion.div
          key={current.id}
          initial={{ opacity: 0, y: -10, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.97 }}
          transition={{ type: "spring", stiffness: 340, damping: 28 }}
          className={`flex items-start gap-3 p-4 rounded-[16px] border ${current.bgColor} ${current.borderColor}`}
        >
          <div className={`w-9 h-9 rounded-[10px] bg-white/8 flex items-center justify-center shrink-0 mt-0.5`}>
            <current.icon size={17} className={current.iconColor} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-white">{current.title}</p>
            <p className="text-xs text-white/50 mt-0.5 leading-relaxed">{current.body}</p>
            {current.cta && (
              <Link
                href={current.cta.href}
                className="inline-flex items-center gap-1 text-xs font-semibold text-trainer-indigo mt-2 hover:text-white transition-colors"
              >
                {current.cta.label}
                <ChevronRight size={11} />
              </Link>
            )}
            {(() => {
              const milestoneSteps = [1, 5, 10, 25, 50];
              const total = sessions.length;
              const next = milestoneSteps.find((n) => n > total);
              const toGo = next ? next - total : null;
              return (
                <div className="flex items-center gap-2 mt-1.5">
                  {next && toGo !== null && (
                    <p className="text-[10px] text-white/25">
                      Next: {next} sessions · {toGo} to go
                    </p>
                  )}
                  {visible.length > 1 && (
                    <span className="text-[10px] font-bold text-white/30 bg-white/6 border border-white/10 px-1.5 py-0.5 rounded-full tabular-nums">
                      +{visible.length - 1} more
                    </span>
                  )}
                </div>
              );
            })()}
          </div>
          <button
            onClick={() => dismiss(current.id)}
            className="w-7 h-7 rounded-full bg-white/6 flex items-center justify-center text-white/30 hover:text-white/60 transition-colors shrink-0"
            aria-label="Dismiss"
          >
            <X size={12} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
