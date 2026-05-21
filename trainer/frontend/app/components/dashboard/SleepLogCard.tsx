"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Moon, ChevronDown, ChevronUp } from "lucide-react";
import { useSleepStore, type SleepEntry } from "@/app/store/sleepStore";
import { cn } from "@/app/lib/utils";

const QUALITY_OPTIONS: { value: SleepEntry["quality"]; label: string; emoji: string; color: string }[] = [
  { value: 1, label: "Terrible",  emoji: "😵", color: "text-red-400" },
  { value: 2, label: "Poor",      emoji: "😞", color: "text-orange-400" },
  { value: 3, label: "Okay",      emoji: "😐", color: "text-amber-400" },
  { value: 4, label: "Good",      emoji: "😊", color: "text-trainer-success" },
  { value: 5, label: "Excellent", emoji: "🌟", color: "text-trainer-indigo" },
];

function avgSleep(logs: SleepEntry[]): { hours: number; quality: number } | null {
  if (logs.length === 0) return null;
  const h = logs.reduce((s, l) => s + l.hoursSlept, 0) / logs.length;
  const q = logs.reduce((s, l) => s + l.quality, 0) / logs.length;
  return { hours: Math.round(h * 10) / 10, quality: Math.round(q * 10) / 10 };
}

export function SleepLogCard() {
  const { logSleep, getToday, getLast } = useSleepStore();
  const todayLog = getToday();
  const last7 = getLast(7);
  const avg = avgSleep(last7);

  const [expanded, setExpanded] = useState(false);
  const [hours, setHours] = useState(todayLog ? String(todayLog.hoursSlept) : "");
  const [quality, setQuality] = useState<SleepEntry["quality"]>(todayLog?.quality ?? 4);

  function handleLog() {
    const h = parseFloat(hours);
    if (isNaN(h) || h < 1 || h > 24) return;
    logSleep(h, quality);
    setExpanded(false);
  }

  const todayQualityOpt = QUALITY_OPTIONS.find((o) => o.value === todayLog?.quality);

  // Quality trend: compare avg of last 3 vs prior 4 entries
  const qualityTrend: "up" | "down" | null = (() => {
    if (last7.length < 4) return null;
    const sorted = [...last7].sort((a, b) => b.date.localeCompare(a.date));
    const recent = sorted.slice(0, 3);
    const prior = sorted.slice(3);
    const recentAvg = recent.reduce((s, l) => s + l.quality, 0) / recent.length;
    const priorAvg = prior.reduce((s, l) => s + l.quality, 0) / prior.length;
    if (recentAvg > priorAvg + 0.3) return "up";
    if (recentAvg < priorAvg - 0.3) return "down";
    return null;
  })();

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-trainer-surface border border-white/8 rounded-[18px] p-4"
    >
      {/* Header */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between"
      >
        <div className="flex items-center gap-2">
          <Moon size={14} className="text-indigo-400" />
          <p className="text-sm font-bold text-white">Sleep</p>
          {todayLog && (
            <span className="text-xs text-white/40 tabular-nums">
              {todayLog.hoursSlept}h · {todayQualityOpt?.emoji}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {avg && (
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-white/30">
                7d avg: {avg.hours}h
              </span>
              <span className={cn(
                "text-[11px]",
                avg.quality >= 4 ? "text-indigo-400" : avg.quality >= 3 ? "text-amber-400" : "text-red-400"
              )}>
                {QUALITY_OPTIONS.find((o) => o.value === Math.round(avg.quality) as SleepEntry["quality"])?.emoji}
              </span>
              <span className="text-[10px] text-white/20 tabular-nums">
                {last7.length}/7 nights
              </span>
              {avg.hours < 7 && (
                <span className="text-[10px] text-amber-400/60 font-medium">
                  −{((7 - avg.hours)).toFixed(1)}h/night
                </span>
              )}
              {qualityTrend && (
                <span className={cn("text-[10px] font-bold", qualityTrend === "up" ? "text-trainer-success" : "text-red-400")}>
                  {qualityTrend === "up" ? "↑" : "↓"}
                </span>
              )}
            </div>
          )}
          {expanded ? <ChevronUp size={13} className="text-white/30" /> : <ChevronDown size={13} className="text-white/30" />}
        </div>
      </button>

      {/* 7-day mini bars */}
      {!expanded && last7.length > 0 && (
        <div className="flex items-end gap-1 mt-3 h-8">
          {Array.from({ length: 7 }).map((_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - (6 - i));
            const dateStr = d.toISOString().slice(0, 10);
            const entry = last7.find((l) => l.date === dateStr);
            const pct = entry ? Math.min(100, (entry.hoursSlept / 9) * 100) : 0;
            const qColor = entry
              ? entry.quality >= 4 ? "bg-indigo-500" : entry.quality >= 3 ? "bg-amber-400" : "bg-red-400"
              : "bg-white/8";
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
                <div
                  className={cn("w-full rounded-[3px] transition-all", qColor)}
                  style={{ height: `${Math.max(4, pct * 0.32)}px` }}
                />
                <span className="text-[8px] text-white/20">
                  {d.toLocaleDateString("en-US", { weekday: "narrow" })}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Log form */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="pt-4 space-y-3">
              {/* Hours slider + input */}
              <div>
                <p className="text-xs text-white/40 mb-2">Hours slept</p>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="3"
                    max="12"
                    step="0.5"
                    value={hours || "7"}
                    onChange={(e) => setHours(e.target.value)}
                    className="flex-1 accent-indigo-500"
                  />
                  <span className="text-lg font-bold text-white tabular-nums w-12 text-right">
                    {hours || "—"}h
                  </span>
                </div>
              </div>

              {/* Quality selector */}
              <div>
                <p className="text-xs text-white/40 mb-2">Sleep quality</p>
                <div className="flex gap-2">
                  {QUALITY_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setQuality(opt.value)}
                      className={cn(
                        "flex-1 flex flex-col items-center gap-1 py-2 rounded-[10px] border transition-all",
                        quality === opt.value
                          ? "bg-indigo-500/15 border-indigo-500/35"
                          : "bg-white/4 border-white/8 hover:border-white/20"
                      )}
                    >
                      <span className="text-base leading-none">{opt.emoji}</span>
                      <span className={cn("text-[9px] font-semibold", quality === opt.value ? opt.color : "text-white/30")}>
                        {opt.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleLog}
                disabled={!hours || isNaN(parseFloat(hours))}
                className="w-full py-2.5 rounded-[12px] bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 text-sm font-semibold hover:bg-indigo-500/25 transition-colors disabled:opacity-40"
              >
                {todayLog ? "Update Today's Sleep" : "Log Sleep"}
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
