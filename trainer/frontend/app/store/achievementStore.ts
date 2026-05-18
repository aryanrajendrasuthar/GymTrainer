"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type AchievementId =
  | "first_workout"
  | "sessions_5"
  | "sessions_10"
  | "sessions_25"
  | "sessions_50"
  | "sessions_100"
  | "streak_3"
  | "streak_7"
  | "streak_14"
  | "streak_30"
  | "first_pr"
  | "pr_5"
  | "pr_10"
  | "volume_1000"
  | "volume_50000"
  | "first_physio"
  | "physio_7"
  | "exercises_10"
  | "exercises_25"
  | "early_bird"
  | "night_owl"
  | "marathon_session"
  | "no_rest_week"
  | "split_change";

export interface Achievement {
  id: AchievementId;
  title: string;
  description: string;
  icon: string;
  tier: "bronze" | "silver" | "gold" | "platinum";
  unlockedAt?: string;
}

export const ACHIEVEMENT_DEFS: Record<AchievementId, Omit<Achievement, "unlockedAt">> = {
  first_workout:     { id: "first_workout",     title: "First Blood",       description: "Complete your first workout",            icon: "🏋️", tier: "bronze" },
  sessions_5:        { id: "sessions_5",         title: "Getting Started",   description: "Complete 5 workouts",                    icon: "✊", tier: "bronze" },
  sessions_10:       { id: "sessions_10",        title: "Commitment",        description: "Complete 10 workouts",                   icon: "💪", tier: "bronze" },
  sessions_25:       { id: "sessions_25",        title: "Consistent",        description: "Complete 25 workouts",                   icon: "🔥", tier: "silver" },
  sessions_50:       { id: "sessions_50",        title: "Dedicated",         description: "Complete 50 workouts",                   icon: "⚡", tier: "silver" },
  sessions_100:      { id: "sessions_100",       title: "Century",           description: "Complete 100 workouts",                  icon: "💯", tier: "gold" },
  streak_3:          { id: "streak_3",           title: "Habit Forming",     description: "Maintain a 3-day streak",                icon: "📅", tier: "bronze" },
  streak_7:          { id: "streak_7",           title: "Weekly Warrior",    description: "Maintain a 7-day streak",                icon: "🗓️", tier: "silver" },
  streak_14:         { id: "streak_14",          title: "Fortnight Fighter", description: "Maintain a 14-day streak",               icon: "🏆", tier: "silver" },
  streak_30:         { id: "streak_30",          title: "Monthly Master",    description: "Maintain a 30-day streak",               icon: "👑", tier: "gold" },
  first_pr:          { id: "first_pr",           title: "Record Breaker",    description: "Set your first personal record",         icon: "🎯", tier: "bronze" },
  pr_5:              { id: "pr_5",               title: "Strength Seeker",   description: "Set 5 personal records",                 icon: "📈", tier: "silver" },
  pr_10:             { id: "pr_10",              title: "Elite Lifter",      description: "Set 10 personal records",                icon: "🥇", tier: "gold" },
  volume_1000:       { id: "volume_1000",        title: "Heavy Lifter",      description: "Lift 1,000 kg in a single session",      icon: "🏗️", tier: "silver" },
  volume_50000:      { id: "volume_50000",       title: "Volume King",       description: "Accumulate 50,000 kg total volume",      icon: "🌊", tier: "gold" },
  first_physio:      { id: "first_physio",       title: "Recovery Focused",  description: "Complete your first physio session",     icon: "🩹", tier: "bronze" },
  physio_7:          { id: "physio_7",           title: "Rehab Warrior",     description: "Complete 7 physio sessions",             icon: "💆", tier: "silver" },
  exercises_10:      { id: "exercises_10",       title: "Explorer",          description: "Log 10 unique exercises",                icon: "🗺️", tier: "bronze" },
  exercises_25:      { id: "exercises_25",       title: "Variety Athlete",   description: "Log 25 unique exercises",                icon: "🎲", tier: "silver" },
  early_bird:        { id: "early_bird",         title: "Early Bird",        description: "Complete a workout before 7 AM",         icon: "🌅", tier: "bronze" },
  night_owl:         { id: "night_owl",          title: "Night Owl",         description: "Complete a workout after 10 PM",         icon: "🦉", tier: "bronze" },
  marathon_session:  { id: "marathon_session",   title: "Endurance",         description: "Complete a 90+ minute workout",          icon: "⏱️", tier: "silver" },
  no_rest_week:      { id: "no_rest_week",       title: "No Days Off",       description: "Train 7 days in a single week",          icon: "💥", tier: "platinum" },
  split_change:      { id: "split_change",       title: "Variety Seeker",    description: "Switch your training split",             icon: "🔄", tier: "bronze" },
};

interface AchievementState {
  unlocked: Partial<Record<AchievementId, string>>;
  prCount: number;
  physioSessionCount: number;
  totalVolumeKg: number;

  unlock: (id: AchievementId) => void;
  incrementPRCount: (count?: number) => void;
  incrementPhysioCount: () => void;
  addVolume: (kg: number) => void;
  getUnlockedList: () => Achievement[];
  isUnlocked: (id: AchievementId) => boolean;
}

export const useAchievementStore = create<AchievementState>()(
  persist(
    (set, get) => ({
      unlocked: {},
      prCount: 0,
      physioSessionCount: 0,
      totalVolumeKg: 0,

      unlock: (id) =>
        set((state) => {
          if (state.unlocked[id]) return state;
          return { unlocked: { ...state.unlocked, [id]: new Date().toISOString() } };
        }),

      incrementPRCount: (count = 1) =>
        set((state) => ({ prCount: state.prCount + count })),

      incrementPhysioCount: () =>
        set((state) => ({ physioSessionCount: state.physioSessionCount + 1 })),

      addVolume: (kg) =>
        set((state) => ({ totalVolumeKg: state.totalVolumeKg + kg })),

      getUnlockedList: () => {
        const { unlocked } = get();
        return (Object.entries(unlocked) as [AchievementId, string][])
          .sort((a, b) => new Date(b[1]).getTime() - new Date(a[1]).getTime())
          .map(([id, unlockedAt]) => ({ ...ACHIEVEMENT_DEFS[id], unlockedAt }));
      },

      isUnlocked: (id) => !!get().unlocked[id],
    }),
    { name: "trainer-achievements" }
  )
);

// Call this after every completed session to check and unlock achievements
export function checkSessionAchievements(params: {
  sessionCount: number;
  streak: number;
  newPRCount: number;
  sessionVolumeKg: number;
  sessionDurationMinutes: number;
  sessionHour: number;
  weekSessionCount: number;
  unlock: (id: AchievementId) => void;
  incrementPRCount: (n: number) => void;
  addVolume: (kg: number) => void;
  currentPRCount: number;
  currentTotalVolume: number;
}) {
  const {
    sessionCount, streak, newPRCount, sessionVolumeKg,
    sessionDurationMinutes, sessionHour, weekSessionCount,
    unlock, incrementPRCount, addVolume,
    currentPRCount, currentTotalVolume,
  } = params;

  const newPRTotal = currentPRCount + newPRCount;
  const newVolumeTotal = currentTotalVolume + sessionVolumeKg;

  // Session count milestones
  if (sessionCount >= 1)   unlock("first_workout");
  if (sessionCount >= 5)   unlock("sessions_5");
  if (sessionCount >= 10)  unlock("sessions_10");
  if (sessionCount >= 25)  unlock("sessions_25");
  if (sessionCount >= 50)  unlock("sessions_50");
  if (sessionCount >= 100) unlock("sessions_100");

  // Streak milestones
  if (streak >= 3)  unlock("streak_3");
  if (streak >= 7)  unlock("streak_7");
  if (streak >= 14) unlock("streak_14");
  if (streak >= 30) unlock("streak_30");

  // PRs
  if (newPRCount > 0)       incrementPRCount(newPRCount);
  if (newPRTotal >= 1)      unlock("first_pr");
  if (newPRTotal >= 5)      unlock("pr_5");
  if (newPRTotal >= 10)     unlock("pr_10");

  // Volume
  addVolume(sessionVolumeKg);
  if (sessionVolumeKg >= 1000)   unlock("volume_1000");
  if (newVolumeTotal >= 50000)   unlock("volume_50000");

  // Duration
  if (sessionDurationMinutes >= 90) unlock("marathon_session");

  // Time-based
  if (sessionHour < 7)  unlock("early_bird");
  if (sessionHour >= 22) unlock("night_owl");

  // Weekly consistency
  if (weekSessionCount >= 7) unlock("no_rest_week");

  // Unique exercises tracked separately via exerciseIds length
}

export function checkExerciseAchievements(uniqueExerciseCount: number, unlock: (id: AchievementId) => void) {
  if (uniqueExerciseCount >= 10) unlock("exercises_10");
  if (uniqueExerciseCount >= 25) unlock("exercises_25");
}
