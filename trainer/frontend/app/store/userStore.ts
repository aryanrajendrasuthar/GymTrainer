"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { type UserProfile, type UserInjury } from "@/app/types";
import { authApi } from "@/app/lib/api";

interface UserState {
  profile: UserProfile | null;
  isAuthenticated: boolean;
  onboardingComplete: boolean;
  accessToken: string | null;
  refreshToken: string | null;
  expiresAt: number | null;

  setProfile: (profile: UserProfile) => void;
  updateProfile: (patch: Partial<UserProfile>) => void;
  setAuth: (token: string, profile: UserProfile, refreshToken?: string | null, expiresAt?: number | null) => void;
  signOut: () => void;
  setOnboardingComplete: (val: boolean) => void;
  addInjury: (injury: UserInjury) => void;
  updateInjury: (condition: string, patch: Partial<UserInjury>) => void;
  removeInjury: (condition: string) => void;
  ensureValidToken: () => Promise<string | null>;
}

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      profile: null,
      isAuthenticated: false,
      onboardingComplete: false,
      accessToken: null,
      refreshToken: null,
      expiresAt: null,

      setProfile: (profile) => set({ profile }),

      updateProfile: (patch) =>
        set((state) => ({
          profile: state.profile ? { ...state.profile, ...patch } : null,
        })),

      setAuth: (accessToken, profile, refreshToken = null, expiresAt = null) =>
        set({ accessToken, profile, isAuthenticated: true, refreshToken, expiresAt }),

      signOut: () =>
        set({
          profile: null,
          isAuthenticated: false,
          accessToken: null,
          refreshToken: null,
          expiresAt: null,
          onboardingComplete: false,
        }),

      setOnboardingComplete: (val) => set({ onboardingComplete: val }),

      addInjury: (injury) =>
        set((state) => ({
          profile: state.profile
            ? {
                ...state.profile,
                injuries: [...(state.profile.injuries ?? []), injury],
              }
            : null,
        })),

      updateInjury: (condition, patch) =>
        set((state) => ({
          profile: state.profile
            ? {
                ...state.profile,
                injuries: state.profile.injuries.map((inj) =>
                  inj.condition === condition ? { ...inj, ...patch } : inj
                ),
              }
            : null,
        })),

      removeInjury: (condition) =>
        set((state) => ({
          profile: state.profile
            ? {
                ...state.profile,
                injuries: state.profile.injuries.filter(
                  (inj) => inj.condition !== condition
                ),
              }
            : null,
        })),

      ensureValidToken: async () => {
        const { accessToken, refreshToken, expiresAt } = get();
        if (!accessToken) return null;
        const nowSec = Math.floor(Date.now() / 1000);
        if (expiresAt && nowSec < expiresAt - 60) return accessToken;
        if (!refreshToken) {
          get().signOut();
          return null;
        }
        try {
          const result = await authApi.refresh(refreshToken);
          set({ accessToken: result.accessToken, refreshToken: result.refreshToken, expiresAt: result.expiresAt });
          return result.accessToken;
        } catch {
          get().signOut();
          return null;
        }
      },
    }),
    {
      name: "trainer-user",
      partialize: (state) => ({
        profile: state.profile,
        isAuthenticated: state.isAuthenticated,
        onboardingComplete: state.onboardingComplete,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        expiresAt: state.expiresAt,
      }),
    }
  )
);
