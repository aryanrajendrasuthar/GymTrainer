"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { Star } from "lucide-react";
import { cn } from "@/app/lib/utils";
import type { WorkoutSession } from "@/app/types";

interface Props {
  sessions: WorkoutSession[];
}

export function SessionRatingChart({ sessions }: Props) {
  const rated = useMemo(
    () => sessions.filter((s) => s.rating && s.rating > 0).slice(-30),
    [sessions]
  );

  const { avg, dist, ratingTrend } = useMemo(() => {
    const d: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let sum = 0;
    for (const s of rated) {
      if (s.rating) {
        d[s.rating] = (d[s.rating] ?? 0) + 1;
        sum += s.rating;
      }
    }

    const recent10 = rated.slice(-10);
    const prev10 = rated.slice(-20, -10);
    const recentAvg = recent10.length ? recent10.reduce((s, r) => s + (r.rating ?? 0), 0) / recent10.length : 0;
    const prevAvg = prev10.length ? prev10.reduce((s, r) => s + (r.rating ?? 0), 0) / prev10.length : 0;
    const ratingTrend: "up" | "down" | null = prev10.length >= 3
      ? recentAvg > prevAvg + 0.2 ? "up" : recentAvg < prevAvg - 0.2 ? "down" : null
      : null;

    return {
      avg: rated.length > 0 ? Math.round((sum / rated.length) * 10) / 10 : 0,
      dist: d,
      ratingTrend,
    };
  }, [rated]);

  if (rated.length < 3) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-trainer-surface border border-white/8 rounded-[16px] p-4"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Star size={13} className="text-trainer-gold fill-trainer-gold" />
          <p className="text-xs text-white/35 uppercase tracking-widest font-semibold">
            Session Ratings
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          {ratingTrend && (
            <span className={cn("text-xs font-bold", ratingTrend === "up" ? "text-trainer-success" : "text-red-400")}>
              {ratingTrend === "up" ? "↑" : "↓"}
            </span>
          )}
          {(() => {
            const greatPct = Math.round(((dist[5] + dist[4]) / rated.length) * 100);
            return greatPct > 0 ? (
              <span className={cn(
                "text-[9px] font-bold px-1.5 py-0.5 rounded-full border tabular-nums",
                greatPct >= 70
                  ? "text-trainer-success bg-trainer-success/8 border-trainer-success/20"
                  : "text-white/25 bg-white/4 border-white/10"
              )}>
                {greatPct}% great
              </span>
            ) : null;
          })()}
          {dist[5] > 0 && (
            <span className="text-[9px] font-bold text-trainer-gold/70 bg-trainer-gold/8 border border-trainer-gold/20 px-1.5 py-0.5 rounded-full tabular-nums">
              {dist[5]}×★★★★★
            </span>
          )}
          <Star size={10} className="text-trainer-gold fill-trainer-gold" />
          <span
            className={cn(
              "text-sm font-bold tabular-nums ml-0.5",
              avg >= 4 ? "text-trainer-gold" : avg >= 3 ? "text-trainer-success" : "text-amber-400"
            )}
          >
            {avg.toFixed(1)} avg
          </span>
        </div>
      </div>

      {/* Distribution bars */}
      <div className="flex flex-col gap-2 mb-4">
        {([5, 4, 3, 2, 1] as const).map((star) => {
          const count = dist[star] ?? 0;
          const pct = rated.length > 0 ? (count / rated.length) * 100 : 0;
          return (
            <div key={star} className="flex items-center gap-2.5">
              <div className="flex items-center gap-0.5 w-8 justify-end shrink-0">
                <span className="text-[10px] text-white/30 tabular-nums">{star}</span>
                <Star size={8} className="text-white/20 fill-white/20" />
              </div>
              <div className="flex-1 h-2 bg-white/6 rounded-full overflow-hidden">
                <motion.div
                  className={cn(
                    "h-full rounded-full",
                    star === 5
                      ? "bg-trainer-gold"
                      : star === 4
                      ? "bg-trainer-success"
                      : star === 3
                      ? "bg-trainer-indigo"
                      : star === 2
                      ? "bg-amber-400"
                      : "bg-red-400/70"
                  )}
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.5, ease: "easeOut", delay: (5 - star) * 0.06 }}
                />
              </div>
              <span className="text-[10px] text-white/30 tabular-nums w-4 shrink-0 text-right">
                {count}
              </span>
            </div>
          );
        })}
      </div>

      {/* Dot timeline — most recent 20 sessions */}
      <div className="flex flex-wrap gap-1.5">
        {rated.slice(-20).map((s, i) => {
          const r = s.rating ?? 3;
          return (
            <motion.div
              key={s.id}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.025, type: "spring", stiffness: 400, damping: 22 }}
              className={cn(
                "w-3.5 h-3.5 rounded-full border",
                r === 5
                  ? "bg-trainer-gold/70 border-trainer-gold/40"
                  : r === 4
                  ? "bg-trainer-success/70 border-trainer-success/40"
                  : r === 3
                  ? "bg-trainer-indigo/70 border-trainer-indigo/40"
                  : r === 2
                  ? "bg-amber-400/70 border-amber-400/40"
                  : "bg-red-400/60 border-red-400/30"
              )}
              title={`${s.splitDay} — ${r}/5`}
            />
          );
        })}
      </div>

      <p className="text-[9px] text-white/15 mt-2 text-right">
        Last {rated.length} rated sessions · oldest → newest
      </p>
    </motion.div>
  );
}
