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

function clearOtherStores() {
  Object.keys(localStorage)
    .filter((k) => k.startsWith("trainer-") && k !== "trainer-user")
    .forEach((k) => localStorage.removeItem(k));
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

      setAuth: (accessToken, profile, refreshToken = null, expiresAt = null) => {
        // If a different user is signing in, wipe all other stores so no data leaks
        // across accounts (sessions, PRs, achievements, physio, etc.).
        const currentId = get().profile?.id;
        if (typeof window !== "undefined" && currentId && currentId !== profile.id) {
          clearOtherStores();
        }
        set({ accessToken, profile, isAuthenticated: true, refreshToken, expiresAt });
      },

      signOut: () => {
        // Revoke the Supabase session (clears cookie + invalidates refresh token server-side).
        // Fire-and-forget — local state clears immediately regardless.
        supabase.auth.signOut().catch(() => {});
        // Wipe every trainer-* localStorage key except the user store itself so the
        // next person who signs in on this device starts with a clean slate.
        if (typeof window !== "undefined") clearOtherStores();
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
        // NOTE: on iOS PWA the cookie jar is isolated from Safari, so this often
        // returns null even for valid sessions — Strategy 2 handles that case.
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
          // Network error — fall through to Strategy 2
        }

        // Strategy 2: use the refresh token stored in Zustand (survives iOS PWA
        // cookie isolation and app restarts via localStorage persistence).
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
            // Supabase returned an explicit auth error (invalid/revoked token).
            // Only sign out here — this is a deliberate rejection, not a network issue.
            if (error) {
              get().signOut();
              return null;
            }
          } catch {
            // Network error during refresh (device offline, momentary outage).
            // Return the existing token rather than signing the user out — the
            // session is likely still valid, we just couldn't reach Supabase right now.
            return accessToken;
          }
        }

        // getSession returned null and no refresh token is stored.
        // Keep the user logged in with the stale token rather than forcing a
        // sign-out that could be caused by iOS cookie isolation, not an invalid session.
        return accessToken;
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
