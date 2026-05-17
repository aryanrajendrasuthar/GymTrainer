"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Eye, EyeOff, AlertCircle } from "lucide-react";
import { useUserStore } from "@/app/store/userStore";
import { authApi, ApiError } from "@/app/lib/api";
import { TrainerLogo } from "@/app/components/ui/TrainerLogo";
import { Input } from "@/app/components/ui/Input";
import { cn } from "@/app/lib/utils";

export default function SignInPage() {
  const router = useRouter();
  const { setAuth, setOnboardingComplete } = useUserStore();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) return;

    setLoading(true);
    setError(null);

    try {
      const { accessToken } = await authApi.signIn(email, password);
      const profile = await authApi.getProfile(accessToken);

      setAuth(accessToken, profile);

      if (profile.splitId) {
        setOnboardingComplete(true);
        router.replace("/dashboard");
      } else {
        setOnboardingComplete(false);
        router.replace("/onboarding");
      }
    } catch (err) {
      if (err instanceof ApiError) {
        setError(
          err.status === 401
            ? "Incorrect email or password."
            : err.message
        );
      } else {
        setError("Unable to connect. Check your internet connection.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-trainer-black flex flex-col items-center justify-center px-5 py-12">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-sm flex flex-col gap-8"
      >
        {/* Logo */}
        <div className="flex justify-center">
          <TrainerLogo size={36} variant="full" />
        </div>

        {/* Heading */}
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white">Welcome back</h1>
          <p className="text-sm text-white/40 mt-1.5">Sign in to continue your training</p>
        </div>

        {/* Error banner */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-start gap-2.5 bg-trainer-danger/10 border border-trainer-danger/25 rounded-[12px] px-4 py-3"
          >
            <AlertCircle size={15} className="text-trainer-danger shrink-0 mt-0.5" />
            <p className="text-sm text-trainer-danger leading-relaxed">{error}</p>
          </motion.div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label="Email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />

          <Input
            label="Password"
            type={showPassword ? "text" : "password"}
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
            rightIcon={
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="text-white/40 hover:text-white/70 transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            }
          />

          <button
            type="submit"
            disabled={loading || !email || !password}
            className={cn(
              "mt-2 w-full py-3.5 rounded-[14px] text-sm font-bold transition-all duration-200",
              "bg-trainer-indigo text-white",
              "hover:bg-trainer-indigo-hover active:scale-[0.98]",
              "disabled:opacity-40 disabled:cursor-not-allowed disabled:scale-100"
            )}
          >
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </form>

        {/* Footer */}
        <p className="text-center text-sm text-white/35">
          New here?{" "}
          <Link
            href="/signup"
            className="text-trainer-indigo font-semibold hover:text-trainer-indigo-hover transition-colors"
          >
            Create account
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
