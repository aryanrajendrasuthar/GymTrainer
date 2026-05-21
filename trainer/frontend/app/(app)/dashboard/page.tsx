"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Heart, ChevronRight, PlayCircle, X, Bot, Sparkles, Dumbbell } from "lucide-react";
import { useUserStore } from "@/app/store/userStore";
import { useSessionStore } from "@/app/store/sessionStore";
import { usePhysioStore } from "@/app/store/physioStore";
import { useSettingsStore } from "@/app/store/settingsStore";
import { usePendingSessionStore } from "@/app/store/pendingSessionStore";
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
import { MilestoneBanner } from "@/app/components/dashboard/MilestoneBanner";
import { WeeklySummaryCard } from "@/app/components/dashboard/WeeklySummaryCard";
import { NutritionLogCard } from "@/app/components/dashboard/NutritionLogCard";
import { WaterIntakeCard } from "@/app/components/dashboard/WaterIntakeCard";
import { SleepLogCard } from "@/app/components/dashboard/SleepLogCard";
import { RecoveryScoreCard } from "@/app/components/dashboard/RecoveryScoreCard";
import { HabitTrackerCard } from "@/app/components/dashboard/HabitTrackerCard";
import { GoalsCard } from "@/app/components/dashboard/GoalsCard";
import { WeekComparisonCard } from "@/app/components/dashboard/WeekComparisonCard";
import { BodyStatsCard } from "@/app/components/dashboard/BodyStatsCard";
import { LifetimeStatsCard } from "@/app/components/dashboard/LifetimeStatsCard";
import { SupplementCard } from "@/app/components/dashboard/SupplementCard";
import { WorkoutTemplatesCard } from "@/app/components/dashboard/WorkoutTemplatesCard";
import { InstallBanner } from "@/app/components/ui/InstallBanner";
import { GoalCheckinModal, shouldShowCheckin } from "@/app/components/dashboard/GoalCheckinModal";
import { ExercisePickerSheet } from "@/app/components/workout/ExercisePickerSheet";
import { WeightNudgeBanner } from "@/app/components/dashboard/WeightNudgeBanner";
import { useProgressStore } from "@/app/store/progressStore";
import { getSplitById } from "@/app/data/splits";
import { analyseRoutine, getPendingSuggestions } from "@/app/lib/progression-engine";
import { exerciseMap } from "@/app/data/exercises";
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
  const router = useRouter();
  const [showCheckin, setShowCheckin] = useState(() => {
    if (typeof window === "undefined") return false;
    return shouldShowCheckin();
  });
  const [showPicker, setShowPicker] = useState(false);
  const { profile, accessToken } = useUserStore();
  const { recentSessions, allExerciseLogs, draftSession, clearDraftSession } = useSessionStore();
  const { activeInjuries, todayCompletedSlots } = usePhysioStore();
  const { settings } = useSettingsStore();
  const { addSession: addPendingSession } = usePendingSessionStore();
  const { bodyWeightLogs } = useProgressStore();

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
  const weightUnit = (settings.weightUnit ?? profile?.units ?? "kg") as "kg" | "lb";

  // Latest tracked weight vs profile weight for nudge banner
  const latestTrackedKg = bodyWeightLogs[0]?.weightKg ?? null;
  const profileWeightKg = profile?.weightKg ?? null;

  const todayExerciseIds = useMemo(
    () => todaySplitDay?.exercises ?? [],
    [todaySplitDay]
  );

  const progressionHints = useMemo(() => {
    if (!todayExerciseIds.length || !profile?.goal || todaySplitDay?.isRestDay) return [];
    const overloadAmount = settings.overloadAmount ?? "standard";
    const analyses = analyseRoutine(todayExerciseIds, allExerciseLogs, profile.goal, overloadAmount);
    return getPendingSuggestions(analyses).map((s) => ({
      name: exerciseMap[s.exerciseId]?.name ?? s.exerciseId.replace(/-/g, " "),
      suggestedWeight: s.suggestedWeight,
      increaseAmountKg: s.increaseAmountKg,
    }));
  }, [todayExerciseIds, allExerciseLogs, profile?.goal, settings.overloadAmount, todaySplitDay?.isRestDay]);

  // Estimate today's workout based on past sessions with same split day name
  const todayEstimate = useMemo(() => {
    if (!todaySplitDay || todaySplitDay.isRestDay) return undefined;
    const past = recentSessions.filter(
      (s) => s.splitDay === todaySplitDay.dayName && s.durationMinutes > 0
    );
    if (past.length < 2) return undefined;
    const avgDuration = Math.round(past.reduce((a, s) => a + s.durationMinutes, 0) / past.length);
    const avgVolume = Math.round(past.reduce((a, s) => a + s.totalVolumeKg, 0) / past.length);
    return { durationMinutes: avgDuration, volumeKg: avgVolume };
  }, [todaySplitDay, recentSessions]);

  const recentExerciseIds = useMemo(() => {
    const seen = new Set<string>();
    const ids: string[] = [];
    for (const s of recentSessions) {
      for (const ex of s.exercisesCompleted ?? []) {
        if (!seen.has(ex.exerciseId)) {
          seen.add(ex.exerciseId);
          ids.push(ex.exerciseId);
        }
      }
      if (ids.length >= 20) break;
    }
    return ids;
  }, [recentSessions]);

  function handleStartQuickWorkout(exerciseIds: string[], dayName: string) {
    const today = new Date().toISOString().split("T")[0];
    const id = addPendingSession({
      dayName,
      exercises: exerciseIds.map((eid) => ({ id: eid, type: "workout" })),
      slot: "anytime",
      date: today,
    });
    setShowPicker(false);
    router.push(`/workout?pending=${id}`);
  }

  return (
    <div className="flex flex-col min-h-full pb-6 page-enter">
      {/* PWA install banner */}
      <InstallBanner />

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="relative px-5 pt-14 pb-6 overflow-hidden"
      >
        {/* Overhead spotlight behind the greeting */}
        <div
          className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 w-64 h-40 rounded-full"
          style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(108,99,255,0.18) 0%, transparent 70%)" }}
        />
        <p className="text-sm text-white/40 font-medium relative">{getGreeting()}</p>
        <h1 className="text-2xl font-black text-white mt-0.5 relative">{firstName}</h1>
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
            progressionHints={progressionHints}
            estimate={todayEstimate}
            unit={weightUnit}
            onTrainAnyway={todaySplitDay.isRestDay ? () => setShowPicker(true) : undefined}
          />
        ) : (
          <NoProgrammeCard />
        )}

        {/* Upcoming sessions horizontal scroll */}
        <UpcomingSessionsCard />

        {/* Quick Workout builder */}
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowPicker(true)}
          className="w-full flex items-center gap-4 p-4 rounded-[16px] bg-trainer-surface border border-white/8 hover:border-white/16 transition-all text-left"
        >
          <div className="w-10 h-10 rounded-[12px] bg-trainer-indigo/15 flex items-center justify-center shrink-0">
            <Dumbbell size={18} className="text-trainer-indigo" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-white">Quick Workout</p>
            <p className="text-xs text-white/40 mt-0.5">Pick exercises and start immediately</p>
          </div>
          <ChevronRight size={15} className="text-white/25 shrink-0" />
        </motion.button>

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

        {/* Quick-start saved routines */}
        <WorkoutTemplatesCard />

        {/* Week-over-week comparison */}
        <WeekComparisonCard />

        {/* Body stats — weight trend, BMI, BF% */}
        <BodyStatsCard />

        {/* Daily recovery score */}
        <RecoveryScoreCard />

        {/* Weekly AI summary */}
        <WeeklySummaryCard
          sessions={recentSessions}
          accessToken={accessToken ?? undefined}
          goal={profile?.goal}
          streak={streak}
        />

        {/* Milestone / suggestion banner */}
        <MilestoneBanner
          sessions={recentSessions}
          allLogs={allExerciseLogs}
          streak={streak}
        />

        {/* Deload recommendation */}
        <DeloadBanner exerciseIds={todayExerciseIds} />

        {/* Weight divergence nudge */}
        {latestTrackedKg !== null && profileWeightKg !== null && (
          <WeightNudgeBanner
            trackedKg={latestTrackedKg}
            profileKg={profileWeightKg}
            unit={weightUnit}
          />
        )}

        {/* Physio reminder */}
        {pendingPhysioCount > 0 && (
          <PhysioReminderBanner count={pendingPhysioCount} />
        )}

        {/* Daily weight check-in */}
        <DailyCheckinCard />

        {/* Water intake */}
        <WaterIntakeCard />

        {/* Sleep log */}
        <SleepLogCard />

        {/* Daily habits */}
        <HabitTrackerCard />

        {/* Supplement tracker */}
        <SupplementCard />

        {/* Daily nutrition log */}
        <NutritionLogCard />

        {/* Pending scheduled sessions */}
        <PendingSessionCard />

        {/* Recent PRs horizontal scroll */}
        <RecentPRsCard />

        {/* Performance goals */}
        <GoalsCard />

        {/* All-time lifetime totals */}
        <LifetimeStatsCard />

        {/* Muscle recovery heatmap */}
        <MuscleHeatmapCard />

        {/* AI Coach card */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <Link
            href="/coach"
            className="flex items-center gap-4 p-4 rounded-[16px] bg-gradient-to-r from-trainer-indigo/15 to-purple-900/15 border border-trainer-indigo/25 hover:border-trainer-indigo/50 transition-all group"
          >
            <div className="w-10 h-10 rounded-[12px] bg-trainer-indigo/20 flex items-center justify-center shrink-0">
              <Bot size={20} className="text-trainer-indigo" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white">AI Coach</p>
              <p className="text-xs text-white/40 mt-0.5 truncate">
                Ask about training, nutrition, recovery…
              </p>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <Sparkles size={11} className="text-trainer-indigo/60" />
              <ChevronRight size={15} className="text-white/25 group-hover:text-trainer-indigo transition-colors" />
            </div>
          </Link>
        </motion.div>

        {/* Achievement badges */}
        <AchievementsCard />

        {/* Recent sessions */}
        <RecentSessionCard
          sessions={recentSessions.slice(0, 3)}
          weightUnit={weightUnit}
        />
      </div>

      {/* 4-week goal check-in */}
      <GoalCheckinModal
        open={showCheckin}
        onClose={() => setShowCheckin(false)}
        sessionCount={recentSessions.length}
      />

      {/* Quick Workout exercise picker */}
      <ExercisePickerSheet
        open={showPicker}
        onClose={() => setShowPicker(false)}
        onStart={handleStartQuickWorkout}
        recentIds={recentExerciseIds}
      />
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
