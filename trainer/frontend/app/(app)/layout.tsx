"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUserStore } from "@/app/store/userStore";
import { usePhysioStore } from "@/app/store/physioStore";
import BottomNav from "@/app/components/ui/BottomNav";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { isAuthenticated, onboardingComplete } = useUserStore();
  const { resetDailySlots } = usePhysioStore();

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace("/signin");
      return;
    }
    if (!onboardingComplete) {
      router.replace("/onboarding");
      return;
    }
  }, [isAuthenticated, onboardingComplete, router]);

  // Reset daily physio slots at midnight
  useEffect(() => {
    const now = new Date();
    const midnight = new Date();
    midnight.setHours(24, 0, 0, 0);
    const msToMidnight = midnight.getTime() - now.getTime();

    const timer = setTimeout(() => {
      resetDailySlots();
    }, msToMidnight);

    return () => clearTimeout(timer);
  }, [resetDailySlots]);

  if (!isAuthenticated || !onboardingComplete) return null;

  return (
    <div className="flex flex-col min-h-screen bg-trainer-black">
      <main className="flex-1 pb-20 overflow-y-auto">{children}</main>
      <BottomNav />
    </div>
  );
}
