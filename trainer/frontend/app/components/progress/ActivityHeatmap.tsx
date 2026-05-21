"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { cn } from "@/app/lib/utils";
import { type WorkoutSession } from "@/app/types";

const DAYS = 91; // 13 columns × 7 rows

function toDateStr(d: Date): string {
  return d.toISOString().slice(0, 10);
}

interface ActivityHeatmapProps {
  sessions: WorkoutSession[];
}

export function ActivityHeatmap({ sessions }: ActivityHeatmapProps) {
  const { cells, monthLabels, totalWorkouts, currentStreak, longestStreak, bestWeekVol, bestWeekStart } = useMemo(() => {
    // Build date→volume map (sum all sessions on same day)
    const volumeByDate = new Map<string, number>();
    for (const s of sessions) {
      const d = s.date.slice(0, 10);
      volumeByDate.set(d, (volumeByDate.get(d) ?? 0) + s.totalVolumeKg);
    }

    // Build DAYS cells ending today
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Align to Monday of the week containing the start date
    const startRaw = new Date(today);
    startRaw.setDate(today.getDate() - DAYS + 1);
    const startDow = (startRaw.getDay() + 6) % 7; // Mon=0
    startRaw.setDate(startRaw.getDate() - startDow);

    const cells: { dateStr: string; volumeKg: number; active: boolean; isToday: boolean; isFuture: boolean }[] = [];
    const monthLabelMap = new Map<number, string>(); // column index → month abbr

    let col = 0;
    let lastMonth = -1;

    for (let i = 0; i < Math.ceil((DAYS + startDow) / 7) * 7; i++) {
      const d = new Date(startRaw);
      d.setDate(startRaw.getDate() + i);
      const dateStr = toDateStr(d);
      const isFuture = d > today;
      const isToday = dateStr === toDateStr(today);
      const volumeKg = volumeByDate.get(dateStr) ?? 0;

      if (d.getMonth() !== lastMonth) {
        monthLabelMap.set(Math.floor(i / 7), d.toLocaleDateString("en-US", { month: "short" }));
        lastMonth = d.getMonth();
      }

      cells.push({ dateStr, volumeKg, active: volumeKg > 0, isToday, isFuture });

      if ((i + 1) % 7 === 0) col++;
    }

    const monthLabels: { col: number; label: string }[] = [];
    monthLabelMap.forEach((label, col) => monthLabels.push({ col, label }));

    // Stats
    const totalWorkouts = sessions.length;

    // Streak calculation
    const activeDateSet = new Set(sessions.map((s) => s.date.slice(0, 10)));
    const sortedDays = Array.from(activeDateSet).sort((a: string, b: string) => b.localeCompare(a));
    let currentStreak = 0;
    let longestStreak = 0;
    let streak = 0;
    const todayStr = toDateStr(today);

    const expected = new Date(today);
    for (const day of sortedDays) {
      const expStr = toDateStr(expected);
      if (day === expStr || (currentStreak === 0 && day === todayStr)) {
        streak++;
        expected.setDate(expected.getDate() - 1);
      } else {
        break;
      }
    }
    currentStreak = streak;

    // Longest streak (brute-force over sorted unique days)
    const sortedAsc = [...sortedDays].reverse();
    let runLen = 0;
    for (let i = 0; i < sortedAsc.length; i++) {
      if (i === 0) { runLen = 1; continue; }
      const prev = new Date(sortedAsc[i - 1] as string);
      prev.setDate(prev.getDate() + 1);
      if (toDateStr(prev) === sortedAsc[i]) {
        runLen++;
      } else {
        runLen = 1;
      }
      longestStreak = Math.max(longestStreak, runLen);
    }
    longestStreak = Math.max(longestStreak, currentStreak);

    // Best week: column with highest total volume
    const numCols = Math.ceil(cells.length / 7);
    let bestWeekVol = 0;
    let bestWeekStart: string | null = null;
    for (let ci = 0; ci < numCols; ci++) {
      let weekVol = 0;
      for (let ri = 0; ri < 7; ri++) {
        weekVol += cells[ci * 7 + ri]?.volumeKg ?? 0;
      }
      if (weekVol > bestWeekVol) {
        bestWeekVol = weekVol;
        bestWeekStart = cells[ci * 7]?.dateStr ?? null;
      }
    }

    return { cells, monthLabels, totalWorkouts, currentStreak, longestStreak, bestWeekVol: Math.round(bestWeekVol), bestWeekStart };
  }, [sessions]);

  // Compute volume quartiles for intensity coloring
  const { q1, q2, q3 } = useMemo(() => {
    const vols = cells.filter((c) => c.volumeKg > 0).map((c) => c.volumeKg).sort((a, b) => a - b);
    if (!vols.length) return { q1: 0, q2: 0, q3: 0 };
    return {
      q1: vols[Math.floor(vols.length * 0.25)] ?? vols[0],
      q2: vols[Math.floor(vols.length * 0.5)] ?? vols[0],
      q3: vols[Math.floor(vols.length * 0.75)] ?? vols[0],
    };
  }, [cells]);

  function intensityClass(cell: { active: boolean; volumeKg: number; isToday: boolean; isFuture: boolean }): string {
    if (cell.isFuture) return "bg-transparent";
    if (!cell.active) return cell.isToday ? "bg-white/20 ring-1 ring-white/30" : "bg-white/6";
    if (cell.volumeKg >= q3) return "bg-trainer-success";
    if (cell.volumeKg >= q2) return "bg-trainer-success/65";
    if (cell.volumeKg >= q1) return "bg-trainer-success/40";
    return "bg-trainer-success/20";
  }

  const numCols = cells.length / 7;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-trainer-surface border border-white/8 rounded-[16px] p-4"
    >
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs text-white/35 uppercase tracking-widest font-semibold">
          Activity (Last 13 Weeks)
        </p>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-[10px] text-white/25">Current streak</p>
            <p className="text-xs font-bold text-trainer-indigo tabular-nums">{currentStreak}d</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-white/25">Best streak</p>
            <p className="text-xs font-bold text-white/60 tabular-nums">{longestStreak}d</p>
          </div>
        </div>
      </div>

      {/* Month labels */}
      <div className="flex mb-1 pl-0" style={{ gap: 3 }}>
        {Array.from({ length: numCols }).map((_, ci) => {
          const label = monthLabels.find((m) => m.col === ci)?.label;
          return (
            <div key={ci} className="flex-1">
              {label && (
                <span className="text-[9px] text-white/25 font-medium">{label}</span>
              )}
            </div>
          );
        })}
      </div>

      {/* Grid — rendered column-major (7 rows × N cols) */}
      <div className="flex" style={{ gap: 3 }}>
        {Array.from({ length: numCols }).map((_, ci) => (
          <div key={ci} className="flex flex-col" style={{ gap: 3 }}>
            {Array.from({ length: 7 }).map((_, ri) => {
              const cell = cells[ci * 7 + ri];
              if (!cell) return <div key={ri} className="w-3 h-3" />;
              return (
                <motion.div
                  key={cell.dateStr}
                  initial={cell.active ? { scale: 0 } : false}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 500, damping: 24, delay: (ci * 7 + ri) * 0.003 }}
                  title={cell.active ? `${cell.dateStr} · ${Math.round(cell.volumeKg)}kg` : cell.dateStr}
                  className={cn("w-3 h-3 rounded-[2px] transition-colors", intensityClass(cell))}
                />
              );
            })}
          </div>
        ))}
      </div>

      {/* Stats row */}
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/5">
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-2">
            <p className="text-[10px] text-white/25">
            {totalWorkouts} workouts logged
            {totalWorkouts > 0 && (
              <span className="text-white/18"> · avg {(totalWorkouts / 13).toFixed(1)}/wk</span>
            )}
          </p>
            {(() => {
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              const cutoff = new Date(today);
              cutoff.setDate(today.getDate() - 29);
              const activeLast30 = cells.filter((c) => {
                if (!c.active || c.isFuture) return false;
                const d = new Date(c.dateStr + "T00:00:00");
                return d >= cutoff;
              }).length;
              if (activeLast30 === 0) return null;
              return (
                <span className="text-[9px] font-semibold text-trainer-indigo/70 bg-trainer-indigo/8 px-1.5 py-0.5 rounded-full">
                  {activeLast30}/30d
                </span>
              );
            })()}
          </div>
          {bestWeekVol > 0 && bestWeekStart && (
            <p className="text-[9px] text-white/18 tabular-nums">
              Best week: {new Date(bestWeekStart + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })} · {bestWeekVol.toLocaleString()} kg
            </p>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-[2px] bg-white/6" />
          <div className="w-2.5 h-2.5 rounded-[2px] bg-trainer-success/20" />
          <div className="w-2.5 h-2.5 rounded-[2px] bg-trainer-success/40" />
          <div className="w-2.5 h-2.5 rounded-[2px] bg-trainer-success/65" />
          <div className="w-2.5 h-2.5 rounded-[2px] bg-trainer-success" />
          <span className="text-[9px] text-white/25 ml-0.5">Low → High volume</span>
        </div>
      </div>
    </motion.div>
  );
}
