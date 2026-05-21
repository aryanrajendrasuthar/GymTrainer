"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { ChevronRight, Dumbbell, Clock, TrendingUp, Star } from "lucide-react";
import { type WorkoutSession } from "@/app/types";
import { formatVolume, formatRelativeDate, cn } from "@/app/lib/utils";
import { SessionDetailSheet } from "@/app/components/dashboard/SessionDetailSheet";

interface RecentSessionCardProps {
  sessions: WorkoutSession[];
  weightUnit: "kg" | "lb";
}

export function RecentSessionCard({ sessions, weightUnit }: RecentSessionCardProps) {
  const [selected, setSelected] = useState<WorkoutSession | null>(null);

  if (sessions.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.25 }}
        className="rounded-[16px] bg-trainer-surface border border-white/8 p-5"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-white/70">Recent Sessions</h3>
        </div>
        <div className="flex flex-col items-center gap-3 py-6">
          <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center">
            <Dumbbell className="w-5 h-5 text-white/20" />
          </div>
          <p className="text-sm text-white/35 text-center">
            No sessions yet.
            <br />
            Start your first workout above.
          </p>
        </div>
      </motion.div>
    );
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.25 }}
        className="rounded-[16px] bg-trainer-surface border border-white/8 p-5"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-white/70">Recent Sessions</h3>
          <Link
            href="/progress"
            className="flex items-center gap-0.5 text-xs text-trainer-indigo/80 hover:text-trainer-indigo transition-colors"
          >
            View all
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="flex flex-col divide-y divide-white/5">
          {sessions.map((session, i) => (
            <motion.button
              key={session.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + i * 0.06 }}
              onClick={() => setSelected(session)}
              className={cn(
                "flex items-center gap-3 py-3.5 w-full text-left hover:bg-white/3 transition-colors rounded-[10px] px-1 -mx-1",
                i === 0 && "pt-0"
              )}
            >
              {/* Day marker */}
              <div className="w-9 h-9 rounded-[10px] bg-trainer-indigo/12 border border-trainer-indigo/20 flex items-center justify-center shrink-0">
                <Dumbbell className="w-4 h-4 text-trainer-indigo/70" />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white/85 truncate">
                  {session.splitDay}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                  <p className="text-xs text-white/35">
                    {formatRelativeDate(session.date)}
                  </p>
                  {session.exercisesCompleted.length > 0 && (
                    <span className="text-[10px] text-white/22 font-medium tabular-nums">
                      · {session.exercisesCompleted.length} exs · {session.exercisesCompleted.reduce((s, e) => s + e.sets.length, 0)} sets
                    </span>
                  )}
                  {session.rating && (
                    <div className="flex gap-0.5">
                      {[1,2,3,4,5].map((s) => (
                        <Star
                          key={s}
                          size={8}
                          className={cn(
                            s <= session.rating! ? "text-trainer-gold fill-trainer-gold" : "text-white/12"
                          )}
                        />
                      ))}
                    </div>
                  )}
                </div>
                {session.sessionNotes && (
                  <p className="text-[10px] text-white/20 italic mt-0.5 truncate max-w-[180px]">
                    {session.sessionNotes}
                  </p>
                )}
              </div>

              {/* Stats */}
              <div className="flex flex-col items-end gap-1 shrink-0">
                <div className="flex items-center gap-1">
                  <TrendingUp className="w-3 h-3 text-trainer-success/70" />
                  <span className="text-xs font-semibold text-white/70">
                    {formatVolume(session.totalVolumeKg, weightUnit)}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-white/25" />
                  <span className="text-xs text-white/35">
                    {session.durationMinutes}m
                  </span>
                </div>
              </div>

              <ChevronRight className="w-3.5 h-3.5 text-white/15 shrink-0" />
            </motion.button>
          ))}
        </div>
      </motion.div>

      <SessionDetailSheet
        session={selected}
        open={selected !== null}
        onClose={() => setSelected(null)}
      />
    </>
  );
}
