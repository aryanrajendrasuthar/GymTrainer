"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { type UserProfile, type UserInjury } from "@/app/types";

interface UserState {
  profile: UserProfile | null;
  isAuthenticated: boolean;
  onboardingComplete: boolean;
  accessToken: string | null;

  setProfile: (profile: UserProfile) => void;
  updateProfile: (patch: Partial<UserProfile>) => void;
  setAuth: (token: string, profile: UserProfile) => void;
  signOut: () => void;
  setOnboardingComplete: (val: boolean) => void;
  addInjury: (injury: UserInjury) => void;
  updateInjury: (condition: string, patch: Partial<UserInjury>) => void;
  removeInjury: (condition: string) => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      profile: null,
      isAuthenticated: false,
      onboardingComplete: false,
      accessToken: null,

      setProfile: (profile) => set({ profile }),

      updateProfile: (patch) =>
        set((state) => ({
          profile: state.profile ? { ...state.profile, ...patch } : null,
        })),

      setAuth: (accessToken, profile) =>
        set({ accessToken, profile, isAuthenticated: true }),

      signOut: () =>
        set({
          profile: null,
          isAuthenticated: false,
          accessToken: null,
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
    }),
    {
      name: "trainer-user",
      partialize: (state) => ({
        profile: state.profile,
        isAuthenticated: state.isAuthenticated,
        onboardingComplete: state.onboardingComplete,
        accessToken: state.accessToken,
      }),
    }
  )
);
