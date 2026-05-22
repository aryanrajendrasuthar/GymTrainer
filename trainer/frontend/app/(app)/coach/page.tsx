"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Loader2, Bot, User, Trash2 } from "lucide-react";
import { useUserStore } from "@/app/store/userStore";
import { useSessionStore } from "@/app/store/sessionStore";
import { usePhysioStore } from "@/app/store/physioStore";
import { useGoalStore } from "@/app/store/goalStore";
import { getSplitById } from "@/app/data/splits";
import { aiApi, type AIChatMessage } from "@/app/lib/api";
import { cn } from "@/app/lib/utils";
import { estimateOneRepMax } from "@/app/lib/progression-engine";
import { exerciseMap } from "@/app/data/exercises";
import type { WorkoutSession } from "@/app/types";

function parseInline(text: string, keyBase: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  const regex = /(\*\*(.+?)\*\*|\*(.+?)\*)/g;
  let last = 0;
  let match;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > last) parts.push(text.slice(last, match.index));
    if (match[0].startsWith("**")) {
      parts.push(<strong key={`${keyBase}-b${match.index}`} className="font-semibold text-white">{match[2]}</strong>);
    } else {
      parts.push(<em key={`${keyBase}-i${match.index}`} className="italic text-white/70">{match[3]}</em>);
    }
    last = match.index + match[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

function MarkdownBubble({ content }: { content: string }) {
  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];
  const bulletBuffer: string[] = [];
  let key = 0;

  function flushBullets() {
    if (!bulletBuffer.length) return;
    elements.push(
      <ul key={key++} className="space-y-0.5 my-0.5">
        {bulletBuffer.map((b, i) => (
          <li key={i} className="flex items-start gap-1.5">
            <span className="text-trainer-indigo/70 mt-[3px] text-[10px] leading-none shrink-0">•</span>
            <span>{parseInline(b, `bl-${i}`)}</span>
          </li>
        ))}
      </ul>
    );
    bulletBuffer.length = 0;
  }

  for (const line of lines) {
    if (line.startsWith("# ")) {
      flushBullets();
      elements.push(
        <p key={key++} className="font-bold text-white text-[13px] mt-2 first:mt-0">
          {parseInline(line.slice(2), `h1-${key}`)}
        </p>
      );
    } else if (line.startsWith("## ") || line.startsWith("### ")) {
      flushBullets();
      const text = line.replace(/^#{2,3} /, "");
      elements.push(
        <p key={key++} className="font-semibold text-white/90 text-[12px] mt-1">
          {parseInline(text, `h2-${key}`)}
        </p>
      );
    } else if (line.startsWith("- ") || line.startsWith("• ")) {
      bulletBuffer.push(line.slice(2));
    } else if (line.trim() === "") {
      flushBullets();
      if (elements.length > 0) elements.push(<div key={key++} className="h-1" />);
    } else {
      flushBullets();
      elements.push(
        <p key={key++} className="leading-relaxed">
          {parseInline(line, `p-${key}`)}
        </p>
      );
    }
  }
  flushBullets();

  return <div className="flex flex-col gap-0.5 text-sm text-white/80">{elements}</div>;
}

const STARTER_PROMPTS = [
  "What should I focus on this week?",
  "How do I break through a strength plateau?",
  "Give me a high-protein meal idea post-workout.",
  "How many rest days do I need?",
  "How can I improve my squat depth?",
];

function calcStreak(sessions: WorkoutSession[]): number {
  if (!sessions.length) return 0;
  const MS = 86_400_000;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const days = Array.from(new Set(sessions.map((s) => {
    const d = new Date(s.date); d.setHours(0, 0, 0, 0); return d.getTime();
  }))).sort((a, b) => b - a);
  if ((today.getTime() - days[0]) / MS > 1) return 0;
  let count = 0, expected = days[0];
  for (const ms of days) {
    if (ms === expected) { count++; expected -= MS; } else break;
  }
  return count;
}

export default function CoachPage() {
  const { profile, accessToken } = useUserStore();
  const { recentSessions, allExerciseLogs, sessionDates } = useSessionStore();
  const { activeInjuries } = usePhysioStore();
  const { goals } = useGoalStore();

  const CHAT_KEY = "trainer-coach-messages";

  const [messages, setMessages] = useState<AIChatMessage[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const raw = localStorage.getItem(CHAT_KEY);
      return raw ? (JSON.parse(raw) as AIChatMessage[]) : [];
    } catch {
      return [];
    }
  });
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [clearConfirm, setClearConfirm] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      localStorage.setItem(CHAT_KEY, JSON.stringify(messages.slice(-40)));
    } catch {
      // storage quota exceeded
    }
  }, [messages]);

  const split = profile?.splitId ? getSplitById(profile.splitId) : null;
  const totalVolumeKg = recentSessions.reduce((s, se) => s + se.totalVolumeKg, 0);

  const streak = useMemo(() => calcStreak(recentSessions), [recentSessions]);

  const { thisWeekVolumeKg, lastWeekVolumeKg } = useMemo(() => {
    const now = new Date(); now.setHours(0, 0, 0, 0);
    const dow = (now.getDay() + 6) % 7;
    const weekStart = new Date(now); weekStart.setDate(now.getDate() - dow);
    const prevStart = new Date(weekStart); prevStart.setDate(weekStart.getDate() - 7);
    let thisWeek = 0, lastWeek = 0;
    for (const s of recentSessions) {
      const d = new Date(s.date);
      if (d >= weekStart) thisWeek += s.totalVolumeKg;
      else if (d >= prevStart && d < weekStart) lastWeek += s.totalVolumeKg;
    }
    return { thisWeekVolumeKg: Math.round(thisWeek), lastWeekVolumeKg: Math.round(lastWeek) };
  }, [recentSessions]);

  const recentPRs = useMemo(() => {
    const cutoff = Date.now() - 14 * 86_400_000;
    const map = new Map<string, { recent: number; prior: number }>();
    for (const log of allExerciseLogs) {
      const dateStr = sessionDates[log.sessionId] ?? log.loggedAt?.slice(0, 10);
      if (!dateStr) continue;
      const ms = new Date(dateStr).getTime();
      let best = 0;
      for (const s of log.sets)
        if (s.weightUsed > 0 && s.repsCompleted > 0)
          best = Math.max(best, estimateOneRepMax(s.weightUsed, s.repsCompleted));
      if (!best) continue;
      const cur = map.get(log.exerciseId) ?? { recent: 0, prior: 0 };
      if (ms >= cutoff) cur.recent = Math.max(cur.recent, best);
      else cur.prior = Math.max(cur.prior, best);
      map.set(log.exerciseId, cur);
    }
    const prs: string[] = [];
    map.forEach((v, id) => {
      if (v.recent > v.prior && v.prior > 0)
        prs.push(`${exerciseMap[id]?.name ?? id.replace(/-/g, " ")} (${Math.round(v.recent)}kg e1RM)`);
    });
    return prs.slice(0, 3);
  }, [allExerciseLogs, sessionDates]);

  const stagnantExercises = useMemo(() => {
    const todayMs = Date.now();
    const eightWeeks = 56 * 86_400_000;
    const grouped = new Map<string, { dateMs: number; e1rm: number }[]>();
    for (const log of allExerciseLogs) {
      const dateStr = sessionDates[log.sessionId] ?? log.loggedAt?.slice(0, 10);
      if (!dateStr) continue;
      const dateMs = new Date(dateStr).getTime();
      if (todayMs - dateMs > eightWeeks) continue;
      let best = 0;
      for (const s of log.sets)
        if (s.weightUsed > 0 && s.repsCompleted > 0)
          best = Math.max(best, estimateOneRepMax(s.weightUsed, s.repsCompleted));
      if (!best) continue;
      if (!grouped.has(log.exerciseId)) grouped.set(log.exerciseId, []);
      grouped.get(log.exerciseId)!.push({ dateMs, e1rm: best });
    }
    const names: string[] = [];
    grouped.forEach((sessions, id) => {
      if (sessions.length < 4) return;
      const sorted = [...sessions].sort((a, b) => a.dateMs - b.dateMs);
      const threeWeeksAgo = todayMs - 21 * 86_400_000;
      const baseline = sorted.filter((s) => s.dateMs <= threeWeeksAgo);
      if (baseline.length < 2) return;
      const recent = sorted.filter((s) => s.dateMs > threeWeeksAgo);
      if (!recent.length) return;
      const peakBase = Math.max(...baseline.map((s) => s.e1rm));
      const peakRecent = Math.max(...recent.map((s) => s.e1rm));
      if ((peakRecent - peakBase) / peakBase < 0.025)
        names.push(exerciseMap[id]?.name ?? id.replace(/-/g, " "));
    });
    return names.slice(0, 3);
  }, [allExerciseLogs, sessionDates]);

  const context = {
    goal: profile?.goal,
    fitnessLevel: profile?.fitnessLevel,
    splitName: split?.name,
    recentSessionCount: recentSessions.length,
    streak: streak || undefined,
    totalVolumeKg,
    injuries: activeInjuries.map((i) => i.condition.replace(/-/g, " ")),
    thisWeekVolumeKg: thisWeekVolumeKg || undefined,
    lastWeekVolumeKg: lastWeekVolumeKg || undefined,
    recentPRs: recentPRs.length ? recentPRs : undefined,
    stagnantExercises: stagnantExercises.length ? stagnantExercises : undefined,
    activeGoalCount: goals.filter((g) => !g.achieved).length || undefined,
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function sendMessage(text?: string) {
    const content = (text ?? input).trim();
    if (!content || !accessToken) return;

    const userMsg: AIChatMessage = { role: "user", content };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput("");
    setLoading(true);

    try {
      const { reply } = await aiApi.chat(accessToken, next.slice(-14), context);
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Something went wrong. Try again in a moment." },
      ]);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  return (
    <div className="flex flex-col min-h-full page-enter">
      {/* Header */}
      <div className="px-5 pt-14 pb-4 border-b border-white/6 shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">AI Coach</h1>
            <p className="text-xs text-white/35 mt-0.5">
              Personalised to your goal, split & history
            </p>
          </div>
          {messages.length > 0 && (
            <button
              onClick={() => setClearConfirm((v) => !v)}
              className="w-8 h-8 rounded-full bg-white/6 flex items-center justify-center text-white/30 hover:text-trainer-danger transition-colors"
              aria-label="Clear conversation"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
        <AnimatePresence>
          {clearConfirm && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="mt-3 flex items-center gap-2"
            >
              <p className="text-xs text-white/40 flex-1">Clear this conversation?</p>
              <button
                onClick={() => { setMessages([]); setClearConfirm(false); try { localStorage.removeItem(CHAT_KEY); } catch {} }}
                className="text-xs font-semibold text-trainer-danger px-3 py-1.5 rounded-[8px] bg-trainer-danger/10 hover:bg-trainer-danger/20 transition-colors"
              >
                Clear
              </button>
              <button
                onClick={() => setClearConfirm(false)}
                className="text-xs font-medium text-white/40 px-2 py-1.5"
              >
                Cancel
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 pb-32 space-y-4">
        {messages.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center pt-8 pb-4 text-center"
          >
            <div className="w-16 h-16 rounded-full bg-trainer-indigo/15 border border-trainer-indigo/30 flex items-center justify-center mb-4">
              <Bot size={28} className="text-trainer-indigo" />
            </div>
            <p className="text-white font-bold text-lg mb-1">
              Hey{profile?.name ? `, ${profile.name.split(" ")[0]}` : ""}
            </p>
            <p className="text-sm text-white/40 max-w-xs leading-relaxed">
              I know your training plan, history, and goals. Ask me anything.
            </p>

            {/* Starter prompts */}
            <div className="flex flex-col gap-2 mt-6 w-full max-w-xs">
              {STARTER_PROMPTS.map((p) => (
                <button
                  key={p}
                  onClick={() => sendMessage(p)}
                  className="text-left text-sm text-white/60 bg-trainer-surface border border-white/8 rounded-[12px] px-4 py-3 hover:border-trainer-indigo/40 hover:text-white transition-all"
                >
                  {p}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {messages.map((msg, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.04 }}
            className={cn("flex items-start gap-3", msg.role === "user" ? "flex-row-reverse" : "")}
          >
            {/* Avatar */}
            <div
              className={cn(
                "w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5",
                msg.role === "user"
                  ? "bg-trainer-indigo/20"
                  : "bg-white/8"
              )}
            >
              {msg.role === "user" ? (
                <User size={13} className="text-trainer-indigo" />
              ) : (
                <Bot size={13} className="text-white/60" />
              )}
            </div>

            {/* Bubble */}
            <div
              className={cn(
                "max-w-[80%] rounded-[16px] px-4 py-3 text-sm leading-relaxed",
                msg.role === "user"
                  ? "bg-trainer-indigo text-white rounded-tr-[4px]"
                  : "bg-trainer-surface border border-white/8 text-white/80 rounded-tl-[4px]"
              )}
            >
              {msg.role === "assistant" ? (
                <MarkdownBubble content={msg.content} />
              ) : (
                msg.content
              )}
            </div>
          </motion.div>
        ))}

        {loading && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-start gap-3"
          >
            <div className="w-7 h-7 rounded-full bg-white/8 flex items-center justify-center shrink-0">
              <Bot size={13} className="text-white/60" />
            </div>
            <div className="bg-trainer-surface border border-white/8 rounded-[16px] rounded-tl-[4px] px-4 py-3">
              <Loader2 size={14} className="text-white/40 animate-spin" />
            </div>
          </motion.div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="fixed bottom-[65px] left-0 right-0 px-4 pb-3 pt-2 bg-gradient-to-t from-[#0A0A0F] via-[#0A0A0F]/95 to-transparent">
        <div className="flex items-center gap-2 bg-trainer-surface border border-white/10 rounded-[16px] px-3 py-2 focus-within:border-trainer-indigo/40 transition-colors">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask your coach anything..."
            disabled={loading || !accessToken}
            className="flex-1 bg-transparent text-sm text-white placeholder:text-white/25 focus:outline-none disabled:opacity-50"
          />
          <button
            onClick={() => sendMessage()}
            disabled={!input.trim() || loading || !accessToken}
            className="w-8 h-8 rounded-[10px] bg-trainer-indigo flex items-center justify-center text-white disabled:opacity-35 disabled:cursor-not-allowed hover:bg-trainer-indigo-hover transition-colors shrink-0"
          >
            <Send size={14} />
          </button>
        </div>
        {!accessToken && (
          <p className="text-[10px] text-white/25 text-center mt-1">Sign in to use AI Coach</p>
        )}
      </div>
    </div>
  );
}
