"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useUserStore } from "@/app/store/userStore";
import { usePhysioStore } from "@/app/store/physioStore";
import { useSettingsStore } from "@/app/store/settingsStore";
import { useNotificationStore } from "@/app/store/notificationStore";
import { useSessionStore } from "@/app/store/sessionStore";
import { useSupplementStore } from "@/app/store/supplementStore";
import { useGoalStore } from "@/app/store/goalStore";
import { BottomNav } from "@/app/components/ui/BottomNav";
import { NotificationToast } from "@/app/components/ui/NotificationToast";
import { OfflineBanner } from "@/app/components/ui/OfflineBanner";
import { GymBackground } from "@/app/components/ui/GymBackground";
import { useDataSync } from "@/app/hooks/useDataSync";

function useNotificationTriggers() {
  const { isAuthenticated, profile } = useUserStore();
  const { activeInjuries, todayCompletedSlots } = usePhysioStore();
  const { settings } = useSettingsStore();
  const push = useNotificationStore((s) => s.push);
  const recentSessions = useSessionStore((s) => s.recentSessions);
  const supplements = useSupplementStore((s) => s.supplements);
  const supplementCompletions = useSupplementStore((s) => s.completions);
  const goals = useGoalStore((s) => s.goals);
  const firedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!isAuthenticated) return;

    function fire(key: string, n: Parameters<typeof push>[0]) {
      if (firedRef.current.has(key)) return;
      firedRef.current.add(key);
      push(n);
    }

    const now = new Date();
    const hour = now.getHours();
    const dayOfWeek = now.getDay(); // 0=Sun, 1=Mon…

    try {
      const notif = settings.notifications ?? {};

      // ── Workout reminder ────────────────────────────────────────────────
      if (notif.workoutReminders) {
        const [rh = 7, rm = 0] = (notif.workoutReminderTime ?? "07:00").split(":").map(Number);
        const dayNum = dayOfWeek === 0 ? 7 : dayOfWeek;
        const isDueDay = (notif.workoutReminderDays ?? [1,2,3,4,5]).includes(dayNum);
        if (isDueDay && hour === rh && now.getMinutes() >= rm) {
          fire(`workout-${now.toDateString()}`, {
            type: "info",
            title: "Time to train",
            body: "Your workout is scheduled for today.",
            action: { label: "Start Workout", href: "/workout" },
          });
        }
      }

      // ── Physio morning reminder ─────────────────────────────────────────
      if (notif.physioMorning && activeInjuries.length > 0) {
        const [ph = 8] = (notif.physioMorningTime ?? "08:00").split(":").map(Number);
        if (hour >= ph) {
          const pending = activeInjuries.filter(
            (inj) => !(todayCompletedSlots[inj.condition] ?? []).includes("morning")
          );
          if (pending.length > 0) {
            fire(`physio-morning-${now.toDateString()}`, {
              type: "warning",
              title: "Morning physio pending",
              body: `${pending.length} session${pending.length !== 1 ? "s" : ""} to complete.`,
              action: { label: "Open Physio", href: "/physio" },
            });
          }
        }
      }

      // ── Physio evening reminder ─────────────────────────────────────────
      if (notif.physioEvening && activeInjuries.length > 0) {
        const [ph = 20] = (notif.physioEveningTime ?? "20:00").split(":").map(Number);
        if (hour >= ph) {
          const pending = activeInjuries.filter(
            (inj) => !(todayCompletedSlots[inj.condition] ?? []).includes("evening")
          );
          if (pending.length > 0) {
            fire(`physio-evening-${now.toDateString()}`, {
              type: "warning",
              title: "Evening physio pending",
              body: `${pending.length} session${pending.length !== 1 ? "s" : ""} to complete.`,
              action: { label: "Open Physio", href: "/physio" },
            });
          }
        }
      }

      // ── Streak warning (after 8pm, no workout today) ────────────────────
      if (notif.streakWarning && profile && hour >= 20) {
        const todayStr = now.toISOString().split("T")[0];
        const workedOutToday = recentSessions.some((s) => s.date === todayStr);
        if (!workedOutToday) {
          fire(`streak-${now.toDateString()}`, {
            type: "danger",
            title: "Streak at risk",
            body: "Log a workout before midnight to keep your streak.",
            action: { label: "Quick Workout", href: "/workout" },
          });
        }
      }

      // ── Supplement reminder (after 8pm, enabled supplements not all taken) ─
      if (hour >= 20) {
        const enabled = supplements.filter((s) => s.enabled);
        if (enabled.length > 0) {
          const todayStr = now.toISOString().split("T")[0];
          const takenIds = supplementCompletions.find((c) => c.date === todayStr)?.takenIds ?? [];
          const missing = enabled.filter((s) => !takenIds.includes(s.id));
          if (missing.length > 0) {
            fire(`supplements-${now.toDateString()}`, {
              type: "info",
              title: "Supplement reminder",
              body: `${missing.length} supplement${missing.length !== 1 ? "s" : ""} not yet logged today.`,
              action: { label: "Log now", href: "/dashboard" },
            });
          }
        }
      }
      // ── Goal deadline warning (after 8am, deadline ≤ 3 days) ───────────────
      if (hour >= 8) {
        const urgentGoals = goals.filter((g) => {
          if (g.achieved) return false;
          if (!g.deadline) return false;
          const daysLeft = Math.ceil((new Date(g.deadline).getTime() - Date.now()) / 86400000);
          return daysLeft >= 0 && daysLeft <= 3;
        });
        if (urgentGoals.length > 0) {
          fire(`goal-deadline-${now.toDateString()}`, {
            type: "warning",
            title: "Goal deadline approaching",
            body: `${urgentGoals.length} goal${urgentGoals.length !== 1 ? "s" : ""} due within 3 days.`,
            action: { label: "View Goals", href: "/dashboard" },
          });
        }
      }
    } catch {
      // silently ignore trigger errors — never crash the layout
    }
  }, [isAuthenticated, activeInjuries, todayCompletedSlots, settings, profile, push, recentSessions, supplements, supplementCompletions, goals]);
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, onboardingComplete, ensureValidToken } = useUserStore();
  const { resetDailySlots } = usePhysioStore();

  // Use Zustand's own hydration signal — goes true exactly once, never resets.
  // Guard against SSR: Next.js pre-renders "use client" components on the server;
  // persist.hasHydrated() must not run there (no localStorage / window).
  const [hydrated, setHydrated] = useState(() => {
    if (typeof window === "undefined") return false;
    return useUserStore.persist.hasHydrated();
  });

  useNotificationTriggers();
  useDataSync();

  useEffect(() => {
    if (hydrated) return;
    return useUserStore.persist.onFinishHydration(() => setHydrated(true));
  }, [hydrated]);

  // Silently refresh the access token on every app open so sessions survive
  // across days. ensureValidToken() is a no-op if the token is still fresh;
  // if the JWT has expired it uses the persisted refreshToken to get a new one.
  // If the refresh token itself has expired it calls signOut() internally, which
  // flips isAuthenticated → false and the effect below redirects to /signin.
  useEffect(() => {
    if (!hydrated || !isAuthenticated) return;
    ensureValidToken();
  }, [hydrated, isAuthenticated, ensureValidToken]);

  useEffect(() => {
    if (!hydrated) return;
    if (!isAuthenticated) {
      // Hard reload so all in-memory Zustand stores reinitialize from localStorage
      // (which signOut() already wiped). Prevents previous account's data from
      // leaking into the next session via stale in-memory state.
      window.location.replace("/signin");
      return;
    }
    if (!onboardingComplete) { router.replace("/onboarding"); return; }
  }, [hydrated, isAuthenticated, onboardingComplete, router]);

  // Reset daily physio slots at midnight
  useEffect(() => {
    const now = new Date();
    const midnight = new Date();
    midnight.setHours(24, 0, 0, 0);
    const t = setTimeout(() => resetDailySlots(), midnight.getTime() - now.getTime());
    return () => clearTimeout(t);
  }, [resetDailySlots]);

  // Show shell with BottomNav while hydrating so there is never a blank screen
  if (!hydrated || !isAuthenticated || !onboardingComplete) {
    return (
      <div className="flex flex-col min-h-[100dvh] gym-bg overflow-x-hidden">
        <GymBackground />
        <div className="flex-1 pb-20" />
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-[100dvh] gym-bg overflow-x-hidden">
      <GymBackground />
      <OfflineBanner />
      <NotificationToast />
      <main className="flex-1 pb-20 overflow-y-auto">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
