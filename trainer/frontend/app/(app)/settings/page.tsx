"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  Dumbbell,
  Zap,
  Eye,
  Bell,
  Heart,
  User,
  ChevronRight,
  LogOut,
  Check,
  RotateCcw,
  BookOpen,
  TrendingUp,
  BellRing,
  Flame,
  RefreshCw,
  Download,
  Trophy,
  Shield,
  Code2,
} from "lucide-react";
import { useSettingsStore } from "@/app/store/settingsStore";
import { useUserStore } from "@/app/store/userStore";
import { useSessionStore } from "@/app/store/sessionStore";
import { useProgressStore } from "@/app/store/progressStore";
import { useAchievementStore } from "@/app/store/achievementStore";
import { authApi } from "@/app/lib/api";
import { workoutSplits } from "@/app/data/splits";
import { calculateNutritionTargets, getCalorieRangeLabel } from "@/app/lib/nutrition";
import { GoalChangeSheet } from "@/app/components/settings/GoalChangeSheet";
import { ProfileEditSheet } from "@/app/components/settings/ProfileEditSheet";
import { cn } from "@/app/lib/utils";
import {
  type OverloadAmount,
  type RestSuggestion,
} from "@/app/types";

// ─── Primitives ─────────────────────────────────────────────────────────────

function SectionHeader({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <div className="flex items-center gap-2 mb-2 mt-1">
      <div className="w-6 h-6 rounded-[6px] bg-trainer-indigo/15 flex items-center justify-center">
        <Icon size={12} className="text-trainer-indigo" />
      </div>
      <p className="text-[11px] font-semibold text-white/35 uppercase tracking-widest">{label}</p>
    </div>
  );
}

function SettingsCard({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("bg-trainer-surface border border-white/8 rounded-[16px] overflow-hidden", className)}>
      {children}
    </div>
  );
}

function SettingsRow({
  label,
  description,
  children,
  last = false,
}: {
  label: string;
  description?: string;
  children: React.ReactNode;
  last?: boolean;
}) {
  return (
    <div className={cn("flex items-center gap-3 px-4 py-3.5", !last && "border-b border-white/5")}>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white/85">{label}</p>
        {description && <p className="text-[11px] text-white/35 mt-0.5 leading-relaxed">{description}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function Toggle({
  value,
  onChange,
}: {
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      onClick={() => onChange(!value)}
      className={cn(
        "relative w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none",
        value ? "bg-trainer-indigo" : "bg-white/15"
      )}
    >
      <motion.div
        animate={{ x: value ? 20 : 2 }}
        transition={{ type: "spring", stiffness: 500, damping: 40 }}
        className="absolute top-1 w-4 h-4 bg-white rounded-full shadow"
      />
    </button>
  );
}

function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { label: string; value: T }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex gap-1 p-1 bg-trainer-elevated rounded-[10px]">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={cn(
            "px-3 py-1.5 rounded-[7px] text-xs font-semibold transition-all duration-200",
            value === opt.value
              ? "bg-trainer-surface text-white"
              : "text-white/35 hover:text-white/60"
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function TimeInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <input
      type="time"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="bg-trainer-elevated border border-white/10 rounded-[8px] px-2.5 py-1.5 text-xs font-semibold text-white/80 focus:outline-none focus:border-trainer-indigo/50 [color-scheme:dark]"
    />
  );
}

const GOAL_LABELS: Record<string, string> = {
  "muscle-gain": "Build Muscle & Size",
  "fat-loss": "Lose Fat",
  recomp: "Body Recomposition",
  strength: "Get Stronger",
  "greek-god": "Greek God Physique",
  calisthenics: "Calisthenics & Skills",
  "general-fitness": "General Fitness",
};

const DAY_LABELS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

function DayPicker({
  value,
  onChange,
}: {
  value: number[];
  onChange: (v: number[]) => void;
}) {
  function toggle(day: number) {
    if (value.includes(day)) {
      onChange(value.filter((d) => d !== day));
    } else {
      onChange([...value, day].sort((a, b) => a - b));
    }
  }
  return (
    <div className="flex gap-1.5">
      {DAY_LABELS.map((label, i) => {
        const dayNum = i + 1;
        const active = value.includes(dayNum);
        return (
          <button
            key={dayNum}
            onClick={() => toggle(dayNum)}
            className={cn(
              "w-8 h-8 rounded-full text-[11px] font-bold transition-all duration-200",
              active
                ? "bg-trainer-indigo text-white"
                : "bg-trainer-elevated text-white/30 hover:text-white/60"
            )}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

// ─── Confirm Sheet ──────────────────────────────────────────────────────────

function ConfirmSheet({
  open,
  title,
  body,
  confirmLabel,
  onConfirm,
  onCancel,
  danger,
}: {
  open: boolean;
  title: string;
  body: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  danger?: boolean;
}) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCancel}
            className="fixed inset-0 bg-black/60 z-40"
          />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 380, damping: 40 }}
            className="fixed bottom-0 inset-x-0 z-50 bg-trainer-elevated border-t border-white/10 rounded-t-[24px] px-5 pt-5 pb-10"
          >
            <div className="w-10 h-1 bg-white/15 rounded-full mx-auto mb-5" />
            <p className="text-base font-bold text-white mb-2">{title}</p>
            <p className="text-sm text-white/45 leading-relaxed mb-6">{body}</p>
            <div className="flex flex-col gap-2">
              <button
                onClick={onConfirm}
                className={cn(
                  "w-full py-3.5 rounded-[14px] text-sm font-bold transition-colors",
                  danger
                    ? "bg-trainer-danger text-white active:bg-trainer-danger/80"
                    : "bg-trainer-indigo text-white active:bg-trainer-indigo-hover"
                )}
              >
                {confirmLabel}
              </button>
              <button
                onClick={onCancel}
                className="w-full py-3.5 rounded-[14px] text-sm font-semibold text-white/50 hover:text-white transition-colors"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ─── Saved indicator ────────────────────────────────────────────────────────

function SavedBadge({ show }: { show: boolean }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          className="fixed bottom-28 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1.5 bg-trainer-success/20 border border-trainer-success/30 text-trainer-success text-xs font-semibold px-4 py-2 rounded-full pointer-events-none"
        >
          <Check size={12} />
          Saved
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Page ───────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const { settings, updateSettings, resetSettings } = useSettingsStore();
  const { profile, signOut, accessToken, updateProfile } = useUserStore();
  const { recentSessions } = useSessionStore();
  const { bodyWeightLogs } = useProgressStore();
  const { unlocked, prCount, totalVolumeKg } = useAchievementStore();
  const router = useRouter();

  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);
  const [showGoalSheet, setShowGoalSheet] = useState(false);
  const [showProfileEdit, setShowProfileEdit] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);
  const [pushStatus, setPushStatus] = useState<NotificationPermission | "unsupported">(
    typeof Notification !== "undefined" ? Notification.permission : "unsupported"
  );

  const currentSplit = workoutSplits.find((s) => s.id === profile?.splitId);

  function patch<K extends keyof typeof settings>(key: K, value: (typeof settings)[K]) {
    updateSettings({ [key]: value } as Partial<typeof settings>);
    flashSaved();
  }

  function patchNotif<K extends keyof typeof settings.notifications>(
    key: K,
    value: (typeof settings.notifications)[K]
  ) {
    updateSettings({ notifications: { ...settings.notifications, [key]: value } });
    flashSaved();
  }

  function flashSaved() {
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 1800);
  }

  function handleReset() {
    resetSettings();
    setShowResetConfirm(false);
    flashSaved();
  }

  function handleSignOut() {
    if (accessToken) authApi.signOut(accessToken).catch(() => {});
    signOut();
    router.replace("/signin");
  }

  function handleExportData() {
    const payload = {
      exportedAt: new Date().toISOString(),
      profile: profile
        ? { name: profile.name, email: profile.email, goal: profile.goal, fitnessLevel: profile.fitnessLevel }
        : null,
      sessions: recentSessions,
      bodyWeightLogs,
      achievements: {
        unlockedCount: Object.keys(unlocked).length,
        prCount,
        totalVolumeKg,
        unlocked,
      },
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `trainer-export-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleRecalculateNutrition() {
    if (!profile?.weightKg || !profile?.heightCm || !profile?.age || !profile?.gender || !profile?.activityLevel || !profile?.goal) return;
    const targets = calculateNutritionTargets(
      profile.weightKg,
      profile.heightCm,
      profile.age,
      profile.gender,
      profile.activityLevel,
      profile.goal
    );
    updateProfile({ nutritionTargets: targets });
    flashSaved();
  }

  async function handleRequestPush() {
    if (typeof Notification === "undefined") return;
    const perm = await Notification.requestPermission();
    setPushStatus(perm);
  }

  return (
    <div className="flex flex-col min-h-full pb-28 page-enter">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="px-5 pt-14 pb-5 flex items-center justify-between"
      >
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <button
          onClick={() => setShowResetConfirm(true)}
          className="flex items-center gap-1.5 text-xs text-white/30 hover:text-white/60 transition-colors"
        >
          <RotateCcw size={12} />
          Reset
        </button>
      </motion.div>

      <div className="flex flex-col gap-6 px-5">

        {/* ── Training ── */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <SectionHeader icon={Dumbbell} label="Training" />
          <SettingsCard>
            {/* Weight unit */}
            <SettingsRow label="Weight Unit">
              <SegmentedControl
                options={[
                  { label: "kg", value: "kg" as const },
                  { label: "lb", value: "lb" as const },
                ]}
                value={settings.weightUnit ?? "kg"}
                onChange={(v) => patch("weightUnit", v)}
              />
            </SettingsRow>

            {/* Default rest */}
            <SettingsRow
              label="Default Rest"
              description="Timer duration between sets."
            >
              <SegmentedControl
                options={[
                  { label: "60s", value: "short" as RestSuggestion },
                  { label: "90s", value: "standard" as RestSuggestion },
                  { label: "3m", value: "long" as RestSuggestion },
                  { label: "Auto", value: "goal-based" as RestSuggestion },
                ]}
                value={settings.defaultRest}
                onChange={(v) => patch("defaultRest", v)}
              />
            </SettingsRow>

            {/* Progressive overload */}
            <SettingsRow
              label="Progressive Overload"
              description="Suggest weight increases after successful sets."
            >
              <Toggle
                value={settings.progressiveOverloadEnabled}
                onChange={(v) => patch("progressiveOverloadEnabled", v)}
              />
            </SettingsRow>

            {/* Overload amount — only when enabled */}
            <AnimatePresence>
              {settings.progressiveOverloadEnabled && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.18 }}
                  className="overflow-hidden"
                >
                  <SettingsRow
                    label="Overload Amount"
                    description="How aggressively to push weight increases."
                  >
                    <SegmentedControl
                      options={[
                        { label: "Conservative", value: "conservative" as OverloadAmount },
                        { label: "Standard", value: "standard" as OverloadAmount },
                        { label: "Aggressive", value: "aggressive" as OverloadAmount },
                      ]}
                      value={settings.overloadAmount}
                      onChange={(v) => patch("overloadAmount", v)}
                    />
                  </SettingsRow>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Deload reminder */}
            <SettingsRow
              label="Deload Reminder"
              description="Alert when fatigue signals suggest a deload week."
              last
            >
              <Toggle
                value={settings.deloadReminder}
                onChange={(v) => patch("deloadReminder", v)}
              />
            </SettingsRow>
          </SettingsCard>
        </motion.div>

        {/* ── Programme ── */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
          <SectionHeader icon={Zap} label="Programme" />
          <SettingsCard>
            {/* Goal */}
            <button
              onClick={() => setShowGoalSheet(true)}
              className="flex items-center gap-3 w-full px-4 py-3.5 text-left border-b border-white/5"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white/85">Current Goal</p>
                <p className="text-[11px] text-white/35 mt-0.5 truncate">
                  {profile?.goal ? GOAL_LABELS[profile.goal] : "Not set"}
                </p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-xs text-trainer-indigo font-semibold">Change</span>
                <ChevronRight size={13} className="text-trainer-indigo/60" />
              </div>
            </button>
            {/* Split */}
            <button
              onClick={() => router.push("/splits")}
              className="flex items-center gap-3 w-full px-4 py-3.5 text-left border-b border-white/5"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white/85">Current Split</p>
                <p className="text-[11px] text-white/35 mt-0.5 truncate">
                  {currentSplit ? currentSplit.name : "None selected"}
                </p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-xs text-trainer-indigo font-semibold">Change</span>
                <ChevronRight size={13} className="text-trainer-indigo/60" />
              </div>
            </button>
            <button
              onClick={() => router.push("/progress")}
              className="flex items-center gap-3 w-full px-4 py-3.5 text-left"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white/85">Progress & Analytics</p>
                <p className="text-[11px] text-white/35 mt-0.5">Charts, PRs, and body weight</p>
              </div>
              <TrendingUp size={15} className="text-white/25 shrink-0" />
            </button>
          </SettingsCard>
        </motion.div>

        {/* ── Nutrition ── */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.10 }}>
          <SectionHeader icon={Flame} label="Nutrition Targets" />
          {profile?.nutritionTargets ? (
            <div className="flex flex-col gap-3">
              {/* Calorie overview */}
              <SettingsCard>
                {(() => {
                  const nt = profile.nutritionTargets!;
                  const rangeInfo = getCalorieRangeLabel(profile.goal);
                  const isDeficit = nt.deficitOrSurplus < 0;
                  const isSurplus = nt.deficitOrSurplus > 0;
                  return (
                    <>
                      <div className="px-4 py-4 border-b border-white/5">
                        <div className="flex items-end justify-between mb-1">
                          <p className="text-xs font-semibold text-white/35 uppercase tracking-widest">
                            Daily Calories
                          </p>
                          <span className={cn("text-[11px] font-semibold", rangeInfo.color)}>
                            {rangeInfo.label}
                          </span>
                        </div>
                        <p className="text-3xl font-black text-white tabular-nums">
                          {nt.dailyCalories.toLocaleString()}
                          <span className="text-base font-normal text-white/35 ml-1">kcal</span>
                        </p>
                        <p className="text-[11px] text-white/35 mt-1">
                          Maintenance (TDEE):{" "}
                          <span className="text-white/55 font-semibold">
                            {nt.maintenanceCalories.toLocaleString()} kcal
                          </span>
                          {" · "}
                          <span className={cn("font-semibold", isDeficit ? "text-amber-400" : isSurplus ? "text-emerald-400" : "text-white/55")}>
                            {isDeficit ? "" : "+"}{nt.deficitOrSurplus} kcal
                          </span>
                        </p>
                      </div>
                      {/* Macros */}
                      <div className="grid grid-cols-3 divide-x divide-white/5">
                        {[
                          { label: "Protein", value: nt.proteinG, unit: "g", color: "text-sky-400" },
                          { label: "Carbs", value: nt.carbsG, unit: "g", color: "text-amber-400" },
                          { label: "Fat", value: nt.fatG, unit: "g", color: "text-rose-400" },
                        ].map(({ label, value, unit, color }) => (
                          <div key={label} className="px-3 py-3 text-center">
                            <p className={cn("text-xl font-bold tabular-nums", color)}>
                              {value}
                              <span className="text-xs font-normal text-white/30 ml-0.5">{unit}</span>
                            </p>
                            <p className="text-[10px] text-white/30 mt-0.5">{label}</p>
                          </div>
                        ))}
                      </div>
                    </>
                  );
                })()}
              </SettingsCard>
              {/* Recalculate */}
              <button
                onClick={handleRecalculateNutrition}
                disabled={!profile?.activityLevel}
                className="flex items-center gap-2 px-4 py-2.5 rounded-[12px] bg-trainer-surface border border-white/8 text-xs text-white/40 hover:text-white/70 hover:border-white/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <RefreshCw size={12} />
                Recalculate from current weight & goal
              </button>
            </div>
          ) : (
            <SettingsCard>
              <div className="px-4 py-4">
                <p className="text-sm font-semibold text-white/60 mb-1">
                  No targets calculated yet
                </p>
                <p className="text-[11px] text-white/35 leading-relaxed mb-3">
                  Complete your body metrics (age, height, weight, activity level) to get personalised calorie and macro targets.
                </p>
                <p className="text-[11px] text-white/25">
                  If you created your account before this update, you can re-do onboarding or edit your profile — coming soon.
                </p>
              </div>
            </SettingsCard>
          )}
        </motion.div>

        {/* ── Explore ── */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.09 }}>
          <SectionHeader icon={BookOpen} label="Explore" />
          <SettingsCard>
            <button
              onClick={() => router.push("/exercises")}
              className="flex items-center gap-3 w-full px-4 py-3.5 text-left border-b border-white/5"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white/85">Exercise Library</p>
                <p className="text-[11px] text-white/35 mt-0.5">Browse all exercises by muscle or category</p>
              </div>
              <ChevronRight size={15} className="text-white/25 shrink-0" />
            </button>
            <button
              onClick={() => router.push("/splits")}
              className="flex items-center gap-3 w-full px-4 py-3.5 text-left"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white/85">Training Splits</p>
                <p className="text-[11px] text-white/35 mt-0.5">View and switch between splits</p>
              </div>
              <ChevronRight size={15} className="text-white/25 shrink-0" />
            </button>
          </SettingsCard>
        </motion.div>

        {/* ── Display ── */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.11 }}>
          <SectionHeader icon={Eye} label="Display" />
          <SettingsCard>
            <SettingsRow
              label="Show Previous Performance"
              description="Display last session's weights and reps during workouts."
            >
              <Toggle
                value={settings.showPreviousPerformance}
                onChange={(v) => patch("showPreviousPerformance", v)}
              />
            </SettingsRow>
            <SettingsRow
              label="Show RPE"
              description="Rate of perceived exertion field on each set."
            >
              <Toggle
                value={settings.showRpe}
                onChange={(v) => patch("showRpe", v)}
              />
            </SettingsRow>
            <SettingsRow
              label="Compact Mode"
              description="Denser layout with smaller cards."
            >
              <Toggle
                value={settings.compactMode}
                onChange={(v) => patch("compactMode", v)}
              />
            </SettingsRow>
            <SettingsRow
              label="Reduce Motion"
              description="Minimise animations for accessibility."
              last
            >
              <Toggle
                value={settings.reduceMotion}
                onChange={(v) => patch("reduceMotion", v)}
              />
            </SettingsRow>
          </SettingsCard>
        </motion.div>

        {/* ── Physio ── */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14 }}>
          <SectionHeader icon={Heart} label="Physio" />
          <SettingsCard>
            <SettingsRow
              label="Pain Tracking"
              description="Log pain scores before and after physio sessions."
            >
              <Toggle
                value={settings.painTracking}
                onChange={(v) => patch("painTracking", v)}
              />
            </SettingsRow>
            <SettingsRow
              label="Auto-Advance Phase"
              description="Automatically progress rehabilitation phase when gate criteria are met."
            >
              <Toggle
                value={settings.autoAdvancePhase}
                onChange={(v) => patch("autoAdvancePhase", v)}
              />
            </SettingsRow>
            <SettingsRow
              label="Physio Reminder"
              description="Daily prompt to complete physio sessions."
              last
            >
              <Toggle
                value={settings.physioReminder}
                onChange={(v) => patch("physioReminder", v)}
              />
            </SettingsRow>
          </SettingsCard>
        </motion.div>

        {/* ── Notifications ── */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.17 }}>
          <SectionHeader icon={Bell} label="Notifications" />
          <SettingsCard>
            {/* Workout reminders */}
            <SettingsRow label="Workout Reminders">
              <Toggle
                value={settings.notifications.workoutReminders}
                onChange={(v) => patchNotif("workoutReminders", v)}
              />
            </SettingsRow>

            <AnimatePresence>
              {settings.notifications.workoutReminders && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.18 }}
                  className="overflow-hidden"
                >
                  <SettingsRow label="Reminder Time">
                    <TimeInput
                      value={settings.notifications.workoutReminderTime}
                      onChange={(v) => patchNotif("workoutReminderTime", v)}
                    />
                  </SettingsRow>
                  <div className="px-4 py-3.5 border-b border-white/5">
                    <p className="text-sm font-medium text-white/85 mb-3">Active Days</p>
                    <DayPicker
                      value={settings.notifications.workoutReminderDays}
                      onChange={(v) => patchNotif("workoutReminderDays", v)}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Physio morning */}
            <SettingsRow label="Physio Morning Reminder">
              <Toggle
                value={settings.notifications.physioMorning}
                onChange={(v) => patchNotif("physioMorning", v)}
              />
            </SettingsRow>

            <AnimatePresence>
              {settings.notifications.physioMorning && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.18 }}
                  className="overflow-hidden"
                >
                  <SettingsRow label="Morning Time">
                    <TimeInput
                      value={settings.notifications.physioMorningTime}
                      onChange={(v) => patchNotif("physioMorningTime", v)}
                    />
                  </SettingsRow>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Physio evening */}
            <SettingsRow label="Physio Evening Reminder">
              <Toggle
                value={settings.notifications.physioEvening}
                onChange={(v) => patchNotif("physioEvening", v)}
              />
            </SettingsRow>

            <AnimatePresence>
              {settings.notifications.physioEvening && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.18 }}
                  className="overflow-hidden"
                >
                  <SettingsRow label="Evening Time">
                    <TimeInput
                      value={settings.notifications.physioEveningTime}
                      onChange={(v) => patchNotif("physioEveningTime", v)}
                    />
                  </SettingsRow>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Streak warning */}
            <SettingsRow
              label="Streak Warning"
              description="Alert before your workout streak resets."
            >
              <Toggle
                value={settings.notifications.streakWarning}
                onChange={(v) => patchNotif("streakWarning", v)}
              />
            </SettingsRow>

            {/* Overload milestone */}
            <SettingsRow
              label="Overload Milestones"
              description="Celebrate new personal bests and consistent progression."
            >
              <Toggle
                value={settings.notifications.progressiveOverloadMilestone}
                onChange={(v) => patchNotif("progressiveOverloadMilestone", v)}
              />
            </SettingsRow>

            {/* Push notifications */}
            <SettingsRow
              label="Push Notifications"
              description={
                pushStatus === "granted"
                  ? "Push notifications are enabled."
                  : pushStatus === "denied"
                  ? "Blocked in browser settings. Re-enable from site permissions."
                  : pushStatus === "unsupported"
                  ? "Not supported on this browser."
                  : "Enable to receive alerts even when the app is closed."
              }
              last
            >
              {pushStatus === "granted" ? (
                <div className="flex items-center gap-1.5">
                  <BellRing size={14} className="text-trainer-success" />
                  <span className="text-xs font-semibold text-trainer-success">On</span>
                </div>
              ) : pushStatus === "denied" ? (
                <span className="text-xs text-trainer-danger/70 font-semibold">Blocked</span>
              ) : pushStatus === "unsupported" ? (
                <span className="text-xs text-white/25 font-semibold">N/A</span>
              ) : (
                <button
                  onClick={handleRequestPush}
                  className="px-3 py-1.5 rounded-[8px] bg-trainer-indigo/15 border border-trainer-indigo/25 text-xs font-bold text-trainer-indigo hover:bg-trainer-indigo/25 transition-colors"
                >
                  Enable
                </button>
              )}
            </SettingsRow>
          </SettingsCard>
        </motion.div>

        {/* ── Account ── */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.20 }}>
          <SectionHeader icon={User} label="Account" />
          <SettingsCard>
            {profile && (
              <button
                onClick={() => setShowProfileEdit(true)}
                className="flex items-center gap-3 w-full px-4 py-3.5 text-left border-b border-white/5"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white/85 truncate">{profile.name}</p>
                  <p className="text-[11px] text-white/35 mt-0.5 truncate">{profile.email}</p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-xs text-trainer-indigo font-semibold">Edit</span>
                  <ChevronRight size={13} className="text-trainer-indigo/60" />
                </div>
              </button>
            )}
            <button
              onClick={() => router.push("/achievements")}
              className="flex items-center gap-3 w-full px-4 py-3.5 text-left border-b border-white/5"
            >
              <Trophy size={15} className="text-yellow-400/70 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white/85">Achievements</p>
                <p className="text-[11px] text-white/35 mt-0.5">
                  {Object.keys(unlocked).length} unlocked
                </p>
              </div>
              <ChevronRight size={14} className="text-white/25 shrink-0" />
            </button>
            <button
              onClick={handleExportData}
              className="flex items-center gap-3 w-full px-4 py-3.5 text-left border-b border-white/5"
            >
              <Download size={15} className="text-trainer-indigo/70 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white/85">Export Data</p>
                <p className="text-[11px] text-white/35 mt-0.5">Download your sessions and progress as JSON</p>
              </div>
            </button>
            <button
              onClick={() => setShowSignOutConfirm(true)}
              className="flex items-center gap-3 w-full px-4 py-3.5 text-left group"
            >
              <LogOut size={15} className="text-trainer-danger/70 group-hover:text-trainer-danger transition-colors" />
              <span className="text-sm font-medium text-trainer-danger/80 group-hover:text-trainer-danger transition-colors">
                Sign Out
              </span>
            </button>
          </SettingsCard>
        </motion.div>

        {/* About */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="bg-trainer-surface border border-white/8 rounded-[16px] p-4 space-y-3"
        >
          <div className="flex items-center gap-2 mb-1">
            <Shield size={13} className="text-trainer-indigo" />
            <p className="text-xs font-semibold text-white/40 uppercase tracking-widest">About</p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-white/50">App</span>
              <span className="text-sm font-semibold text-white">Trainer</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-white/50">Version</span>
              <span className="text-sm font-semibold text-white tabular-nums">1.0.0</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-white/50">Developer</span>
              <span className="text-sm font-semibold text-white">Aryan Suthar</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-white/50">Contact</span>
              <span className="text-sm font-semibold text-white">asuthar1@asu.edu</span>
            </div>
          </div>

          <div className="border-t border-white/6 pt-3">
            <div className="flex items-start gap-2">
              <Code2 size={12} className="text-white/20 mt-0.5 shrink-0" />
              <p className="text-[10px] text-white/20 leading-relaxed">
                © {new Date().getFullYear()} Aryan Suthar. All rights reserved. Trainer is a proprietary
                fitness application. Unauthorised copying, distribution, or use of this software or its
                concepts is strictly prohibited.
              </p>
            </div>
          </div>
        </motion.div>

        {/* App version */}
        <p className="text-center text-[10px] text-white/15 pb-2">Trainer v1.0.0 · © 2025 Aryan Suthar</p>
      </div>

      {/* Saved flash */}
      <SavedBadge show={savedFlash} />

      {/* Profile edit sheet */}
      <ProfileEditSheet
        open={showProfileEdit}
        onClose={() => setShowProfileEdit(false)}
      />

      {/* Goal change sheet */}
      <GoalChangeSheet
        open={showGoalSheet}
        onClose={() => setShowGoalSheet(false)}
      />

      {/* Reset confirm */}
      <ConfirmSheet
        open={showResetConfirm}
        title="Reset to Defaults?"
        body="All settings will return to their original values. Your profile, workout history, and programme selection are not affected."
        confirmLabel="Reset Settings"
        onConfirm={handleReset}
        onCancel={() => setShowResetConfirm(false)}
      />

      {/* Sign-out confirm */}
      <ConfirmSheet
        open={showSignOutConfirm}
        title="Sign Out?"
        body="You'll be returned to the sign-in screen. Your data is saved locally and will be here when you return."
        confirmLabel="Sign Out"
        onConfirm={handleSignOut}
        onCancel={() => setShowSignOutConfirm(false)}
        danger
      />
    </div>
  );
}
