"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, AlertCircle, Mail, CheckCircle2 } from "lucide-react";
import { authApi, ApiError } from "@/app/lib/api";
import { supabase } from "@/app/lib/supabaseClient";
import { TrainerLogo } from "@/app/components/ui/TrainerLogo";
import { GymBackground } from "@/app/components/ui/GymBackground";
import { Input } from "@/app/components/ui/Input";
import { cn } from "@/app/lib/utils";

function passwordStrength(password: string): { score: number; label: string; color: string } {
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 1) return { score, label: "Weak", color: "bg-trainer-danger" };
  if (score <= 2) return { score, label: "Fair", color: "bg-trainer-warning" };
  if (score <= 3) return { score, label: "Good", color: "bg-trainer-success/70" };
  return { score, label: "Strong", color: "bg-trainer-success" };
}

export default function SignUpPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function handleGoogleSignUp() {
    setGoogleLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) {
      setError("Google sign-up failed. Please try again.");
      setGoogleLoading(false);
    }
  }

  const strength = passwordStrength(password);
  const canSubmit = name.trim().length > 0 && email.length > 0 && password.length >= 8;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;

    setLoading(true);
    setError(null);

    try {
      await authApi.signUp(name.trim(), email, password);
      setDone(true);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Unable to connect. Check your internet connection.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen gym-bg-auth flex flex-col items-center justify-center px-5 py-12">
      <GymBackground variant="auth" />
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

        <AnimatePresence mode="wait">
          {done ? (
            /* ── Email confirmation screen ── */
            <motion.div
              key="done"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center gap-5 text-center"
            >
              <div className="w-16 h-16 rounded-full bg-trainer-success/15 border border-trainer-success/25 flex items-center justify-center">
                <Mail size={28} className="text-trainer-success" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Check your email</h2>
                <p className="text-sm text-white/40 mt-2 leading-relaxed">
                  We sent a confirmation link to{" "}
                  <span className="text-white/70 font-medium">{email}</span>.
                  Confirm it, then sign in.
                </p>
              </div>
              <button
                onClick={() => router.push("/signin")}
                className="w-full py-3.5 rounded-[14px] text-sm font-bold bg-trainer-indigo text-white hover:bg-trainer-indigo-hover transition-colors active:scale-[0.98]"
              >
                Go to Sign In
              </button>
            </motion.div>
          ) : (
            /* ── Form ── */
            <motion.div key="form" className="flex flex-col gap-8">
              {/* Heading */}
              <div className="text-center">
                <h1 className="text-2xl font-bold text-white">Create account</h1>
                <p className="text-sm text-white/40 mt-1.5">
                  Your fitness journey starts here
                </p>
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

              {/* Google sign-up */}
              <button
                type="button"
                onClick={handleGoogleSignUp}
                disabled={googleLoading}
                className={cn(
                  "w-full py-3.5 rounded-[14px] text-sm font-semibold transition-all duration-200",
                  "bg-white text-gray-800 hover:bg-gray-100 active:scale-[0.98]",
                  "flex items-center justify-center gap-2.5 shadow-sm",
                  "disabled:opacity-50 disabled:cursor-not-allowed"
                )}
              >
                {googleLoading ? (
                  <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                )}
                {googleLoading ? "Redirecting…" : "Continue with Google"}
              </button>

              {/* Divider */}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-white/10" />
                <span className="text-xs text-white/25 font-medium">or</span>
                <div className="flex-1 h-px bg-white/10" />
              </div>

              {/* Form fields */}
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <Input
                  label="Full Name"
                  type="text"
                  placeholder="Alex Johnson"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="name"
                  required
                />

                <Input
                  label="Email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                />

                <div className="flex flex-col gap-2">
                  <Input
                    label="Password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Minimum 8 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="new-password"
                    required
                    minLength={8}
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

                  {/* Password strength bar */}
                  {password.length > 0 && (
                    <div className="flex items-center gap-2">
                      <div className="flex-1 flex gap-1">
                        {[1, 2, 3, 4].map((i) => (
                          <div
                            key={i}
                            className={cn(
                              "h-1 flex-1 rounded-full transition-all duration-300",
                              strength.score >= i ? strength.color : "bg-white/10"
                            )}
                          />
                        ))}
                      </div>
                      <span className="text-[11px] text-white/40 w-12 text-right">
                        {strength.label}
                      </span>
                    </div>
                  )}
                </div>

                {/* Requirements checklist */}
                {password.length > 0 && (
                  <div className="flex flex-col gap-1.5">
                    {[
                      { label: "At least 8 characters", met: password.length >= 8 },
                      { label: "Uppercase letter", met: /[A-Z]/.test(password) },
                      { label: "Number", met: /[0-9]/.test(password) },
                    ].map(({ label, met }) => (
                      <div key={label} className="flex items-center gap-2">
                        <CheckCircle2
                          size={12}
                          className={cn(
                            "transition-colors",
                            met ? "text-trainer-success" : "text-white/20"
                          )}
                        />
                        <span
                          className={cn(
                            "text-[11px] transition-colors",
                            met ? "text-white/50" : "text-white/25"
                          )}
                        >
                          {label}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || !canSubmit}
                  className={cn(
                    "mt-2 w-full py-3.5 rounded-[14px] text-sm font-bold transition-all duration-200",
                    "bg-trainer-indigo text-white",
                    "hover:bg-trainer-indigo-hover active:scale-[0.98]",
                    "disabled:opacity-40 disabled:cursor-not-allowed disabled:scale-100"
                  )}
                >
                  {loading ? "Creating account…" : "Create Account"}
                </button>
              </form>

              {/* Footer */}
              <p className="text-center text-sm text-white/35">
                Already have an account?{" "}
                <Link
                  href="/signin"
                  className="text-trainer-indigo font-semibold hover:text-trainer-indigo-hover transition-colors"
                >
                  Sign in
                </Link>
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
