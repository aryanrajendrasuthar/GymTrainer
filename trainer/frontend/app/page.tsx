"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUserStore } from "@/app/store/userStore";

export default function RootPage() {
  const router = useRouter();
  const { isAuthenticated, onboardingComplete } = useUserStore();

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace("/signin");
    } else if (!onboardingComplete) {
      router.replace("/onboarding");
    } else {
      router.replace("/dashboard");
    }
  }, [isAuthenticated, onboardingComplete, router]);

  return null;
}
