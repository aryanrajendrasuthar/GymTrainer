"use client";

import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, Play, X, Dumbbell, Heart } from "lucide-react";
import { usePendingSessionStore, type PendingSession, type PendingSlot } from "@/app/store/pendingSessionStore";

const SLOT_LABELS: Record<PendingSlot, string> = {
  morning: "Morning",
  afternoon: "Afternoon",
  evening: "Evening",
  anytime: "Later today",
};

const SLOT_COLORS: Record<PendingSlot, string> = {
  morning: "text-amber-400",
  afternoon: "text-sky-400",
  evening: "text-violet-400",
  anytime: "text-white/50",
};

function SessionChip({ session, onRemove }: { session: PendingSession; onRemove: () => void }) {
  const workoutCount = session.exercises.filter((e) => e.type === "workout").length;
  const physioCount = session.exercises.filter((e) => e.type === "physio").length;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -16, height: 0 }}
      className="flex items-center gap-3 p-3.5 rounded-[14px] bg-trainer-elevated border border-trainer-indigo/20"
    >
      <div className="w-9 h-9 rounded-[10px] bg-trainer-indigo/15 flex items-center justify-center shrink-0">
        <Clock size={16} className="text-trainer-indigo" />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-white truncate">{session.dayName}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className={`text-[11px] font-semibold ${SLOT_COLORS[session.slot]}`}>
            {SLOT_LABELS[session.slot]}
          </span>
          <span className="text-white/20">·</span>
          {workoutCount > 0 && (
            <span className="flex items-center gap-1 text-[11px] text-white/35">
              <Dumbbell size={10} />
              {workoutCount}
            </span>
          )}
          {physioCount > 0 && (
            <span className="flex items-center gap-1 text-[11px] text-white/35">
              <Heart size={10} />
              {physioCount}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={onRemove}
          className="w-7 h-7 rounded-full bg-white/6 flex items-center justify-center text-white/25 hover:text-white/60 transition-colors"
        >
          <X size={13} />
        </button>
        <Link
          href={`/workout?pending=${session.id}`}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] bg-trainer-indigo text-white text-xs font-bold hover:bg-trainer-indigo-hover active:scale-95 transition-all"
        >
          <Play size={11} fill="currentColor" />
          Start
        </Link>
      </div>
    </motion.div>
  );
}

export function PendingSessionCard() {
  const { todaySessions, removeSession } = usePendingSessionStore();
  const sessions = todaySessions();

  if (sessions.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col gap-2.5"
    >
      <p className="text-[11px] font-semibold text-white/35 uppercase tracking-widest px-0.5">
        Scheduled for later today
      </p>
      <AnimatePresence>
        {sessions.map((session) => (
          <SessionChip
            key={session.id}
            session={session}
            onRemove={() => removeSession(session.id)}
          />
        ))}
      </AnimatePresence>
    </motion.div>
  );
}
