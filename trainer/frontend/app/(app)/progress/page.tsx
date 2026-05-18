"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, Dumbbell, TrendingUp, X, ChevronRight } from "lucide-react";
import { useSessionStore } from "@/app/store/sessionStore";
import { useSettingsStore } from "@/app/store/settingsStore";
import { useUserStore } from "@/app/store/userStore";
import { useProgressStore } from "@/app/store/progressStore";
import { progressApi } from "@/app/lib/api";
import { VolumeChart, type WeeklyVolumeData } from "@/app/components/progress/VolumeChart";
import { OneRMChart, type OneRMDataPoint } from "@/app/components/progress/OneRMChart";
import { PRCard, type ExercisePR } from "@/app/components/progress/PRCard";
import { BodyWeightChart } from "@/app/components/progress/BodyWeightChart";
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

export default function ProgressPage() {
  const { recentSessions, allExerciseLogs, sessionDates } = useSessionStore();
  const { settings } = useSettingsStore();
  const { profile, accessToken } = useUserStore();

  const { bodyWeightLogs, addWeightLog } = useProgressStore();

  const [period, setPeriod] = useState<Period>(PERIODS[1]); // default 8W
  const [selectedSection, setSelectedSection] = useState<"volume" | "records" | "body">("volume");
  const [selectedExerciseId, setSelectedExerciseId] = useState<string | null>(null);
  const [selectedSession, setSelectedSession] = useState<WorkoutSession | null>(null);
  const [weightInput, setWeightInput] = useState("");

  const unit = (settings.weightUnit ?? profile?.units ?? "kg") as "kg" | "lb";

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

  return (
    <div className="flex flex-col min-h-full pb-24">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="px-5 pt-14 pb-5"
      >
        <h1 className="text-2xl font-bold text-white">Progress</h1>

        {/* Period tabs */}
        <div className="flex gap-2 mt-4">
          {PERIODS.map((p) => (
            <button
              key={p.label}
              onClick={() => setPeriod(p)}
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
          {(["volume", "records", "body"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setSelectedSection(tab)}
              className={cn(
                "flex-1 py-2 text-sm font-semibold rounded-[8px] transition-all duration-200 capitalize",
                selectedSection === tab
                  ? "bg-trainer-surface text-white"
                  : "text-white/40 hover:text-white/70"
              )}
            >
              {tab === "volume" ? "Volume" : tab === "records" ? "Records" : "Body"}
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
              <p className="text-xs text-white/35 uppercase tracking-widest font-semibold mb-4">
                Weekly Volume ({unit})
              </p>
              <VolumeChart data={weeklyVolume} unit={unit} />
            </div>

            {/* Recent sessions list */}
            <div className="bg-trainer-surface border border-white/8 rounded-[16px] p-4">
              <p className="text-xs text-white/35 uppercase tracking-widest font-semibold mb-3">
                Session History
              </p>
              {periodSessions.length === 0 ? (
                <p className="text-sm text-white/25 text-center py-6">
                  No sessions in this period
                </p>
              ) : (
                <div className="flex flex-col divide-y divide-white/5">
                  {periodSessions.slice(0, 10).map((session, i) => (
                    <motion.button
                      key={session.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.04 }}
                      onClick={() => setSelectedSession(session)}
                      className="flex items-center gap-3 py-3 first:pt-0 last:pb-0 w-full text-left"
                    >
                      <div className="w-8 h-8 rounded-[8px] bg-trainer-indigo/12 flex items-center justify-center shrink-0">
                        <Dumbbell size={14} className="text-trainer-indigo/60" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white/80 truncate">
                          {session.splitDay}
                        </p>
                        <p className="text-xs text-white/30 mt-0.5">
                          {new Date(session.date).toLocaleDateString("en-US", {
                            weekday: "short",
                            month: "short",
                            day: "numeric",
                          })}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <div className="flex flex-col items-end gap-0.5">
                          <span className="text-xs font-semibold text-white/65 tabular-nums">
                            {formatVolume(session.totalVolumeKg, unit)}
                          </span>
                          <span className="text-[10px] text-white/30">
                            {session.durationMinutes}m
                          </span>
                        </div>
                        <ChevronRight size={13} className="text-white/20" />
                      </div>
                    </motion.button>
                  ))}
                </div>
              )}
            </div>
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
              </div>
            )}

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
              />
            </div>
          </motion.div>
        )}

        {/* ── Body section ── */}
        {selectedSection === "body" && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col gap-4"
          >
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
            <div className="bg-trainer-surface border border-white/8 rounded-[16px] p-4">
              <p className="text-xs text-white/35 uppercase tracking-widest font-semibold mb-4">
                Weight Trend ({unit})
              </p>
              <BodyWeightChart data={bodyWeightLogs} unit={unit} />
            </div>

            {/* Weight log history */}
            {bodyWeightLogs.length > 0 && (
              <div className="bg-trainer-surface border border-white/8 rounded-[16px] p-4">
                <p className="text-xs text-white/35 uppercase tracking-widest font-semibold mb-3">
                  History
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
              onClick={() => setSelectedSession(null)}
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
                <button
                  onClick={() => setSelectedSession(null)}
                  className="w-8 h-8 rounded-full bg-white/8 flex items-center justify-center text-white/50 hover:text-white transition-colors"
                >
                  <X size={15} />
                </button>
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
              </div>

              {/* Exercise list */}
              <div className="overflow-y-auto flex-1 px-5 py-4">
                {selectedSession.exercisesCompleted.length === 0 ? (
                  <p className="text-sm text-white/30 text-center py-6">No exercise data recorded.</p>
                ) : (
                  <div className="flex flex-col gap-4">
                    {selectedSession.exercisesCompleted.map((log) => {
                      const ex = exerciseMap[log.exerciseId];
                      return (
                        <div key={log.id ?? log.exerciseId}>
                          <p className="text-sm font-semibold text-white/80 capitalize mb-2">
                            {ex?.name?.replace(/-/g, " ") ?? log.exerciseId}
                          </p>
                          <div className="flex flex-col gap-1.5">
                            {log.sets.map((s) => (
                              <div
                                key={s.setNumber}
                                className="flex items-center gap-3 bg-trainer-surface rounded-[8px] px-3 py-2"
                              >
                                <span className="text-[11px] text-white/25 w-5 tabular-nums">
                                  {s.setNumber}
                                </span>
                                <span className="text-sm font-semibold text-white/80 tabular-nums">
                                  {formatVolume(s.weightUsed, unit)}
                                </span>
                                <span className="text-xs text-white/35">×</span>
                                <span className="text-sm font-semibold text-white/80 tabular-nums">
                                  {s.repsCompleted} reps
                                </span>
                                {s.rpe != null && (
                                  <span className="ml-auto text-[11px] text-white/25 tabular-nums">
                                    RPE {s.rpe}
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
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
