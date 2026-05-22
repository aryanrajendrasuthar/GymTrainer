"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { CalendarCheck } from "lucide-react";
import { cn } from "@/app/lib/utils";
import type { WorkoutSession } from "@/app/types";

const WEEKS = 6;

function getMondayOf(d: Date): Date {
  const day = new Date(d);
  day.setHours(0, 0, 0, 0);
  const dow = (day.getDay() + 6) % 7; // Mon=0
  day.setDate(day.getDate() - dow);
  return day;
}

interface Props {
  sessions: WorkoutSession[];
  daysPerWeek: number;
}

export function SplitAdherenceCard({ sessions, daysPerWeek }: Props) {
  const weeks = useMemo(() => {
    const today = new Date();
    const todayDow = (today.getDay() + 6) % 7; // Mon=0, Sun=6
    const result: { label: string; actual: number; planned: number; pct: number }[] = [];

    for (let i = WEEKS - 1; i >= 0; i--) {
      const weekStart = getMondayOf(new Date(today));
      weekStart.setDate(weekStart.getDate() - i * 7);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);

      const isCurrentWeek = i === 0;
      // Pro-rate planned sessions for the current week by elapsed days
      const planned = isCurrentWeek
        ? Math.max(1, Math.round((daysPerWeek / 7) * (todayDow + 1)))
        : daysPerWeek;

      const actual = sessions.filter((s) => {
        const d = new Date(s.date);
        return d >= weekStart && d <= weekEnd;
      }).length;

      const label = weekStart.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      result.push({ label, actual, planned, pct: Math.min(100, Math.round((actual / planned) * 100)) });
    }

    return result;
  }, [sessions, daysPerWeek]);

  const avgPct = Math.round(weeks.reduce((a, w) => a + w.pct, 0) / weeks.length);

  let streak = 0;
  for (let i = weeks.length - 1; i >= 0; i--) {
    if (weeks[i].pct >= 80) streak++;
    else break;
  }
  const weekTrendUp = weeks.length >= 2 && weeks[weeks.length - 1]!.pct >= weeks[weeks.length - 2]!.pct;
  const perfectWeeks = weeks.filter((w) => w.pct >= 100).length;

  if (sessions.length < 3) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-trainer-surface border border-white/8 rounded-[16px] p-4"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <CalendarCheck size={13} className="text-trainer-indigo" />
          <p className="text-xs text-white/35 uppercase tracking-widest font-semibold">
            Weekly Adherence
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          {weeks.length >= 2 && (
            <span className={weekTrendUp ? "text-trainer-success" : "text-red-400"}>
              {weekTrendUp ? "↑" : "↓"}
            </span>
          )}
          <span className={cn(
            "text-xs font-bold tabular-nums",
            avgPct >= 80 ? "text-trainer-success" :
            avgPct >= 55 ? "text-amber-400" : "text-red-400"
          )}>
            {avgPct}% avg
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-2.5">
        {weeks.map((week, i) => (
          <div key={week.label} className="flex items-center gap-3">
            <span className="text-[10px] text-white/30 w-16 shrink-0">{week.label}</span>
            <div className="flex-1 h-2 bg-white/6 rounded-full overflow-hidden">
              <motion.div
                className={cn(
                  "h-full rounded-full",
                  week.pct >= 100 ? "bg-trainer-success" :
                  week.pct >= 66  ? "bg-trainer-indigo" :
                  week.pct >= 33  ? "bg-amber-400" : "bg-red-400/70"
                )}
                initial={{ width: 0 }}
                animate={{ width: `${week.pct}%` }}
                transition={{ duration: 0.5, ease: "easeOut", delay: i * 0.06 }}
              />
            </div>
            <span className="text-[10px] text-white/35 tabular-nums w-10 text-right shrink-0">
              {week.actual}/{week.planned}
            </span>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between mt-3">
        {streak > 0 ? (
          <p className="text-[10px] text-trainer-success/60">
            {streak} week{streak > 1 ? "s" : ""} consistent ✓
          </p>
        ) : <span />}
        <div className="flex items-center gap-2">
          {perfectWeeks > 0 && (
            <span className="text-[9px] font-bold text-trainer-success/60 bg-trainer-success/8 border border-trainer-success/15 px-1.5 py-0.5 rounded-full tabular-nums">
              {perfectWeeks}× 100%
            </span>
          )}
          {(() => {
            const best = Math.max(...weeks.map((w) => w.pct));
            return best > 0 ? (
              <span className="text-[9px] font-bold text-trainer-indigo/60 bg-trainer-indigo/8 border border-trainer-indigo/15 px-1.5 py-0.5 rounded-full tabular-nums">
                Best {best}%
              </span>
            ) : null;
          })()}
          <p className="text-[10px] text-white/20">
            {daysPerWeek}×/week · pro-rated
          </p>
        </div>
      </div>
    </motion.div>
  );
}
