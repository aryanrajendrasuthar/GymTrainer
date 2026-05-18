"use client";

import { useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useUserStore } from "@/app/store/userStore";
import { usePhysioStore } from "@/app/store/physioStore";
import { useSettingsStore } from "@/app/store/settingsStore";
import { useNotificationStore } from "@/app/store/notificationStore";
import { useSessionStore } from "@/app/store/sessionStore";
import { BottomNav } from "@/app/components/ui/BottomNav";
import { NotificationToast } from "@/app/components/ui/NotificationToast";
import { useDataSync } from "@/app/hooks/useDataSync";

function useNotificationTriggers() {
  const { isAuthenticated, profile } = useUserStore();
  const { activeInjuries, todayCompletedSlots } = usePhysioStore();
  const { settings } = useSettingsStore();
  const push = useNotificationStore((s) => s.push);
  const recentSessions = useSessionStore((s) => s.recentSessions);
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
    } catch {
      // silently ignore trigger errors — never crash the layout
    }
  }, [isAuthenticated, activeInjuries, todayCompletedSlots, settings, profile, push, recentSessions]);
}

// Page entry animation — fade + 8px slide up, as specified
const pageVariants = {
  initial: { opacity: 0, y: 8 },
  enter: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -4 },
};

const pageTransition = {
  duration: 0.22,
  ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number],
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, onboardingComplete } = useUserStore();
  const { resetDailySlots } = usePhysioStore();

  useNotificationTriggers();
  useDataSync();

  useEffect(() => {
    if (!isAuthenticated) { router.replace("/signin"); return; }
    if (!onboardingComplete) { router.replace("/onboarding"); return; }
  }, [isAuthenticated, onboardingComplete, router]);

  // Reset daily physio slots at midnight
  useEffect(() => {
    const now = new Date();
    const midnight = new Date();
    midnight.setHours(24, 0, 0, 0);
    const t = setTimeout(() => resetDailySlots(), midnight.getTime() - now.getTime());
    return () => clearTimeout(t);
  }, [resetDailySlots]);

  if (!isAuthenticated || !onboardingComplete) return null;

  return (
    <div className="flex flex-col min-h-screen bg-trainer-black">
      <NotificationToast />
      <AnimatePresence mode="wait" initial={false}>
        <motion.main
          key={pathname}
          variants={pageVariants}
          initial="initial"
          animate="enter"
          exit="exit"
          transition={pageTransition}
          className="flex-1 pb-20 overflow-y-auto"
        >
          {children}
        </motion.main>
      </AnimatePresence>
      <BottomNav />
    </div>
  );
}
