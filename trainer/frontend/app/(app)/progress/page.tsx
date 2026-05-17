"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Clock, Dumbbell, TrendingUp } from "lucide-react";
import { useSessionStore } from "@/app/store/sessionStore";
import { useSettingsStore } from "@/app/store/settingsStore";
import { useUserStore } from "@/app/store/userStore";
import { VolumeChart, type WeeklyVolumeData } from "@/app/components/progress/VolumeChart";
import { OneRMChart, type OneRMDataPoint } from "@/app/components/progress/OneRMChart";
import { PRCard, type ExercisePR } from "@/app/components/progress/PRCard";
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
  const { profile } = useUserStore();

  const [period, setPeriod] = useState<Period>(PERIODS[1]); // default 8W
  const [selectedSection, setSelectedSection] = useState<"volume" | "records">("volume");
  const [selectedExerciseId, setSelectedExerciseId] = useState<string | null>(null);

  const unit = (settings.weightUnit ?? profile?.units ?? "kg") as "kg" | "lb";

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
          {(["volume", "records"] as const).map((tab) => (
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
              {tab === "volume" ? "Volume" : "Records"}
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
                    <motion.div
                      key={session.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.04 }}
                      className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"
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
                      <div className="flex flex-col items-end gap-0.5">
                        <span className="text-xs font-semibold text-white/65 tabular-nums">
                          {formatVolume(session.totalVolumeKg, unit)}
                        </span>
                        <span className="text-[10px] text-white/30">
                          {session.durationMinutes}m
                        </span>
                      </div>
                    </motion.div>
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
      </div>
    </div>
  );
}
