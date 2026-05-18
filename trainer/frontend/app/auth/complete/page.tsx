"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { supabase } from "@/app/lib/supabaseClient";
import { authApi } from "@/app/lib/api";
import { useUserStore } from "@/app/store/userStore";

export default function AuthCompletePage() {
  const router = useRouter();
  const { setAuth, setOnboardingComplete } = useUserStore();
  const [status, setStatus] = useState<"loading" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    async function finish() {
      try {
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError || !session) {
          setErrorMsg("Sign-in failed. Please try again.");
          setStatus("error");
          return;
        }

        const { access_token, refresh_token, expires_at } = session;

        // Try to fetch profile; if it doesn't exist yet (new OAuth user), create it
        let profile = await authApi.getProfile(access_token).catch(() => null);

        if (!profile) {
          const googleName =
            (session.user.user_metadata?.full_name as string) ??
            (session.user.user_metadata?.name as string) ??
            session.user.email?.split("@")[0] ??
            "Athlete";

          await authApi.updateProfile(access_token, { name: googleName }).catch(() => {});
          profile = await authApi.getProfile(access_token).catch(() => null);
        }

        if (!profile) {
          setErrorMsg("Could not load your profile. Please try again.");
          setStatus("error");
          return;
        }

        setAuth(access_token, profile, refresh_token, expires_at ?? null);

        if (profile.splitId) {
          setOnboardingComplete(true);
          router.replace("/dashboard");
        } else {
          setOnboardingComplete(false);
          router.replace("/onboarding");
        }
      } catch {
        setErrorMsg("Something went wrong. Please try again.");
        setStatus("error");
      }
    }

    finish();
  }, [router, setAuth, setOnboardingComplete]);

  if (status === "error") {
    return (
      <div className="min-h-screen bg-trainer-black flex flex-col items-center justify-center px-5 gap-4">
        <p className="text-white/60 text-center">{errorMsg}</p>
        <button
          onClick={() => router.replace("/signin")}
          className="px-6 py-3 rounded-[12px] bg-trainer-indigo text-white text-sm font-bold"
        >
          Back to Sign In
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-trainer-black flex flex-col items-center justify-center gap-4">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        className="w-8 h-8 rounded-full border-2 border-trainer-indigo border-t-transparent"
      />
      <p className="text-white/40 text-sm">Completing sign-in…</p>
    </div>
  );
}
