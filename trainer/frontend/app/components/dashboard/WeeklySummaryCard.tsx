"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, ChevronDown, ChevronUp, RefreshCw } from "lucide-react";
import { aiApi } from "@/app/lib/api";
import { type WorkoutSession } from "@/app/types";

const STORAGE_KEY = "trainer-weekly-summary";

interface StoredSummary {
  weekKey: string; // "YYYY-WW"
  summary: string;
}

function getWeekKey(): string {
  const now = new Date();
  const jan1 = new Date(now.getFullYear(), 0, 1);
  const week = Math.ceil(((now.getTime() - jan1.getTime()) / 86400000 + jan1.getDay() + 1) / 7);
  return `${now.getFullYear()}-${String(week).padStart(2, "0")}`;
}

function getThisWeekSessions(sessions: WorkoutSession[]): WorkoutSession[] {
  const now = new Date();
  const dayOfWeek = (now.getDay() + 6) % 7; // Mon = 0
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - dayOfWeek);
  startOfWeek.setHours(0, 0, 0, 0);
  return sessions.filter((s) => new Date(s.date) >= startOfWeek);
}

function getLastWeekSessions(sessions: WorkoutSession[]): WorkoutSession[] {
  const now = new Date();
  const dayOfWeek = (now.getDay() + 6) % 7;
  const startOfThisWeek = new Date(now);
  startOfThisWeek.setDate(now.getDate() - dayOfWeek);
  startOfThisWeek.setHours(0, 0, 0, 0);
  const startOfLastWeek = new Date(startOfThisWeek);
  startOfLastWeek.setDate(startOfThisWeek.getDate() - 7);
  return sessions.filter(
    (s) => new Date(s.date) >= startOfLastWeek && new Date(s.date) < startOfThisWeek
  );
}

interface WeeklySummaryCardProps {
  sessions: WorkoutSession[];
  accessToken?: string;
  goal?: string;
  streak?: number;
}

export function WeeklySummaryCard({ sessions, accessToken, goal, streak }: WeeklySummaryCardProps) {
  const [summary, setSummary] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(true);
  const [weekKey] = useState(getWeekKey);

  const thisWeek = getThisWeekSessions(sessions);
  const lastWeek = getLastWeekSessions(sessions);

  // Only show if there are sessions this week
  const hasSessionsThisWeek = thisWeek.length > 0;

  // Volume trend
  const thisVol = thisWeek.reduce((s, se) => s + se.totalVolumeKg, 0);
  const lastVol = lastWeek.reduce((s, se) => s + se.totalVolumeKg, 0);
  const totalMin = thisWeek.reduce((s, se) => s + se.durationMinutes, 0);
  const totalExercises = thisWeek.reduce((s, se) => s + se.exercisesCompleted.length, 0);
  const timeStr = totalMin >= 60
    ? `${Math.floor(totalMin / 60)}h${totalMin % 60 > 0 ? ` ${totalMin % 60}m` : ""}`
    : `${totalMin}m`;
  const trend: "up" | "down" | "flat" =
    lastVol === 0 ? "flat" : thisVol > lastVol * 1.05 ? "up" : thisVol < lastVol * 0.95 ? "down" : "flat";

  useEffect(() => {
    if (!hasSessionsThisWeek) return;
    // Check cache
    try {
      const stored: StoredSummary = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}");
      if (stored.weekKey === weekKey && stored.summary) {
        setSummary(stored.summary);
        return;
      }
    } catch {
      // ignore
    }
    // Fetch new summary
    if (!accessToken || !goal) return;
    setLoading(true);
    aiApi
      .getWeeklySummary(accessToken, {
        sessions: thisWeek.slice(0, 7).map((s) => ({
          splitDay: s.splitDay,
          durationMinutes: s.durationMinutes,
          exerciseCount: s.exercisesCompleted.length,
          totalVolumeKg: s.totalVolumeKg,
        })),
        goal,
        streak,
        weekVolumeTrend: trend,
      })
      .then(({ summary: s }) => {
        setSummary(s);
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify({ weekKey, summary: s }));
        } catch { /* ignore */ }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasSessionsThisWeek, weekKey, accessToken, goal]);

  function refresh() {
    if (!accessToken || !goal) return;
    try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
    setSummary(null);
    setLoading(true);
    aiApi
      .getWeeklySummary(accessToken, {
        sessions: thisWeek.slice(0, 7).map((s) => ({
          splitDay: s.splitDay,
          durationMinutes: s.durationMinutes,
          exerciseCount: s.exercisesCompleted.length,
          totalVolumeKg: s.totalVolumeKg,
        })),
        goal,
        streak,
        weekVolumeTrend: trend,
      })
      .then(({ summary: s }) => {
        setSummary(s);
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify({ weekKey, summary: s }));
        } catch { /* ignore */ }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  if (!hasSessionsThisWeek && !loading) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-trainer-indigo/10 to-purple-900/8 border border-trainer-indigo/20 rounded-[18px] p-4"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Sparkles size={14} className="text-trainer-indigo" />
          <p className="text-sm font-bold text-white">This Week&apos;s Summary</p>
        </div>
        <div className="flex items-center gap-2">
          {summary && (
            <button
              onClick={refresh}
              disabled={loading}
              className="w-6 h-6 rounded-full bg-white/6 flex items-center justify-center text-white/30 hover:text-white/60 transition-colors disabled:opacity-30"
              aria-label="Refresh summary"
            >
              <RefreshCw size={11} className={loading ? "animate-spin" : ""} />
            </button>
          )}
          <button
            onClick={() => setExpanded((v) => !v)}
            className="w-6 h-6 rounded-full bg-white/6 flex items-center justify-center text-white/30 hover:text-white/60 transition-colors"
          >
            {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>
        </div>
      </div>

      {/* Quick stats row */}
      <div className="flex gap-4 text-xs text-white/45 mb-3">
        <span>{thisWeek.length} session{thisWeek.length !== 1 ? "s" : ""}</span>
        <span>·</span>
        <span>{Math.round(thisVol)} kg volume</span>
        {totalMin > 0 && (
          <>
            <span>·</span>
            <span>{timeStr}</span>
          </>
        )}
        {totalExercises > 0 && (
          <>
            <span>·</span>
            <span>{totalExercises} ex</span>
          </>
        )}
        {trend !== "flat" && lastVol > 0 && (
          <>
            <span>·</span>
            <span className={trend === "up" ? "text-trainer-success" : "text-trainer-danger"}>
              {trend === "up" ? "↑" : "↓"} {Math.round(Math.abs((thisVol - lastVol) / lastVol) * 100)}% vol
            </span>
          </>
        )}
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            {loading && !summary && (
              <div className="flex items-center gap-2 py-2">
                <Sparkles size={12} className="text-trainer-indigo/60 animate-pulse" />
                <p className="text-xs text-white/35 italic">Generating your weekly summary…</p>
              </div>
            )}
            {summary && (
              <p className="text-sm text-white/65 leading-relaxed">{summary}</p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
