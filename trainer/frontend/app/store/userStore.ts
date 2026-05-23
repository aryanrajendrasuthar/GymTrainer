"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { type UserProfile, type UserInjury } from "@/app/types";
import { supabase } from "@/app/lib/supabaseClient";

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

      signOut: () => {
        // Revoke the Supabase session (clears cookie + invalidates refresh token server-side).
        // Fire-and-forget — local state clears immediately regardless.
        supabase.auth.signOut().catch(() => {});
        set({
          profile: null,
          isAuthenticated: false,
          accessToken: null,
          refreshToken: null,
          expiresAt: null,
          onboardingComplete: false,
        });
      },

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
        const { accessToken, refreshToken: storedRefreshToken, expiresAt } = get();
        if (!accessToken) return null;

        // Fast path: token still fresh with >60s buffer
        const nowSec = Math.floor(Date.now() / 1000);
        if (expiresAt && nowSec < expiresAt - 60) return accessToken;

        // Token is expired or near-expiry.
        // Strategy 1: ask the Supabase browser client — it manages its own session
        // in a long-lived cookie and refreshes automatically without hitting our backend.
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session) {
            set({
              accessToken: session.access_token,
              refreshToken: session.refresh_token,
              expiresAt: session.expires_at ?? null,
            });
            return session.access_token;
          }
        } catch {
          // getSession threw (network error, etc.) — fall through
        }

        // Strategy 2: Supabase cookie was cleared but Zustand still has a refresh
        // token (e.g. existing users who signed in before the Supabase-direct login).
        // Attempt a manual refresh directly against Supabase — no backend involved.
        if (storedRefreshToken) {
          try {
            const { data, error } = await supabase.auth.refreshSession({
              refresh_token: storedRefreshToken,
            });
            if (!error && data.session) {
              set({
                accessToken: data.session.access_token,
                refreshToken: data.session.refresh_token,
                expiresAt: data.session.expires_at ?? null,
              });
              return data.session.access_token;
            }
          } catch {
            // Manual refresh also failed
          }
        }

        // Both strategies exhausted — session is genuinely dead.
        get().signOut();
        return null;
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
