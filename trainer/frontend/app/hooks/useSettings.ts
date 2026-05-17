"use client";

import { useState, useCallback, useMemo } from "react";
import { type UserSettings } from "@/app/types";

// ─── Defaults ─────────────────────────────────────────────────────────────────

export const DEFAULT_SETTINGS: Omit<UserSettings, "id" | "userId"> = {
  progressiveOverloadEnabled: true,
  overloadAmount: "standard",
  deloadReminder: true,
  weightUnit: "kg",
  rotationEnabled: true,
  showPreviousPerformance: true,
  showRpe: true,
  defaultRest: "goal-based",
  physioReminder: true,
  painTracking: true,
  autoAdvancePhase: false,
  reduceMotion: false,
  compactMode: false,
  notifications: {
    workoutReminders: true,
    workoutReminderTime: "07:00",
    workoutReminderDays: [1, 2, 3, 4, 5],
    physioMorning: true,
    physioMorningTime: "07:30",
    physioEvening: true,
    physioEveningTime: "20:00",
    streakWarning: true,
    progressiveOverloadMilestone: true,
  },
};

// ─── Types ────────────────────────────────────────────────────────────────────

type SettingsUpdate = Partial<Omit<UserSettings, "id" | "userId">>;

export interface UseSettingsReturn {
  settings: Omit<UserSettings, "id" | "userId">;
  updateSettings: (patch: SettingsUpdate) => void;
  resetSettings: () => void;
  toggleSetting: (key: BooleanSettingKey) => void;
  isKg: boolean;
  restDurationSeconds: number;
}

type BooleanSettingKey = {
  [K in keyof Omit<UserSettings, "id" | "userId">]: Omit<
    UserSettings,
    "id" | "userId"
  >[K] extends boolean
    ? K
    : never;
}[keyof Omit<UserSettings, "id" | "userId">];

const REST_DURATION_MAP: Record<UserSettings["defaultRest"], number> = {
  short: 60,
  standard: 90,
  long: 180,
  "goal-based": 90,
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useSettings(
  initial?: Partial<Omit<UserSettings, "id" | "userId">>
): UseSettingsReturn {
  const [settings, setSettings] = useState<Omit<UserSettings, "id" | "userId">>(
    () => ({ ...DEFAULT_SETTINGS, ...initial })
  );

  const updateSettings = useCallback((patch: SettingsUpdate) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      if (patch.notifications) {
        next.notifications = { ...prev.notifications, ...patch.notifications };
      }
      return next;
    });
  }, []);

  const resetSettings = useCallback(() => {
    setSettings({ ...DEFAULT_SETTINGS });
  }, []);

  const toggleSetting = useCallback((key: BooleanSettingKey) => {
    setSettings((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  }, []);

  const isKg = settings.weightUnit === "kg";

  const restDurationSeconds = useMemo(
    () => REST_DURATION_MAP[settings.defaultRest],
    [settings.defaultRest]
  );

  return {
    settings,
    updateSettings,
    resetSettings,
    toggleSetting,
    isKg,
    restDurationSeconds,
  };
}

// ─── Rest Timer Helper ────────────────────────────────────────────────────────

export function getGoalBasedRestSeconds(
  goal: UserSettings["defaultRest"],
  isCompound: boolean
): number {
  if (goal !== "goal-based") return REST_DURATION_MAP[goal];
  return isCompound ? 150 : 75;
}
