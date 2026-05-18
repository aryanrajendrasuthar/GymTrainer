"use client";

import { useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Heart, ChevronRight, PlayCircle, X } from "lucide-react";
import { useUserStore } from "@/app/store/userStore";
import { useSessionStore } from "@/app/store/sessionStore";
import { usePhysioStore } from "@/app/store/physioStore";
import { useSettingsStore } from "@/app/store/settingsStore";
import { TodayWorkoutCard } from "@/app/components/dashboard/TodayWorkoutCard";
import { StreakCard, WeekGridCard } from "@/app/components/dashboard/StreakCard";
import { RecentSessionCard } from "@/app/components/dashboard/RecentSessionCard";
import { WeeklyPlanSheet } from "@/app/components/dashboard/WeeklyPlanSheet";
import { DailyCheckinCard } from "@/app/components/dashboard/DailyCheckinCard";
import { PendingSessionCard } from "@/app/components/dashboard/PendingSessionCard";
import { AchievementsCard } from "@/app/components/dashboard/AchievementsCard";
import { MuscleHeatmapCard } from "@/app/components/dashboard/MuscleHeatmapCard";
import { RecentPRsCard } from "@/app/components/dashboard/RecentPRsCard";
import { UpcomingSessionsCard } from "@/app/components/dashboard/UpcomingSessionsCard";
import { DeloadBanner } from "@/app/components/dashboard/DeloadBanner";
import { NutritionLogCard } from "@/app/components/dashboard/NutritionLogCard";
import { getSplitById } from "@/app/data/splits";
import type { WorkoutSession } from "@/app/types";

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function getTodayDayIndex(totalDays: number): number {
  const dayOfWeek = (new Date().getDay() + 6) % 7;
  return dayOfWeek % totalDays;
}

function calculateStreak(sessions: WorkoutSession[]): number {
  if (!sessions.length) return 0;

  const MS_PER_DAY = 86400000;
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const uniqueDays = Array.from(new Set(
    sessions.map((s) => {
      const d = new Date(s.date);
      d.setHours(0, 0, 0, 0);
      return d.getTime();
    })
  )).sort((a, b) => b - a);

  const latestMs = uniqueDays[0];
  const diffFromToday = (todayStart.getTime() - latestMs) / MS_PER_DAY;
  if (diffFromToday > 1) return 0;

  let streak = 0;
  let expected = latestMs;
  for (const dayMs of uniqueDays) {
    if (dayMs === expected) {
      streak++;
      expected -= MS_PER_DAY;
    } else {
      break;
    }
  }
  return streak;
}

function getWeekSessionDates(sessions: WorkoutSession[]): string[] {
  const today = new Date();
  const dayOfWeek = (today.getDay() + 6) % 7;
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - dayOfWeek);
  startOfWeek.setHours(0, 0, 0, 0);
  return sessions
    .filter((s) => new Date(s.date) >= startOfWeek)
    .map((s) => s.date);
}

export default function DashboardPage() {
  const { profile } = useUserStore();
  const { recentSessions, draftSession, clearDraftSession } = useSessionStore();
  const { activeInjuries, todayCompletedSlots } = usePhysioStore();
  const { settings } = useSettingsStore();

  const split = useMemo(
    () => (profile?.splitId ? getSplitById(profile.splitId) : null),
    [profile?.splitId]
  );

  const todayDayIndex = useMemo(
    () => (split ? getTodayDayIndex(split.days.length) : 0),
    [split]
  );

  const todaySplitDay = split?.days[todayDayIndex] ?? null;
  const streak = useMemo(() => calculateStreak(recentSessions), [recentSessions]);
  const weekDates = useMemo(() => getWeekSessionDates(recentSessions), [recentSessions]);

  const weekSessionCount = useMemo(() => {
    const today = new Date();
    const dayOfWeek = (today.getDay() + 6) % 7;
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - dayOfWeek);
    startOfWeek.setHours(0, 0, 0, 0);
    return recentSessions.filter((s) => new Date(s.date) >= startOfWeek).length;
  }, [recentSessions]);

  const pendingPhysioCount = useMemo(() => {
    return activeInjuries.filter((inj) => {
      const completed = todayCompletedSlots[inj.condition] ?? [];
      const currentHour = new Date().getHours();
      if (currentHour >= 6  && !completed.includes("morning")) return true;
      if (currentHour >= 17 && !completed.includes("evening")) return true;
      return false;
    }).length;
  }, [activeInjuries, todayCompletedSlots]);

  const firstName = profile?.name?.split(" ")[0] ?? "Athlete";
  const weightUnit = settings.weightUnit ?? profile?.units ?? "kg";
  const todayExerciseIds = useMemo(
    () => todaySplitDay?.exercises ?? [],
    [todaySplitDay]
  );

  return (
    <div className="flex flex-col min-h-full pb-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="px-5 pt-14 pb-6"
      >
        <p className="text-sm text-white/40 font-medium">{getGreeting()}</p>
        <h1 className="text-2xl font-black text-white mt-0.5">{firstName}</h1>
      </motion.div>

      <div className="flex flex-col gap-4 px-5">
        {/* Resume workout banner */}
        {draftSession && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="flex items-center gap-3 p-4 rounded-[14px] bg-trainer-indigo/10 border border-trainer-indigo/30"
          >
            <div className="w-9 h-9 rounded-[10px] bg-trainer-indigo/20 flex items-center justify-center shrink-0">
              <PlayCircle size={18} className="text-trainer-indigo" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white truncate">Resume: {draftSession.splitDay}</p>
              <p className="text-xs text-white/40 mt-0.5">Unfinished workout detected</p>
            </div>
            <Link
              href={`/workout?day=${draftSession.dayIndex}`}
              className="text-xs font-bold text-trainer-indigo px-3 py-1.5 rounded-[8px] bg-trainer-indigo/15 hover:bg-trainer-indigo/25 transition-colors shrink-0"
            >
              Resume
            </Link>
            <button
              onClick={() => clearDraftSession()}
              className="w-7 h-7 rounded-full bg-white/6 flex items-center justify-center text-white/30 hover:text-white/60 transition-colors shrink-0"
            >
              <X size={13} />
            </button>
          </motion.div>
        )}

        {/* Today's workout */}
        {split && todaySplitDay ? (
          <TodayWorkoutCard
            split={split}
            splitDay={todaySplitDay}
            dayIndex={todayDayIndex}
          />
        ) : (
          <NoProgrammeCard />
        )}

        {/* Upcoming sessions horizontal scroll */}
        <UpcomingSessionsCard />

        {/* Weekly plan */}
        {split && (
          <WeeklyPlanSheet split={split} todayDayIndex={todayDayIndex} />
        )}

        {/* Streak + Week grid */}
        <div className="flex gap-3">
          <StreakCard
            streak={streak}
            weekSessionCount={weekSessionCount}
            totalSessions={recentSessions.length}
          />
          <WeekGridCard sessionDates={weekDates} />
        </div>

        {/* Deload recommendation */}
        <DeloadBanner exerciseIds={todayExerciseIds} />

        {/* Physio reminder */}
        {pendingPhysioCount > 0 && (
          <PhysioReminderBanner count={pendingPhysioCount} />
        )}

        {/* Daily weight check-in */}
        <DailyCheckinCard />

        {/* Daily nutrition log */}
        <NutritionLogCard />

        {/* Pending scheduled sessions */}
        <PendingSessionCard />

        {/* Recent PRs horizontal scroll */}
        <RecentPRsCard />

        {/* Muscle recovery heatmap */}
        <MuscleHeatmapCard />

        {/* Achievement badges */}
        <AchievementsCard />

        {/* Recent sessions */}
        <RecentSessionCard
          sessions={recentSessions.slice(0, 3)}
          weightUnit={weightUnit}
        />
      </div>
    </div>
  );
}

function NoProgrammeCard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-[20px] bg-trainer-surface border border-white/8 p-5"
    >
      <p className="text-sm text-white/40 mb-1">No programme selected</p>
      <p className="text-white font-semibold mb-4">
        Set up your training split to see today&apos;s workout.
      </p>
      <Link
        href="/settings"
        className="inline-flex items-center gap-1 text-sm text-trainer-indigo font-semibold"
      >
        Go to Settings
        <ChevronRight className="w-4 h-4" />
      </Link>
    </motion.div>
  );
}

function PhysioReminderBanner({ count }: { count: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, delay: 0.2 }}
    >
      <Link
        href="/physio"
        className="flex items-center gap-3 p-4 rounded-[14px] bg-trainer-danger/8 border border-trainer-danger/20 hover:border-trainer-danger/40 transition-colors"
      >
        <div className="w-9 h-9 rounded-[10px] bg-trainer-danger/15 flex items-center justify-center shrink-0">
          <Heart className="w-4 h-4 text-trainer-danger" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-white">
            {count} physio session{count !== 1 ? "s" : ""} pending
          </p>
          <p className="text-xs text-white/40 mt-0.5">Tap to complete your rehab exercises</p>
        </div>
        <ChevronRight className="w-4 h-4 text-white/30" />
      </Link>
    </motion.div>
  );
}
