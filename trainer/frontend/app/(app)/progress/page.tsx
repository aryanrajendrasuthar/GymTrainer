"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, Dumbbell, TrendingUp, X, ChevronRight, Trash2, Share2, Ruler, Target, Flame, Plus, ChevronDown, ChevronUp, Download, Zap, BarChart3 } from "lucide-react";
import { useSessionStore } from "@/app/store/sessionStore";
import { useSettingsStore } from "@/app/store/settingsStore";
import { useUserStore } from "@/app/store/userStore";
import { useProgressStore, type BodyMeasurements } from "@/app/store/progressStore";
import { getSplitById } from "@/app/data/splits";
import { progressApi, sessionsApi } from "@/app/lib/api";
import { VolumeChart, type WeeklyVolumeData } from "@/app/components/progress/VolumeChart";
import { OneRMChart, type OneRMDataPoint } from "@/app/components/progress/OneRMChart";
import { PRCard, type ExercisePR } from "@/app/components/progress/PRCard";
import { BodyWeightChart } from "@/app/components/progress/BodyWeightChart";
import { MuscleVolumeChart } from "@/app/components/progress/MuscleVolumeChart";
import { StrengthStandardsCard } from "@/app/components/progress/StrengthStandardsCard";
import { WorkoutCalendar } from "@/app/components/progress/WorkoutCalendar";
import { MeasurementTrendChart } from "@/app/components/progress/MeasurementTrendChart";
import { NutritionHistoryChart } from "@/app/components/progress/NutritionHistoryChart";
import { ActivityHeatmap } from "@/app/components/progress/ActivityHeatmap";
import { GoalWeightCard } from "@/app/components/progress/GoalWeightCard";
import { TrainingLoadCard } from "@/app/components/progress/TrainingLoadCard";
import { InsightsPanel } from "@/app/components/progress/InsightsPanel";
import { SleepPerformanceChart } from "@/app/components/progress/SleepPerformanceChart";
import { MuscleBalanceChart } from "@/app/components/progress/MuscleBalanceChart";
import { WeeklyVolumeCard } from "@/app/components/progress/WeeklyVolumeCard";
import { StagnationCard } from "@/app/components/progress/StagnationCard";
import { MuscleVolumeTargetsCard } from "@/app/components/progress/MuscleVolumeTargetsCard";
import { BodyFatTrendChart } from "@/app/components/progress/BodyFatTrendChart";
import { SplitAdherenceCard } from "@/app/components/progress/SplitAdherenceCard";
import { SessionRatingChart } from "@/app/components/progress/SessionRatingChart";
import { NotesJournalSheet } from "@/app/components/progress/NotesJournalSheet";
import { TDEECard } from "@/app/components/progress/TDEECard";
import { calculateBMR } from "@/app/lib/nutrition";
import type { ActivityLevel } from "@/app/types";
import { useNutritionStore } from "@/app/store/nutritionStore";
import { exerciseMap } from "@/app/data/exercises";
import { estimateOneRepMax } from "@/app/lib/progression-engine";
import { type WorkoutSession, type ExerciseLog } from "@/app/types";
import { formatVolume, cn } from "@/app/lib/utils";

// ─── Period options ─────────────────────────────────────────────────────────────

const PERIODS = [
  { label: "4W", weeks: 4 },
  { label: "8W", weeks: 8 },
  { label: "12W", weeks: 12 },
] as const;

type Period = (typeof PERIODS)[number];

// ─── Data helpers ───────────────────────────────────────────────────────────────

function getWeekStartMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day; // Mon = 0
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function buildWeeklyVolume(
  sessions: WorkoutSession[],
  weeks: number
): WeeklyVolumeData[] {
  const now = new Date();
  const result: WeeklyVolumeData[] = [];

  for (let i = weeks - 1; i >= 0; i--) {
    const weekStart = getWeekStartMonday(new Date(now));
    weekStart.setDate(weekStart.getDate() - i * 7);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    const weekSessions = sessions.filter((s) => {
      const d = new Date(s.date);
      return d >= weekStart && d <= weekEnd;
    });

    const label = weekStart.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });

    result.push({
      week: label,
      volume: Math.round(weekSessions.reduce((sum, s) => sum + s.totalVolumeKg, 0)),
      sessions: weekSessions.length,
    });
  }

  return result;
}

function computePRs(
  allLogs: ExerciseLog[],
  unit: "kg" | "lb"
): ExercisePR[] {
  const prMap = new Map<string, ExercisePR>();

  for (const log of allLogs) {
    if (!log.sets.length) continue;

    const topSet = log.sets.reduce((best, s) =>
      estimateOneRepMax(s.weightUsed, s.repsCompleted) >
      estimateOneRepMax(best.weightUsed, best.repsCompleted)
        ? s
        : best
    );

    const e1rm = estimateOneRepMax(topSet.weightUsed, topSet.repsCompleted);
    const existing = prMap.get(log.exerciseId);

    if (!existing || e1rm > existing.estimated1RM) {
      const ex = exerciseMap[log.exerciseId];
      if (!ex) continue;
      prMap.set(log.exerciseId, {
        exerciseId: log.exerciseId,
        exerciseName: ex.name,
        bestWeight: topSet.weightUsed,
        bestReps: topSet.repsCompleted,
        estimated1RM: Math.round(e1rm * 10) / 10,
        achievedDate: log.loggedAt.split("T")[0],
        unit,
      });
    }
  }

  return Array.from(prMap.values()).sort(
    (a, b) => b.estimated1RM - a.estimated1RM
  );
}

function buildOneRMHistory(
  exerciseId: string,
  allLogs: ExerciseLog[],
  sessionDates: Record<string, string>
): OneRMDataPoint[] {
  const exerciseLogs = allLogs
    .filter((l) => l.exerciseId === exerciseId && l.sets.length > 0)
    .sort(
      (a, b) =>
        new Date(a.loggedAt).getTime() - new Date(b.loggedAt).getTime()
    );

  return exerciseLogs.map((log) => {
    const topSet = log.sets.reduce((best, s) =>
      estimateOneRepMax(s.weightUsed, s.repsCompleted) >
      estimateOneRepMax(best.weightUsed, best.repsCompleted)
        ? s
        : best
    );
    const date = sessionDates[log.sessionId] ?? log.loggedAt.split("T")[0];
    const label = new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
    return {
      date: label,
      estimated1RM: Math.round(estimateOneRepMax(topSet.weightUsed, topSet.repsCompleted) * 10) / 10,
      topWeight: topSet.weightUsed,
      topReps: topSet.repsCompleted,
    };
  });
}

// ─── Summary stats ──────────────────────────────────────────────────────────────

function SummaryStats({
  sessions,
  unit,
}: {
  sessions: WorkoutSession[];
  unit: "kg" | "lb";
}) {
  const totalVolume = sessions.reduce((s, sess) => s + sess.totalVolumeKg, 0);
  const avgDuration =
    sessions.length > 0
      ? Math.round(sessions.reduce((s, sess) => s + sess.durationMinutes, 0) / sessions.length)
      : 0;

  const stats = [
    {
      icon: Dumbbell,
      label: "Sessions",
      value: sessions.length.toString(),
      color: "text-trainer-indigo",
      bg: "bg-trainer-indigo/12",
    },
    {
      icon: TrendingUp,
      label: "Volume",
      value: formatVolume(totalVolume, unit),
      color: "text-trainer-success",
      bg: "bg-trainer-success/12",
    },
    {
      icon: Clock,
      label: "Avg Duration",
      value: avgDuration ? `${avgDuration}m` : "—",
      color: "text-trainer-warning",
      bg: "bg-trainer-warning/12",
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-3">
      {stats.map(({ icon: Icon, label, value, color, bg }, i) => (
        <motion.div
          key={label}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.07 }}
          className="bg-trainer-surface border border-white/8 rounded-[14px] p-3 flex flex-col gap-2"
        >
          <div className={cn("w-7 h-7 rounded-[8px] flex items-center justify-center", bg)}>
            <Icon size={14} className={color} />
          </div>
          <p className="text-base font-bold text-white tabular-nums leading-none">{value}</p>
          <p className="text-[10px] text-white/35">{label}</p>
        </motion.div>
      ))}
    </div>
  );
}

// ─── Page ───────────────────────────────────────────────────────────────────────

// ─── Consistency score ──────────────────────────────────────────────────────────

function computeConsistency(sessions: WorkoutSession[], splitDaysPerWeek: number): number {
  const days28 = 28;
  const expected = Math.round((splitDaysPerWeek / 7) * days28);
  if (expected === 0) return 0;
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days28);
  const actual = sessions.filter((s) => new Date(s.date) >= cutoff).length;
  return Math.min(100, Math.round((actual / expected) * 100));
}

// ─── Body fat % (US Navy method) ──────────────────────────────────────────────

function estimateNavyBodyFat(
  gender: "male" | "female" | "other",
  heightCm: number,
  waistCm: number,
  neckCm: number,
  hipsCm?: number
): number | null {
  if (heightCm <= 0 || waistCm <= 0 || neckCm <= 0) return null;
  const h = Math.log10(heightCm);
  if (gender === "male") {
    const bf = 86.010 * Math.log10(waistCm - neckCm) - 70.041 * h + 36.76;
    return waistCm <= neckCm ? null : Math.round(bf * 10) / 10;
  }
  if (!hipsCm || hipsCm <= 0) return null;
  const bf = 163.205 * Math.log10(waistCm + hipsCm - neckCm) - 97.684 * h - 78.387;
  return waistCm + hipsCm <= neckCm ? null : Math.round(bf * 10) / 10;
}

function bfCategory(bf: number, gender: "male" | "female" | "other"): { label: string; color: string } {
  if (gender === "female") {
    if (bf < 14) return { label: "Essential fat", color: "text-blue-400" };
    if (bf < 21) return { label: "Athletic", color: "text-trainer-success" };
    if (bf < 25) return { label: "Fitness", color: "text-trainer-indigo" };
    if (bf < 32) return { label: "Average", color: "text-amber-400" };
    return { label: "Above average", color: "text-red-400" };
  }
  if (bf < 6) return { label: "Essential fat", color: "text-blue-400" };
  if (bf < 14) return { label: "Athletic", color: "text-trainer-success" };
  if (bf < 18) return { label: "Fitness", color: "text-trainer-indigo" };
  if (bf < 25) return { label: "Average", color: "text-amber-400" };
  return { label: "Above average", color: "text-red-400" };
}

// ─── Session intensity score (avg e1RM vs all-time PR, 0–100) ─────────────────

function computeSessionIntensity(
  session: WorkoutSession,
  bestE1RMByExercise: Record<string, number>
): number | null {
  const ratios: number[] = [];
  for (const log of session.exercisesCompleted) {
    if (!log.sets.length) continue;
    const sessionBest = Math.max(...log.sets.map((s) => estimateOneRepMax(s.weightUsed, s.repsCompleted)));
    const allTimeBest = bestE1RMByExercise[log.exerciseId];
    if (!allTimeBest || sessionBest <= 0) continue;
    ratios.push(Math.min(1, sessionBest / allTimeBest));
  }
  if (!ratios.length) return null;
  return Math.round((ratios.reduce((a, b) => a + b, 0) / ratios.length) * 100);
}

// ─── Weight trend (linear regression slope in kg/week) ─────────────────────────

function computeWeeklyWeightTrend(logs: { date: string; weightKg: number }[]): number | null {
  if (logs.length < 3) return null;
  const sorted = [...logs].sort((a, b) => a.date.localeCompare(b.date));
  const n = sorted.length;
  const xs = sorted.map((_, i) => i);
  const ys = sorted.map((l) => l.weightKg);
  const xMean = xs.reduce((a, b) => a + b, 0) / n;
  const yMean = ys.reduce((a, b) => a + b, 0) / n;
  const num = xs.reduce((sum, x, i) => sum + (x - xMean) * (ys[i] - yMean), 0);
  const den = xs.reduce((sum, x) => sum + (x - xMean) ** 2, 0);
  if (den === 0) return null;
  const slopePerEntry = num / den;
  // Convert to kg/week: entries span from first to last date
  const firstDate = new Date(sorted[0].date).getTime();
  const lastDate = new Date(sorted[n - 1].date).getTime();
  const daySpan = (lastDate - firstDate) / (1000 * 60 * 60 * 24);
  if (daySpan < 3) return null;
  const entriesPerWeek = ((n - 1) / daySpan) * 7;
  return Math.round(slopePerEntry * entriesPerWeek * 100) / 100;
}

function exportSessionsCSV(sessions: WorkoutSession[], allLogs: ExerciseLog[], unit: "kg" | "lb") {
  const rows: string[] = [
    "Date,Split Day,Duration (min),Volume,Exercises,Exercise,Set,Weight,Reps,e1RM",
  ];

  for (const session of sessions) {
    const vol = unit === "lb"
      ? `${Math.round(session.totalVolumeKg * 2.20462)} lb`
      : `${session.totalVolumeKg} kg`;

    const sessionLogs = allLogs.filter((l) => l.sessionId === session.id);

    if (sessionLogs.length === 0) {
      rows.push([
        session.date,
        `"${session.splitDay}"`,
        session.durationMinutes,
        vol,
        session.exercisesCompleted.length,
        "", "", "", "", "",
      ].join(","));
    } else {
      for (const log of sessionLogs) {
        const exName = exerciseMap[log.exerciseId]?.name ?? log.exerciseId;
        for (const s of log.sets) {
          const w = unit === "lb" ? Math.round(s.weightUsed * 2.20462 * 10) / 10 : s.weightUsed;
          const e1rm = estimateOneRepMax(s.weightUsed, s.repsCompleted);
          const e1rmDisplay = unit === "lb" ? Math.round(e1rm * 2.20462 * 10) / 10 : Math.round(e1rm * 10) / 10;
          rows.push([
            session.date,
            `"${session.splitDay}"`,
            session.durationMinutes,
            vol,
            session.exercisesCompleted.length,
            `"${exName}"`,
            s.setNumber,
            w,
            s.repsCompleted,
            e1rmDisplay,
          ].join(","));
        }
      }
    }
  }

  const blob = new Blob([rows.join("\n")], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `workouts-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function ProgressPage() {
  const { recentSessions, allExerciseLogs, sessionDates, deleteSession, editSessionNotes } = useSessionStore();
  const { settings } = useSettingsStore();
  const { profile, accessToken } = useUserStore();

  const { bodyWeightLogs, addWeightLog, bodyMeasurementLogs, addMeasurementLog } = useProgressStore();
  const { getLast: getNutritionLast } = useNutritionStore();
  const nutritionLast7 = getNutritionLast(7);

  const [period, setPeriod] = useState<Period>(PERIODS[1]); // default 8W
  const [selectedSection, setSelectedSection] = useState<"volume" | "records" | "body" | "insights">("volume");
  const [volumeView, setVolumeView] = useState<"total" | "muscle">("total");
  const [selectedExerciseId, setSelectedExerciseId] = useState<string | null>(null);
  const [selectedSession, setSelectedSession] = useState<WorkoutSession | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [weightInput, setWeightInput] = useState("");
  const [showMeasureForm, setShowMeasureForm] = useState(false);
  const [measureInputs, setMeasureInputs] = useState<Record<string, string>>({});
  const [sessionDayFilter, setSessionDayFilter] = useState<string | null>(null);
  const [showAllSessions, setShowAllSessions] = useState(false);
  const [editingNotes, setEditingNotes] = useState(false);
  const [notesInput, setNotesInput] = useState("");

  // Reset delete confirm whenever a different session is opened
  const openSession = (s: WorkoutSession | null) => {
    setSelectedSession(s);
    setDeleteConfirm(false);
    setEditingNotes(false);
    setNotesInput(s?.sessionNotes ?? "");
  };

  const unit = (settings.weightUnit ?? profile?.units ?? "kg") as "kg" | "lb";

  function handleDeleteSession(session: WorkoutSession) {
    deleteSession(session.id);
    if (accessToken) sessionsApi.delete(accessToken, session.id).catch(() => {});
    setSelectedSession(null);
    setDeleteConfirm(false);
  }

  async function handleShareSession(session: WorkoutSession) {
    const text = [
      `Workout: ${session.splitDay}`,
      `Date: ${new Date(session.date).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}`,
      `Exercises: ${session.exercisesCompleted.length}`,
      `Volume: ${formatVolume(session.totalVolumeKg, unit)}`,
      `Duration: ${session.durationMinutes}m`,
    ].join("\n");

    if (typeof navigator !== "undefined" && "share" in navigator) {
      try {
        await navigator.share({ title: `Workout — ${session.splitDay}`, text });
        return;
      } catch {
        // fall through to clipboard
      }
    }
    navigator.clipboard?.writeText(text).catch(() => {});
  }

  function handleLogWeight() {
    const val = parseFloat(weightInput);
    if (isNaN(val) || val <= 0) return;
    const kg = unit === "lb" ? val / 2.20462 : val;
    const rounded = Math.round(kg * 10) / 10;
    addWeightLog(rounded);
    if (accessToken) progressApi.logWeight(accessToken, rounded).catch(() => {});
    setWeightInput("");
  }

  const todayWeight = bodyWeightLogs[0]?.date === new Date().toISOString().split("T")[0]
    ? bodyWeightLogs[0]
    : null;

  function handleLogMeasurements() {
    const parsed: BodyMeasurements = {};
    const fields: (keyof BodyMeasurements)[] = ["waistCm", "chestCm", "hipsCm", "leftArmCm", "rightArmCm", "leftThighCm"];
    fields.forEach((f) => {
      const v = parseFloat(measureInputs[f] ?? "");
      if (!isNaN(v) && v > 0) (parsed as Record<string, number>)[f] = v;
    });
    if (Object.keys(parsed).length === 0) return;
    addMeasurementLog(parsed);
    setMeasureInputs({});
    setShowMeasureForm(false);
  }

  const currentSplit = profile?.splitId ? getSplitById(profile.splitId) : null;
  const consistencyScore = useMemo(
    () => computeConsistency(recentSessions, currentSplit?.daysPerWeek ?? 3),
    [recentSessions, currentSplit?.daysPerWeek]
  );
  const weeklyWeightTrend = useMemo(
    () => computeWeeklyWeightTrend(bodyWeightLogs),
    [bodyWeightLogs]
  );

  // Filter sessions to selected period
  const cutoff = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - period.weeks * 7);
    d.setHours(0, 0, 0, 0);
    return d;
  }, [period]);

  const periodSessions = useMemo(
    () => recentSessions.filter((s) => new Date(s.date) >= cutoff),
    [recentSessions, cutoff]
  );

  const splitDayNames = useMemo(() => {
    const names = Array.from(new Set(periodSessions.map((s) => s.splitDay))).sort();
    return names;
  }, [periodSessions]);

  const filteredHistorySessions = useMemo(
    () => sessionDayFilter
      ? periodSessions.filter((s) => s.splitDay === sessionDayFilter)
      : periodSessions,
    [periodSessions, sessionDayFilter]
  );

  const weeklyVolume = useMemo(
    () => buildWeeklyVolume(recentSessions, period.weeks),
    [recentSessions, period.weeks]
  );

  const prs = useMemo(
    () => computePRs(allExerciseLogs, unit),
    [allExerciseLogs, unit]
  );

  const oneRMHistory = useMemo(() => {
    if (!selectedExerciseId) return [];
    return buildOneRMHistory(selectedExerciseId, allExerciseLogs, sessionDates);
  }, [selectedExerciseId, allExerciseLogs, sessionDates]);

  const selectedExerciseName = selectedExerciseId
    ? exerciseMap[selectedExerciseId]?.name ?? selectedExerciseId
    : null;

  // PR milestones: chronological entries where a new all-time best e1RM was achieved
  const prMilestones = useMemo(() => {
    if (!oneRMHistory.length) return [];
    const milestones: typeof oneRMHistory = [];
    let best = 0;
    for (const point of oneRMHistory) {
      if (point.estimated1RM > best) {
        best = point.estimated1RM;
        milestones.push(point);
      }
    }
    return milestones.reverse(); // newest first
  }, [oneRMHistory]);

  // Build e1RM map for strength standards
  const e1RMByExercise = useMemo(() => {
    const map: Record<string, number> = {};
    for (const pr of prs) {
      map[pr.exerciseId] = pr.estimated1RM;
    }
    return map;
  }, [prs]);

  // Sparkline data: last 8 estimated 1RM values per exercise, chronological
  const sparklines = useMemo(() => {
    const byExercise: Record<string, { date: string; e1rm: number }[]> = {};
    for (const log of allExerciseLogs) {
      if (!log.sets.length) continue;
      const best = Math.max(...log.sets.map((s) => estimateOneRepMax(s.weightUsed, s.repsCompleted)));
      if (!byExercise[log.exerciseId]) byExercise[log.exerciseId] = [];
      byExercise[log.exerciseId].push({ date: log.loggedAt.split("T")[0], e1rm: Math.round(best * 10) / 10 });
    }
    const result: Record<string, number[]> = {};
    for (const [id, entries] of Object.entries(byExercise)) {
      const sorted = entries.sort((a, b) => a.date.localeCompare(b.date)).slice(-8);
      if (sorted.length >= 2) result[id] = sorted.map((e) => e.e1rm);
    }
    return result;
  }, [allExerciseLogs]);

  const volumeLeaders = useMemo(() => {
    const totals: Record<string, number> = {};
    for (const log of allExerciseLogs) {
      const vol = log.sets.reduce((a, s) => a + s.weightUsed * s.repsCompleted, 0);
      if (vol > 0) totals[log.exerciseId] = (totals[log.exerciseId] ?? 0) + vol;
    }
    return Object.entries(totals)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 8)
      .map(([id, kg]) => ({ id, name: exerciseMap[id]?.name ?? id, kg }));
  }, [allExerciseLogs]);

  const userBodyweightKg = bodyWeightLogs[0]?.weightKg ?? profile?.weightKg ?? 0;

  return (
    <div className="flex flex-col min-h-full pb-24 page-enter">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="px-5 pt-14 pb-5"
      >
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">Progress</h1>
          <div className="flex items-center gap-2">
            <NotesJournalSheet sessions={recentSessions} />
            {recentSessions.length > 0 && (
              <button
                onClick={() => exportSessionsCSV(recentSessions, allExerciseLogs, unit)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-[10px] bg-white/6 border border-white/10 text-white/40 text-xs font-semibold hover:text-white/70 hover:border-white/20 transition-colors"
              >
                <Download size={12} />
                Export
              </button>
            )}
          </div>
        </div>

        {/* Period tabs */}
        <div className="flex gap-2 mt-4">
          {PERIODS.map((p) => (
            <button
              key={p.label}
              onClick={() => { setPeriod(p); setShowAllSessions(false); }}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200",
                period.label === p.label
                  ? "bg-trainer-indigo text-white"
                  : "bg-white/8 text-white/45 hover:text-white"
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
      </motion.div>

      <div className="flex flex-col gap-5 px-5">
        {/* Summary stats */}
        <SummaryStats sessions={periodSessions} unit={unit} />

        {/* Section tabs */}
        <div className="flex gap-1 p-1 bg-trainer-elevated rounded-[12px]">
          {(["volume", "records", "body", "insights"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setSelectedSection(tab)}
              className={cn(
                "flex-1 py-2 text-xs font-semibold rounded-[8px] transition-all duration-200 capitalize",
                selectedSection === tab
                  ? "bg-trainer-surface text-white"
                  : "text-white/40 hover:text-white/70"
              )}
            >
              {tab === "volume" ? "Volume" : tab === "records" ? "Records" : tab === "body" ? "Body" : "Insights"}
            </button>
          ))}
        </div>

        {/* Volume section */}
        {selectedSection === "volume" && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col gap-4"
          >
            <div className="bg-trainer-surface border border-white/8 rounded-[16px] p-4">
              <div className="flex items-center justify-between mb-4">
                <p className="text-xs text-white/35 uppercase tracking-widest font-semibold">
                  {volumeView === "total" ? `Weekly Volume (${unit})` : `By Muscle Group (${unit})`}
                </p>
                <div className="flex gap-1 p-0.5 bg-trainer-elevated rounded-[8px]">
                  {(["total", "muscle"] as const).map((v) => (
                    <button
                      key={v}
                      onClick={() => setVolumeView(v)}
                      className={cn(
                        "px-2.5 py-1 rounded-[6px] text-[11px] font-semibold transition-all",
                        volumeView === v ? "bg-trainer-surface text-white" : "text-white/35 hover:text-white/60"
                      )}
                    >
                      {v === "total" ? "Weekly" : "Muscle"}
                    </button>
                  ))}
                </div>
              </div>
              {volumeView === "total" ? (
                <VolumeChart data={weeklyVolume} unit={unit} />
              ) : (
                <MuscleVolumeChart sessions={periodSessions} allLogs={allExerciseLogs} unit={unit} />
              )}
            </div>

            {/* Training load + ACWR */}
            <TrainingLoadCard sessions={recentSessions} unit={unit} />

            {/* Recent sessions list */}
            <div className="bg-trainer-surface border border-white/8 rounded-[16px] p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs text-white/35 uppercase tracking-widest font-semibold">
                  Session History
                </p>
                {sessionDayFilter && (
                  <button
                    onClick={() => { setSessionDayFilter(null); setShowAllSessions(false); }}
                    className="text-[10px] text-trainer-indigo font-semibold hover:text-white transition-colors"
                  >
                    Clear filter
                  </button>
                )}
              </div>
              {splitDayNames.length > 1 && (
                <div className="flex gap-1.5 flex-wrap mb-3">
                  {splitDayNames.map((name) => (
                    <button
                      key={name}
                      onClick={() => { setSessionDayFilter(sessionDayFilter === name ? null : name); setShowAllSessions(false); }}
                      className={cn(
                        "px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all border",
                        sessionDayFilter === name
                          ? "bg-trainer-indigo/20 border-trainer-indigo/40 text-trainer-indigo"
                          : "bg-white/5 border-white/10 text-white/40 hover:text-white/65"
                      )}
                    >
                      {name}
                    </button>
                  ))}
                </div>
              )}
              {filteredHistorySessions.length === 0 ? (
                <p className="text-sm text-white/25 text-center py-6">
                  No sessions in this period
                </p>
              ) : (
                <>
                <div className="flex flex-col divide-y divide-white/5">
                  {filteredHistorySessions.slice(0, showAllSessions ? filteredHistorySessions.length : 10).map((session, i) => {
                    const intensity = computeSessionIntensity(session, e1RMByExercise);
                    const intensityColor =
                      intensity == null ? null :
                      intensity >= 85 ? "text-trainer-gold" :
                      intensity >= 70 ? "text-trainer-indigo" :
                      intensity >= 55 ? "text-amber-400" : "text-white/30";
                    return (
                      <motion.button
                        key={session.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.04 }}
                        onClick={() => openSession(session)}
                        className="flex items-center gap-3 py-3 first:pt-0 last:pb-0 w-full text-left"
                      >
                        <div className="w-8 h-8 rounded-[8px] bg-trainer-indigo/12 flex items-center justify-center shrink-0">
                          <Dumbbell size={14} className="text-trainer-indigo/60" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-white/80 truncate">
                            {session.splitDay}
                          </p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <p className="text-xs text-white/30">
                              {new Date(session.date).toLocaleDateString("en-US", {
                                weekday: "short",
                                month: "short",
                                day: "numeric",
                              })}
                            </p>
                            {session.rating != null && session.rating > 0 && (
                              <span className="text-[10px] text-trainer-gold leading-none">
                                {"★".repeat(session.rating)}{"☆".repeat(5 - session.rating)}
                              </span>
                            )}
                          </div>
                          {(() => {
                            const MUSCLE_ABBR: Record<string, string> = {
                              "pectoralis-major-upper": "Chest", "pectoralis-major-lower": "Chest", "pectoralis-minor": "Chest",
                              "latissimus-dorsi": "Back", "rhomboids": "Back", "teres-major": "Back",
                              "anterior-deltoid": "Shoulders", "lateral-deltoid": "Shoulders", "posterior-deltoid": "Shoulders",
                              "biceps-brachii-long": "Biceps", "biceps-brachii-short": "Biceps", "brachialis": "Biceps",
                              "triceps-long": "Triceps", "triceps-lateral": "Triceps", "triceps-medial": "Triceps",
                              "quadriceps-rectus-femoris": "Quads", "quadriceps-vastus-lateralis": "Quads", "quadriceps-vastus-medialis": "Quads",
                              "gluteus-maximus": "Glutes", "gluteus-medius": "Glutes",
                              "hamstrings-biceps-femoris": "Hams", "hamstrings-semimembranosus": "Hams",
                              "rectus-abdominis-upper": "Core", "rectus-abdominis-lower": "Core", "obliques": "Core",
                              "gastrocnemius": "Calves", "soleus": "Calves",
                            };
                            const seen = new Set<string>();
                            const groups: string[] = [];
                            for (const log of session.exercisesCompleted) {
                              const ex = exerciseMap[log.exerciseId];
                              if (!ex) continue;
                              for (const m of ex.primaryMuscles) {
                                const label = MUSCLE_ABBR[m] ?? (m.split("-")[0]!.charAt(0).toUpperCase() + m.split("-")[0]!.slice(1));
                                if (!seen.has(label)) { seen.add(label); groups.push(label); }
                              }
                            }
                            const chips = groups.slice(0, 3);
                            if (!chips.length) return null;
                            return (
                              <div className="flex items-center gap-1 mt-0.5">
                                {chips.map((g, idx) => (
                                  <span key={g} className="text-[9px] text-white/28 font-medium">
                                    {idx > 0 && <span className="mr-0.5 text-white/15">·</span>}{g}
                                  </span>
                                ))}
                              </div>
                            );
                          })()}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <div className="flex flex-col items-end gap-0.5">
                            <span className="text-xs font-semibold text-white/65 tabular-nums">
                              {formatVolume(session.totalVolumeKg, unit)}
                            </span>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] text-white/30 tabular-nums">
                                {session.durationMinutes}m
                              </span>
                              {intensity !== null && intensityColor && (
                                <span className={`text-[10px] font-bold tabular-nums ${intensityColor}`}>
                                  {intensity}%
                                </span>
                              )}
                            </div>
                          </div>
                          <ChevronRight size={13} className="text-white/20" />
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
                {filteredHistorySessions.length > 10 && (
                  <button
                    onClick={() => setShowAllSessions((v) => !v)}
                    className="w-full mt-3 pt-3 border-t border-white/5 text-xs font-semibold text-trainer-indigo/70 hover:text-trainer-indigo transition-colors text-center"
                  >
                    {showAllSessions
                      ? "Show less"
                      : `Show ${filteredHistorySessions.length - 10} more`}
                  </button>
                )}
                </>
              )}
            </div>

            {/* Monthly workout calendar */}
            <div className="bg-trainer-surface border border-white/8 rounded-[16px] p-4">
              <p className="text-xs text-white/35 uppercase tracking-widest font-semibold mb-1">
                Training Calendar
              </p>
              <WorkoutCalendar sessions={recentSessions} />
            </div>

            {/* 90-day activity heatmap */}
            <ActivityHeatmap sessions={recentSessions} />
          </motion.div>
        )}

        {/* Records section */}
        {selectedSection === "records" && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col gap-4"
          >
            {/* 1RM progression chart */}
            {selectedExerciseId && (
              <div className="bg-trainer-surface border border-white/8 rounded-[16px] p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs text-white/35 uppercase tracking-widest font-semibold">
                    e1RM Progression
                  </p>
                  <button
                    onClick={() => setSelectedExerciseId(null)}
                    className="text-xs text-white/30 hover:text-white/60 transition-colors"
                  >
                    Close
                  </button>
                </div>
                <p className="text-sm font-semibold text-white/70 mb-3 capitalize">
                  {selectedExerciseName?.replace(/-/g, " ")}
                </p>
                <OneRMChart
                  data={oneRMHistory}
                  unit={unit}
                  exerciseName={selectedExerciseName ?? ""}
                />

                {prMilestones.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-white/6">
                    <p className="text-[10px] text-white/25 uppercase tracking-widest font-semibold mb-2">
                      PR Milestones
                    </p>
                    <div className="flex flex-col gap-1.5">
                      {prMilestones.map((m, idx) => (
                        <motion.div
                          key={m.date}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          className="flex items-center justify-between"
                        >
                          <div className="flex items-center gap-2">
                            <div className={cn(
                              "w-1.5 h-1.5 rounded-full shrink-0",
                              idx === 0 ? "bg-trainer-gold" : "bg-trainer-indigo/50"
                            )} />
                            <span className="text-[11px] text-white/40">{m.date}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-white/70 tabular-nums">
                              {m.estimated1RM}{unit}
                            </span>
                            <span className="text-[10px] text-white/25 tabular-nums">
                              {m.topWeight}{unit} × {m.topReps}
                            </span>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Strength standards */}
            <StrengthStandardsCard
              userBodyweightKg={userBodyweightKg}
              gender={profile?.gender ?? "male"}
              e1RMByExercise={e1RMByExercise}
            />

            {/* PR list */}
            <div className="bg-trainer-surface border border-white/8 rounded-[16px] p-4">
              <p className="text-xs text-white/35 uppercase tracking-widest font-semibold mb-4">
                Personal Records
              </p>
              <PRCard
                prs={prs}
                onSelectExercise={(id) =>
                  setSelectedExerciseId(selectedExerciseId === id ? null : id)
                }
                selectedExerciseId={selectedExerciseId}
                sparklines={sparklines}
              />
            </div>

            {/* Volume leaders */}
            {volumeLeaders.length >= 3 && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-trainer-surface border border-white/8 rounded-[16px] p-4"
              >
                <div className="flex items-center gap-2 mb-4">
                  <BarChart3 size={13} className="text-trainer-indigo" />
                  <p className="text-xs text-white/35 uppercase tracking-widest font-semibold">
                    Volume Leaders
                  </p>
                </div>
                <div className="flex flex-col gap-3">
                  {volumeLeaders.map((row, i) => {
                    const displayKg = unit === "lb" ? row.kg * 2.20462 : row.kg;
                    const pct = (row.kg / volumeLeaders[0].kg) * 100;
                    const label = displayKg >= 1000
                      ? `${(displayKg / 1000).toFixed(1)}k ${unit}`
                      : `${Math.round(displayKg)} ${unit}`;
                    return (
                      <motion.div
                        key={row.id}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="text-[10px] text-white/25 tabular-nums w-4 shrink-0">{i + 1}</span>
                            <span className="text-xs font-semibold text-white/75 truncate">{row.name}</span>
                          </div>
                          <span className="text-[10px] font-bold text-white/45 tabular-nums shrink-0 ml-2">
                            {label}
                          </span>
                        </div>
                        <div className="h-1.5 bg-white/6 rounded-full overflow-hidden">
                          <motion.div
                            className={i === 0 ? "h-full rounded-full bg-trainer-gold" : "h-full rounded-full bg-trainer-indigo/60"}
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ duration: 0.5, ease: "easeOut", delay: i * 0.05 }}
                          />
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
                <p className="text-[9px] text-white/15 mt-3 text-right">Total weight × reps across all sessions</p>
              </motion.div>
            )}
          </motion.div>
        )}

        {/* ── Body section ── */}
        {selectedSection === "body" && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col gap-4"
          >
            {/* TDEE / BMR card */}
            {profile?.weightKg && profile?.heightCm && profile?.age && profile?.gender && profile?.activityLevel && (
              <TDEECard
                weightKg={bodyWeightLogs[0]?.weightKg ?? profile.weightKg}
                heightCm={profile.heightCm}
                age={profile.age}
                gender={profile.gender}
                activityLevel={profile.activityLevel as ActivityLevel}
              />
            )}

            {/* Consistency + pace cards */}
            <div className="grid grid-cols-2 gap-3">
              {/* Consistency score */}
              <div className="bg-trainer-surface border border-white/8 rounded-[16px] p-4">
                <div className="flex items-center gap-1.5 mb-2">
                  <Target size={12} className="text-trainer-indigo" />
                  <p className="text-[10px] text-white/35 font-semibold uppercase tracking-widest">Consistency</p>
                </div>
                <p className={cn(
                  "text-2xl font-bold tabular-nums",
                  consistencyScore >= 80 ? "text-trainer-success" :
                  consistencyScore >= 50 ? "text-amber-400" : "text-red-400"
                )}>
                  {consistencyScore}%
                </p>
                <p className="text-[10px] text-white/30 mt-1">last 28 days</p>
              </div>

              {/* Weight pace */}
              <div className="bg-trainer-surface border border-white/8 rounded-[16px] p-4">
                <div className="flex items-center gap-1.5 mb-2">
                  <Flame size={12} className="text-orange-400" />
                  <p className="text-[10px] text-white/35 font-semibold uppercase tracking-widest">Pace</p>
                </div>
                {weeklyWeightTrend !== null ? (
                  <>
                    <p className={cn(
                      "text-2xl font-bold tabular-nums",
                      weeklyWeightTrend < 0 ? "text-trainer-success" :
                      weeklyWeightTrend === 0 ? "text-white/50" : "text-blue-400"
                    )}>
                      {weeklyWeightTrend > 0 ? "+" : ""}{weeklyWeightTrend} {unit}/wk
                    </p>
                    <p className="text-[10px] text-white/30 mt-1">
                      {weeklyWeightTrend < -0.05 ? "losing weight" :
                       weeklyWeightTrend > 0.05 ? "gaining weight" : "maintaining"}
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-white/25 mt-1">Log weight 3+ days</p>
                )}
              </div>
            </div>

            {/* Log weight card */}
            <div className="bg-trainer-surface border border-white/8 rounded-[16px] p-4">
              <p className="text-xs text-white/35 uppercase tracking-widest font-semibold mb-4">
                Today&apos;s Weight
              </p>
              {todayWeight && (
                <p className="text-2xl font-bold text-white tabular-nums mb-3">
                  {unit === "lb"
                    ? `${Math.round(todayWeight.weightKg * 2.20462 * 10) / 10} lb`
                    : `${todayWeight.weightKg} kg`}
                  <span className="text-sm font-normal text-white/35 ml-2">logged today</span>
                </p>
              )}
              <div className="flex gap-2">
                <input
                  type="number"
                  step="0.1"
                  min="20"
                  max="500"
                  placeholder={`Weight in ${unit}`}
                  value={weightInput}
                  onChange={(e) => setWeightInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleLogWeight()}
                  className="flex-1 bg-trainer-elevated border border-white/10 rounded-[10px] px-3 py-2.5 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-trainer-success/50 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
                />
                <button
                  onClick={handleLogWeight}
                  disabled={!weightInput || isNaN(parseFloat(weightInput))}
                  className="px-4 py-2.5 bg-trainer-success/15 border border-trainer-success/30 text-trainer-success text-sm font-semibold rounded-[10px] transition-colors hover:bg-trainer-success/25 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Log
                </button>
              </div>
            </div>

            {/* Body weight chart */}
            {(() => {
              const targets = profile?.nutritionTargets;
              const currentKg = bodyWeightLogs[0]?.weightKg;
              const surplusKcal = targets?.deficitOrSurplus ?? 0;
              const hasGoal = !!targets && !!currentKg && bodyWeightLogs.length >= 3 && Math.abs(surplusKcal) >= 50;
              const weeklyKg = hasGoal ? (surplusKcal / 100) * 0.111 : 0;
              const projectedGoalKg = hasGoal ? Math.round((currentKg! + weeklyKg * 12) * 10) / 10 : undefined;
              return (
                <>
                  <div className="bg-trainer-surface border border-white/8 rounded-[16px] p-4">
                    <p className="text-xs text-white/35 uppercase tracking-widest font-semibold mb-4">
                      Weight Trend ({unit})
                    </p>
                    <BodyWeightChart data={bodyWeightLogs} unit={unit} goalWeightKg={projectedGoalKg} />
                  </div>
                  {projectedGoalKg !== undefined && (
                    <GoalWeightCard
                      logs={bodyWeightLogs}
                      goalWeightKg={projectedGoalKg}
                      unit={unit}
                    />
                  )}
                </>
              );
            })()}

            {/* Body measurements */}
            <div className="bg-trainer-surface border border-white/8 rounded-[16px] p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Ruler size={14} className="text-trainer-indigo" />
                  <p className="text-xs text-white/35 uppercase tracking-widest font-semibold">
                    Measurements (cm)
                  </p>
                </div>
                <button
                  onClick={() => setShowMeasureForm((v) => !v)}
                  className="flex items-center gap-1.5 text-xs font-semibold text-trainer-indigo hover:text-white transition-colors"
                >
                  {showMeasureForm ? <ChevronUp size={13} /> : <Plus size={13} />}
                  {showMeasureForm ? "Cancel" : "Log"}
                </button>
              </div>

              <AnimatePresence>
                {showMeasureForm && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      {([
                        ["waistCm", "Waist"],
                        ["neckCm", "Neck"],
                        ["chestCm", "Chest"],
                        ["hipsCm", "Hips"],
                        ["leftArmCm", "L. Arm"],
                        ["rightArmCm", "R. Arm"],
                        ["leftThighCm", "Thigh"],
                      ] as const).map(([field, label]) => (
                        <div key={field}>
                          <p className="text-[10px] text-white/35 mb-1">{label}</p>
                          <input
                            type="number"
                            step="0.1"
                            min="1"
                            max="300"
                            placeholder="cm"
                            value={measureInputs[field] ?? ""}
                            onChange={(e) => setMeasureInputs((prev) => ({ ...prev, [field]: e.target.value }))}
                            className="w-full bg-trainer-elevated border border-white/10 rounded-[8px] px-2.5 py-2 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-trainer-indigo/40 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
                          />
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={handleLogMeasurements}
                      className="w-full py-2.5 bg-trainer-indigo/15 border border-trainer-indigo/30 text-trainer-indigo text-sm font-semibold rounded-[10px] hover:bg-trainer-indigo/25 transition-colors"
                    >
                      Save Measurements
                    </button>
                    <div className="border-t border-white/5 mt-4 mb-2" />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Latest measurements */}
              {bodyMeasurementLogs.length > 0 ? (
                <div className="space-y-3">
                  {bodyMeasurementLogs.slice(0, 3).map((entry, i) => {
                    const m = entry.measurements;
                    const prevM = bodyMeasurementLogs[i + 1]?.measurements ?? null;
                    const fields = Object.entries(m).filter(([, v]) => v !== undefined) as [string, number][];
                    const measureLabels: Record<string, string> = {
                      waistCm: "Waist", neckCm: "Neck", chestCm: "Chest", hipsCm: "Hips",
                      leftArmCm: "L. Arm", rightArmCm: "R. Arm", leftThighCm: "Thigh",
                    };
                    return (
                      <div key={entry.date} className={cn(i > 0 && "border-t border-white/5 pt-3")}>
                        <p className="text-[10px] text-white/30 mb-2">
                          {new Date(entry.date).toLocaleDateString("en-US", {
                            month: "short", day: "numeric", year: "numeric"
                          })}
                        </p>
                        <div className="flex flex-wrap gap-x-4 gap-y-1.5">
                          {fields.map(([key, val]) => {
                            const prev = prevM?.[key as keyof BodyMeasurements];
                            const delta = prev !== undefined ? Math.round((val - prev) * 10) / 10 : null;
                            return (
                              <div key={key} className="flex items-baseline gap-1">
                                <span className="text-[10px] text-white/35">{measureLabels[key] ?? key}:</span>
                                <span className="text-xs font-semibold text-white/70 tabular-nums">{val} cm</span>
                                {delta !== null && delta !== 0 && (
                                  <span className="text-[9px] font-semibold tabular-nums text-white/35">
                                    {delta > 0 ? "+" : ""}{delta}
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-white/25 text-center py-4">
                  No measurements logged yet
                </p>
              )}
            </div>

            {/* Measurement trend chart */}
            {bodyMeasurementLogs.length >= 2 && (
              <MeasurementTrendChart logs={bodyMeasurementLogs} />
            )}

            {/* Body fat estimator */}
            {(() => {
              const latestMeasure = bodyMeasurementLogs[0]?.measurements;
              if (!latestMeasure?.waistCm || !latestMeasure?.neckCm || !profile?.heightCm || !profile?.gender) return null;
              const bf = estimateNavyBodyFat(
                profile.gender,
                profile.heightCm,
                latestMeasure.waistCm,
                latestMeasure.neckCm,
                latestMeasure.hipsCm
              );
              if (bf === null || bf < 2 || bf > 60) return null;
              const { label, color } = bfCategory(bf, profile.gender);
              return (
                <div className="bg-trainer-surface border border-white/8 rounded-[16px] p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs text-white/35 uppercase tracking-widest font-semibold mb-1">
                        Est. Body Fat
                      </p>
                      <div className="flex items-baseline gap-2">
                        <p className={`text-3xl font-bold tabular-nums ${color}`}>{bf}%</p>
                        <span className={`text-sm font-semibold ${color}`}>{label}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-white/20 leading-relaxed max-w-[140px]">
                        US Navy method · from latest measurements
                      </p>
                      <p className="text-[10px] text-white/20 mt-1">
                        {profile.gender === "female" ? "Needs: waist + hip + neck" : "Needs: waist + neck"}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Body fat % trend */}
            {bodyMeasurementLogs.length >= 2 && profile?.heightCm && profile?.gender && (
              <BodyFatTrendChart
                logs={bodyMeasurementLogs}
                gender={profile.gender}
                heightCm={profile.heightCm}
              />
            )}

            {/* Weight log history */}
            {bodyWeightLogs.length > 0 && (
              <div className="bg-trainer-surface border border-white/8 rounded-[16px] p-4">
                <p className="text-xs text-white/35 uppercase tracking-widest font-semibold mb-3">
                  Weight History
                </p>
                <div className="flex flex-col divide-y divide-white/5">
                  {bodyWeightLogs.slice(0, 14).map((entry) => (
                    <div key={entry.date} className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0">
                      <p className="text-sm text-white/50">
                        {new Date(entry.date).toLocaleDateString("en-US", {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                        })}
                      </p>
                      <span className="text-sm font-semibold text-white/80 tabular-nums">
                        {unit === "lb"
                          ? `${Math.round(entry.weightKg * 2.20462 * 10) / 10} lb`
                          : `${entry.weightKg} kg`}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Nutrition 7-day chart */}
            {nutritionLast7.length > 0 && (
              <NutritionHistoryChart
                logs={nutritionLast7}
                targetCalories={profile?.nutritionTargets?.dailyCalories ?? 0}
                targetProteinG={profile?.nutritionTargets?.proteinG ?? 0}
              />
            )}
          </motion.div>
        )}
        {/* ── Insights section ── */}
        {selectedSection === "insights" && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col gap-4"
          >
            <InsightsPanel sessions={recentSessions} allLogs={allExerciseLogs} unit={unit} />
            {currentSplit && (
              <SplitAdherenceCard sessions={recentSessions} daysPerWeek={currentSplit.daysPerWeek} />
            )}
            <SessionRatingChart sessions={recentSessions} />
            <MuscleVolumeTargetsCard sessions={recentSessions} allLogs={allExerciseLogs} />
            <StagnationCard />
            <WeeklyVolumeCard />
            <MuscleBalanceChart sessions={periodSessions} allLogs={allExerciseLogs} />
            <SleepPerformanceChart sessions={recentSessions} unit={unit} />
          </motion.div>
        )}
      </div>

      {/* ── Session detail modal ── */}
      <AnimatePresence>
        {selectedSession && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => openSession(null)}
              className="fixed inset-0 bg-black/60 z-40"
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 380, damping: 40 }}
              className="fixed bottom-0 inset-x-0 z-50 bg-trainer-elevated border-t border-white/10 rounded-t-[24px] max-h-[80vh] flex flex-col"
            >
              {/* Sheet header */}
              <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-white/8 shrink-0">
                <div>
                  <p className="text-base font-bold text-white">{selectedSession.splitDay}</p>
                  <p className="text-xs text-white/35 mt-0.5">
                    {new Date(selectedSession.date).toLocaleDateString("en-US", {
                      weekday: "long",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleShareSession(selectedSession)}
                    className="w-8 h-8 rounded-full bg-white/8 flex items-center justify-center text-white/50 hover:text-white transition-colors"
                    aria-label="Share session"
                  >
                    <Share2 size={14} />
                  </button>
                  {!deleteConfirm ? (
                    <button
                      onClick={() => setDeleteConfirm(true)}
                      className="w-8 h-8 rounded-full bg-white/8 flex items-center justify-center text-white/50 hover:text-trainer-danger transition-colors"
                      aria-label="Delete session"
                    >
                      <Trash2 size={14} />
                    </button>
                  ) : (
                    <button
                      onClick={() => handleDeleteSession(selectedSession)}
                      className="flex items-center gap-1.5 px-3 h-8 rounded-full bg-trainer-danger/15 border border-trainer-danger/30 text-trainer-danger text-xs font-bold transition-colors hover:bg-trainer-danger/25"
                    >
                      Confirm delete
                    </button>
                  )}
                  <button
                    onClick={() => { setSelectedSession(null); setDeleteConfirm(false); }}
                    className="w-8 h-8 rounded-full bg-white/8 flex items-center justify-center text-white/50 hover:text-white transition-colors"
                  >
                    <X size={15} />
                  </button>
                </div>
              </div>

              {/* Session stats */}
              <div className="flex gap-4 px-5 py-3 border-b border-white/5 shrink-0">
                <div className="flex items-center gap-1.5">
                  <TrendingUp size={13} className="text-trainer-success" />
                  <span className="text-xs font-semibold text-white/65 tabular-nums">
                    {formatVolume(selectedSession.totalVolumeKg, unit)}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock size={13} className="text-trainer-warning" />
                  <span className="text-xs font-semibold text-white/65 tabular-nums">
                    {selectedSession.durationMinutes}m
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Dumbbell size={13} className="text-trainer-indigo" />
                  <span className="text-xs font-semibold text-white/65">
                    {selectedSession.exercisesCompleted.length} exercises
                  </span>
                </div>
                {selectedSession.durationMinutes > 0 && selectedSession.totalVolumeKg > 0 && (
                  <div className="flex items-center gap-1.5">
                    <Zap size={13} className="text-white/30" />
                    <span className="text-xs font-semibold text-white/45 tabular-nums">
                      {(unit === "lb"
                        ? (selectedSession.totalVolumeKg * 2.20462) / selectedSession.durationMinutes
                        : selectedSession.totalVolumeKg / selectedSession.durationMinutes
                      ).toFixed(1)}{unit}/min
                    </span>
                  </div>
                )}
                {(() => {
                  const rpeSets = selectedSession.exercisesCompleted
                    .flatMap((ex) => ex.sets)
                    .filter((s) => s.rpe !== undefined && s.rpe > 0);
                  if (rpeSets.length < 2) return null;
                  const avg = Math.round((rpeSets.reduce((a, s) => a + (s.rpe ?? 0), 0) / rpeSets.length) * 10) / 10;
                  return (
                    <div className="flex items-center gap-1.5">
                      <Flame size={13} className="text-amber-400/60" />
                      <span className="text-xs font-semibold text-white/45 tabular-nums">
                        RPE {avg}
                      </span>
                    </div>
                  );
                })()}
                {(() => {
                  const score = computeSessionIntensity(selectedSession, e1RMByExercise);
                  if (score === null) return null;
                  const color =
                    score >= 85 ? "text-trainer-gold" :
                    score >= 70 ? "text-trainer-indigo" :
                    score >= 55 ? "text-amber-400" : "text-white/30";
                  return (
                    <div className="flex items-center gap-1 ml-auto">
                      <span className="text-[10px] text-white/25">intensity</span>
                      <span className={`text-xs font-bold tabular-nums ${color}`}>{score}%</span>
                    </div>
                  );
                })()}
              </div>

              {/* Muscles worked summary */}
              {(() => {
                const muscleSetMap: Record<string, number> = {};
                for (const log of selectedSession.exercisesCompleted) {
                  const ex = exerciseMap[log.exerciseId];
                  if (!ex) continue;
                  for (const m of ex.primaryMuscles) {
                    muscleSetMap[m] = (muscleSetMap[m] ?? 0) + log.sets.length;
                  }
                }
                const muscles = Object.entries(muscleSetMap)
                  .sort(([, a], [, b]) => b - a)
                  .slice(0, 6);
                if (!muscles.length) return null;
                const maxSets = muscles[0]![1];
                return (
                  <div className="px-5 py-3 border-b border-white/5 shrink-0">
                    <p className="text-[10px] text-white/25 uppercase tracking-widest font-semibold mb-2">Muscles Worked</p>
                    <div className="flex flex-col gap-1.5">
                      {muscles.map(([muscle, sets]) => (
                        <div key={muscle} className="flex items-center gap-2">
                          <span className="text-[10px] text-white/45 capitalize w-20 shrink-0">
                            {muscle.replace(/-/g, " ")}
                          </span>
                          <div className="flex-1 h-1.5 bg-white/6 rounded-full overflow-hidden">
                            <motion.div
                              className="h-full bg-trainer-indigo/70 rounded-full"
                              initial={{ width: 0 }}
                              animate={{ width: `${(sets / maxSets) * 100}%` }}
                              transition={{ duration: 0.5, ease: "easeOut" }}
                            />
                          </div>
                          <span className="text-[10px] text-white/30 tabular-nums w-8 text-right shrink-0">
                            {sets}s
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* Session notes */}
              <div className="px-5 py-3 border-b border-white/5 shrink-0">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[10px] text-white/25 uppercase tracking-widest font-semibold">
                    Session Notes
                  </p>
                  {!editingNotes && (
                    <button
                      onClick={() => { setEditingNotes(true); setNotesInput(selectedSession.sessionNotes ?? ""); }}
                      className="text-[10px] text-trainer-indigo font-semibold hover:text-white transition-colors"
                    >
                      {selectedSession.sessionNotes ? "Edit" : "+ Add"}
                    </button>
                  )}
                </div>
                {editingNotes ? (
                  <div className="flex flex-col gap-2">
                    <textarea
                      value={notesInput}
                      onChange={(e) => setNotesInput(e.target.value)}
                      rows={3}
                      placeholder="How did it go? Notes for next time…"
                      className="w-full bg-trainer-elevated border border-white/10 rounded-[10px] px-3 py-2.5 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-trainer-indigo/40 resize-none"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          editSessionNotes(selectedSession.id, notesInput.trim());
                          setSelectedSession((prev) => prev ? { ...prev, sessionNotes: notesInput.trim() } : prev);
                          setEditingNotes(false);
                        }}
                        className="flex-1 py-2 rounded-[8px] bg-trainer-indigo/15 border border-trainer-indigo/30 text-trainer-indigo text-xs font-bold hover:bg-trainer-indigo/25 transition-colors"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingNotes(false)}
                        className="px-4 py-2 rounded-[8px] bg-white/6 text-white/40 text-xs font-semibold hover:text-white/65 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : selectedSession.sessionNotes ? (
                  <p className="text-sm text-white/55 leading-relaxed">{selectedSession.sessionNotes}</p>
                ) : (
                  <p className="text-xs text-white/20 italic">No notes for this session.</p>
                )}
              </div>

              {/* Exercise list */}
              <div className="overflow-y-auto flex-1 px-5 py-4">
                {selectedSession.exercisesCompleted.length === 0 ? (
                  <p className="text-sm text-white/30 text-center py-6">No exercise data recorded.</p>
                ) : (
                  <div className="flex flex-col gap-4">
                    {selectedSession.exercisesCompleted.map((log) => {
                      const ex = exerciseMap[log.exerciseId];
                      const bestE1RM = log.sets.length > 0
                        ? Math.max(...log.sets.map((s) => estimateOneRepMax(s.weightUsed, s.repsCompleted)))
                        : null;
                      return (
                        <div key={log.id ?? log.exerciseId}>
                          <div className="flex items-baseline justify-between mb-2">
                            <p className="text-sm font-semibold text-white/80 capitalize">
                              {ex?.name?.replace(/-/g, " ") ?? log.exerciseId}
                            </p>
                            {bestE1RM !== null && bestE1RM > 0 && (
                              <div className="flex items-center gap-1.5 ml-2 shrink-0">
                                <span className="text-[10px] text-trainer-indigo/60 tabular-nums">
                                  e1RM {Math.round(bestE1RM * 10) / 10}{unit}
                                </span>
                                {(() => {
                                  const atb = e1RMByExercise[log.exerciseId];
                                  if (!atb || atb <= 0) return null;
                                  const delta = bestE1RM - atb;
                                  if (delta >= -0.5) {
                                    return (
                                      <span className="text-[9px] font-bold text-trainer-gold bg-trainer-gold/10 px-1.5 py-0.5 rounded-full leading-none">
                                        PR
                                      </span>
                                    );
                                  }
                                  return (
                                    <span className="text-[9px] text-white/25 tabular-nums">
                                      {Math.round(delta * 10) / 10}{unit}
                                    </span>
                                  );
                                })()}
                              </div>
                            )}
                          </div>
                          {(() => {
                            const e1rms = log.sets.map((s) => estimateOneRepMax(s.weightUsed, s.repsCompleted));
                            const maxE1RM = Math.max(...e1rms);
                            const bestSetIdx = maxE1RM > 0 ? e1rms.indexOf(maxE1RM) : -1;
                            return (
                              <div className="flex flex-col gap-1.5">
                                {log.sets.map((s, si) => {
                                  const isBest = si === bestSetIdx && maxE1RM > 0 && log.sets.length > 1;
                                  return (
                                    <div
                                      key={s.setNumber}
                                      className={cn(
                                        "flex items-center gap-3 rounded-[8px] px-3 py-2",
                                        isBest ? "bg-trainer-gold/8 border border-trainer-gold/20" : "bg-trainer-surface"
                                      )}
                                    >
                                      <span className={cn("text-[11px] w-5 tabular-nums", isBest ? "text-trainer-gold/70" : "text-white/25")}>
                                        {s.setNumber}
                                      </span>
                                      <span className={cn("text-sm font-semibold tabular-nums", isBest ? "text-trainer-gold" : "text-white/80")}>
                                        {formatVolume(s.weightUsed, unit)}
                                      </span>
                                      <span className="text-xs text-white/35">×</span>
                                      <span className={cn("text-sm font-semibold tabular-nums", isBest ? "text-trainer-gold" : "text-white/80")}>
                                        {s.repsCompleted} reps
                                      </span>
                                      {isBest && <span className="ml-auto text-[9px] font-black text-trainer-gold/80 uppercase tracking-wide">Best</span>}
                                      {!isBest && s.rpe != null && (
                                        <span className="ml-auto text-[11px] text-white/25 tabular-nums">
                                          RPE {s.rpe}
                                        </span>
                                      )}
                                      {isBest && s.rpe != null && (
                                        <span className="text-[11px] text-trainer-gold/50 tabular-nums">
                                          RPE {s.rpe}
                                        </span>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            );
                          })()}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
