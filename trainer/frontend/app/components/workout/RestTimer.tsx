"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Play, Pause, SkipForward, Timer } from "lucide-react";
import { cn } from "@/app/lib/utils";

interface RestTimerProps {
  open: boolean;
  seconds: number;
  onClose: () => void;
}

const PRESETS = [60, 90, 120, 180] as const;

function formatTime(s: number): string {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return m > 0
    ? `${m}:${String(sec).padStart(2, "0")}`
    : `${sec}s`;
}

export function RestTimer({ open, seconds, onClose }: RestTimerProps) {
  const [total, setTotal] = useState(seconds);
  const [remaining, setRemaining] = useState(seconds);
  const [running, setRunning] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Reset when opened with new duration
  useEffect(() => {
    if (open) {
      setTotal(seconds);
      setRemaining(seconds);
      setRunning(true);
    }
  }, [open, seconds]);

  // Tick
  useEffect(() => {
    if (!open || !running) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }
    intervalRef.current = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          clearInterval(intervalRef.current!);
          setRunning(false);
          if (typeof navigator !== "undefined" && navigator.vibrate) {
            navigator.vibrate([100, 50, 100]);
          }
          setTimeout(onClose, 800);
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current!);
  }, [open, running, onClose]);

  const handlePreset = useCallback((s: number) => {
    setTotal(s);
    setRemaining(s);
    setRunning(true);
  }, []);

  const progress = total > 0 ? remaining / total : 0;
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const strokeDash = circumference * (1 - progress);

  const progressColor =
    progress > 0.5
      ? "#6C63FF"
      : progress > 0.25
      ? "#F59E0B"
      : "#EF4444";

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-40"
          />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 380, damping: 38 }}
            className="fixed bottom-0 inset-x-0 z-50 bg-trainer-elevated border-t border-white/10 rounded-t-[28px] px-6 pt-5 pb-12 flex flex-col items-center"
          >
            {/* Handle */}
            <div className="w-10 h-1 bg-white/15 rounded-full mb-6" />

            {/* Title row */}
            <div className="flex items-center justify-between w-full mb-8">
              <div className="flex items-center gap-2">
                <Timer size={15} className="text-trainer-indigo" />
                <p className="text-sm font-bold text-white">Rest Timer</p>
              </div>
              <button
                onClick={onClose}
                className="w-7 h-7 rounded-full bg-white/8 flex items-center justify-center text-white/40 hover:text-white transition-colors"
              >
                <X size={14} />
              </button>
            </div>

            {/* Ring + time */}
            <div className="relative flex items-center justify-center mb-8">
              <svg width="136" height="136" className="-rotate-90">
                <circle
                  cx="68" cy="68" r={radius}
                  strokeWidth="6"
                  stroke="rgba(255,255,255,0.06)"
                  fill="none"
                />
                <motion.circle
                  cx="68" cy="68" r={radius}
                  strokeWidth="6"
                  stroke={progressColor}
                  fill="none"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDash}
                  transition={{ duration: 0.4, ease: "linear" }}
                />
              </svg>
              <div className="absolute flex flex-col items-center gap-0.5">
                <motion.p
                  key={remaining}
                  initial={{ scale: 0.85, opacity: 0.6 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.15 }}
                  className={cn(
                    "text-4xl font-black tabular-nums leading-none",
                    remaining === 0 ? "text-trainer-success" : "text-white"
                  )}
                >
                  {remaining === 0 ? "Go!" : formatTime(remaining)}
                </motion.p>
                <p className="text-[10px] text-white/30 uppercase tracking-widest">
                  {remaining === 0 ? "Rest complete" : "remaining"}
                </p>
              </div>
            </div>

            {/* Preset buttons */}
            <div className="flex gap-2 mb-6">
              {PRESETS.map((s) => (
                <button
                  key={s}
                  onClick={() => handlePreset(s)}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-xs font-bold transition-all",
                    total === s && remaining > 0
                      ? "bg-trainer-indigo text-white"
                      : "bg-white/8 text-white/40 hover:text-white"
                  )}
                >
                  {s < 60 ? `${s}s` : `${s / 60}m${s % 60 ? String(s % 60).padStart(2, "0") + "s" : ""}`}
                </button>
              ))}
            </div>

            {/* Controls */}
            <div className="flex items-center gap-4">
              <motion.button
                whileTap={{ scale: 0.88 }}
                onClick={() => setRunning((v) => !v)}
                className="w-14 h-14 rounded-full bg-trainer-indigo/15 border border-trainer-indigo/30 flex items-center justify-center text-trainer-indigo hover:bg-trainer-indigo/25 transition-colors"
              >
                {running ? <Pause size={22} /> : <Play size={22} />}
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.88 }}
                onClick={onClose}
                className="w-12 h-12 rounded-full bg-white/6 border border-white/10 flex items-center justify-center text-white/40 hover:text-white transition-colors"
                aria-label="Skip rest"
              >
                <SkipForward size={18} />
              </motion.button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
