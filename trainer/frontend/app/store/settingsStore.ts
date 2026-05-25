"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { type UserSettings } from "@/app/types";
import { DEFAULT_SETTINGS } from "@/app/hooks/useSettings";
import { userScopedStorage } from "@/app/lib/userScopedStorage";

type SettingsSlice = Omit<UserSettings, "id" | "userId">;

interface SettingsState {
  settings: SettingsSlice;
  updateSettings: (patch: Partial<SettingsSlice>) => void;
  resetSettings: () => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      settings: { ...DEFAULT_SETTINGS },

      updateSettings: (patch) =>
        set((state) => ({
          settings: {
            ...state.settings,
            ...patch,
            notifications: patch.notifications
              ? { ...state.settings.notifications, ...patch.notifications }
              : state.settings.notifications,
          },
        })),

      resetSettings: () => set({ settings: { ...DEFAULT_SETTINGS } }),
    }),
    {
      name: "trainer-settings",
      storage: userScopedStorage,
    }
  )
);
