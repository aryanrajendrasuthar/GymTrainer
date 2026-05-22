"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/app/lib/utils";
import { type WorkoutSession } from "@/app/types";

const WEEKDAYS = ["M", "T", "W", "T", "F", "S", "S"];

interface WorkoutCalendarProps {
  sessions: WorkoutSession[];
}

export function WorkoutCalendar({ sessions }: WorkoutCalendarProps) {
  const [offset, setOffset] = useState(0); // months back from today

  const { year, month, label, days, sessionVolumeMap, maxVolume, longestStreak } = useMemo(() => {
    const ref = new Date();
    ref.setDate(1);
    ref.setMonth(ref.getMonth() - offset);
    const y = ref.getFullYear();
    const m = ref.getMonth(); // 0-based

    const label = ref.toLocaleDateString("en-US", { month: "long", year: "numeric" });

    // First day of month weekday (0=Sun…6=Sat → remap to Mon-start)
    const firstDay = new Date(y, m, 1).getDay();
    const startPad = (firstDay + 6) % 7; // Mon-start padding
    const daysInMonth = new Date(y, m + 1, 0).getDate();

    // Build cells: nulls for padding, numbers for real days
    const days: (number | null)[] = [
      ...Array(startPad).fill(null),
      ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
    ];

    // Pad to complete last row
    const remainder = days.length % 7;
    if (remainder !== 0) {
      days.push(...Array(7 - remainder).fill(null));
    }

    // Build volume map: date string → totalVolumeKg (summed if multiple sessions same day)
    const sessionVolumeMap: Record<string, number> = {};
    for (const s of sessions) {
      const d = new Date(s.date);
      if (d.getFullYear() !== y || d.getMonth() !== m) continue;
      const dateStr = s.date.slice(0, 10);
      sessionVolumeMap[dateStr] = (sessionVolumeMap[dateStr] ?? 0) + s.totalVolumeKg;
    }
    const volumes = Object.values(sessionVolumeMap);
    const maxVolume = volumes.length > 0 ? Math.max(...volumes) : 0;

    const sortedDates = Object.keys(sessionVolumeMap).sort();
    let longestStreak = sortedDates.length > 0 ? 1 : 0;
    let curStreak = sortedDates.length > 0 ? 1 : 0;
    for (let i = 1; i < sortedDates.length; i++) {
      const prev = new Date(sortedDates[i - 1]!).getTime();
      const curr = new Date(sortedDates[i]!).getTime();
      if (curr - prev === 86400000) {
        curStreak++;
        if (curStreak > longestStreak) longestStreak = curStreak;
      } else {
        curStreak = 1;
      }
    }

    return { year: y, month: m, label, days, sessionVolumeMap, maxVolume, longestStreak };
  }, [offset, sessions]);

  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);
  const monthSessionCount = Object.keys(sessionVolumeMap).length;
  const monthTotalVol = Math.round(Object.values(sessionVolumeMap).reduce((a, b) => a + b, 0));
  const monthAvgVol = monthSessionCount > 0 ? Math.round(monthTotalVol / monthSessionCount) : 0;

  return (
    <div>
      {/* Month nav */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setOffset((o) => o + 1)}
          className="w-7 h-7 rounded-full bg-white/6 flex items-center justify-center text-white/40 hover:text-white transition-colors"
        >
          <ChevronLeft size={13} />
        </button>
        <p className="text-xs font-semibold text-white/60">{label}</p>
        <button
          onClick={() => setOffset((o) => Math.max(0, o - 1))}
          disabled={offset === 0}
          className="w-7 h-7 rounded-full bg-white/6 flex items-center justify-center text-white/40 hover:text-white transition-colors disabled:opacity-20"
        >
          <ChevronRight size={13} />
        </button>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 mb-1">
        {WEEKDAYS.map((d, i) => (
          <p key={i} className="text-center text-[10px] text-white/25 font-semibold pb-1">
            {d}
          </p>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7 gap-y-1">
        {days.map((day, i) => {
          if (day === null) return <div key={i} />;

          const pad = String(month + 1).padStart(2, "0");
          const dayPad = String(day).padStart(2, "0");
          const dateStr = `${year}-${pad}-${dayPad}`;
          const sessionVolume = sessionVolumeMap[dateStr];
          const hasSession = sessionVolume !== undefined;
          const isToday = dateStr === todayStr;

          // Volume intensity: 0–1 relative to month max, bucketed for clarity
          const volumeRatio = hasSession && maxVolume > 0 ? sessionVolume / maxVolume : 0;
          const bgClass = !hasSession ? "" :
            volumeRatio >= 0.67 ? "bg-trainer-indigo" :
            volumeRatio >= 0.33 ? "bg-trainer-indigo/65" :
            "bg-trainer-indigo/35";

          return (
            <div key={i} className="flex items-center justify-center py-0.5">
              <motion.div
                initial={hasSession ? { scale: 0 } : false}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 400, damping: 20, delay: i * 0.008 }}
                className={cn(
                  "w-7 h-7 rounded-full flex items-center justify-center relative",
                  bgClass,
                  !hasSession && isToday ? "border border-white/20" : ""
                )}
              >
                <span className={cn(
                  "text-[11px] font-semibold tabular-nums",
                  hasSession ? "text-white" : isToday ? "text-white/70" : "text-white/30"
                )}>
                  {day}
                </span>
              </motion.div>
            </div>
          );
        })}
      </div>

      {/* Month stats */}
      {monthSessionCount > 0 && (
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/5 text-[10px] text-white/30">
          <span>{monthSessionCount} session{monthSessionCount !== 1 ? "s" : ""} this month</span>
          <div className="flex items-center gap-2">
            {longestStreak >= 2 && (
              <span className="text-trainer-indigo/60 tabular-nums">{longestStreak}d streak</span>
            )}
            <span className="tabular-nums">{monthTotalVol.toLocaleString()} kg vol</span>
            <span className="text-white/15 tabular-nums">~{monthAvgVol.toLocaleString()} avg</span>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center gap-3 mt-3 justify-end">
        <div className="flex items-center gap-1">
          <div className="w-2.5 h-2.5 rounded-full bg-trainer-indigo/35" />
          <div className="w-2.5 h-2.5 rounded-full bg-trainer-indigo/65" />
          <div className="w-2.5 h-2.5 rounded-full bg-trainer-indigo" />
          <span className="text-[10px] text-white/30 ml-1">Volume</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full border border-white/20" />
          <span className="text-[10px] text-white/30">Today</span>
        </div>
      </div>
    </div>
  );
}
