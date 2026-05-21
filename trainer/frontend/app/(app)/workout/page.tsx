"use client";

import { Suspense, useState, useMemo, useEffect, useRef, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  ChevronLeft,
  ChevronRight,
  Dumbbell,
  Timer,
  TrendingUp,
  AlertTriangle,
  Scissors,
  RefreshCw,
  Play,
  SkipForward,
  Zap,
  Calculator,
  Trophy,
} from "lucide-react";
import { useUserStore } from "@/app/store/userStore";
import { usePhysioStore } from "@/app/store/physioStore";
import { sessionsApi } from "@/app/lib/api";
import { useSessionStore } from "@/app/store/sessionStore";
import { useSettingsStore } from "@/app/store/settingsStore";
import { useSession } from "@/app/hooks/useSession";
import {
  useProgressiveOverload,
  useSuggestedWeight,
} from "@/app/hooks/useProgressiveOverload";
import { useExerciseHistory } from "@/app/hooks/useExerciseHistory";
import { getSplitById } from "@/app/data/splits";
import { exerciseMap, getAlternateExercise } from "@/app/data/exercises";
import { useCustomExerciseStore } from "@/app/store/customExerciseStore";
import { getWarmupForSession, type SessionTag } from "@/app/data/protocols";
import { usePendingSessionStore } from "@/app/store/pendingSessionStore";
import { useAchievementStore, checkSessionAchievements, checkExerciseAchievements } from "@/app/store/achievementStore";
import { useGoalStore } from "@/app/store/goalStore";
import { useNotificationStore } from "@/app/store/notificationStore";
import { SetLogger } from "@/app/components/workout/SetLogger";
import { WarmupRamp } from "@/app/components/workout/WarmupRamp";
import { PlateCalculator } from "@/app/components/workout/PlateCalculator";
import { VolumeLandmarkCard } from "@/app/components/workout/VolumeLandmarkCard";
import { ReadinessCheck, type Readiness } from "@/app/components/workout/ReadinessCheck";
import { VoiceCoach } from "@/app/components/workout/VoiceCoach";
import { PreviousPerformancePanel } from "@/app/components/workout/PreviousPerformancePanel";
import { ProgressiveOverloadSuggestion } from "@/app/components/workout/ProgressiveOverloadSuggestion";
import { NextExerciseButton } from "@/app/components/workout/NextExerciseButton";
import { SessionComplete } from "@/app/components/workout/SessionComplete";
import { SplitSessionSheet } from "@/app/components/workout/SplitSessionSheet";
import { RestTimer } from "@/app/components/workout/RestTimer";
import { Button } from "@/app/components/ui/Button";
import { Badge } from "@/app/components/ui/Badge";
import { GymBackground } from "@/app/components/ui/GymBackground";
import { type WorkoutSession, type MuscleGroup, type Exercise } from "@/app/types";
import { cn, formatVolume } from "@/app/lib/utils";
import { estimateOneRepMax } from "@/app/lib/progression-engine";

// ─── Types ─────────────────────────────────────────────────────────────────────

type WorkoutPhase = "pre" | "active" | "complete";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function muscleGroupsToSessionTag(muscleGroups: string[]): SessionTag {
  const groups = muscleGroups.map((g) => g.toLowerCase());
  if (groups.some((g) => ["chest", "triceps", "anterior-deltoid"].includes(g))) return "push";
  if (groups.some((g) => ["back", "biceps", "rear-delts", "lats", "rhomboids"].includes(g))) return "pull";
  if (groups.some((g) => ["quads", "hamstrings", "glutes", "calves", "legs"].includes(g))) return "legs";
  if (groups.some((g) => ["shoulders", "traps"].includes(g))) return "shoulders";
  if (groups.some((g) => ["biceps", "triceps", "arms"].includes(g))) return "arms";
  if (groups.some((g) => ["core", "abs"].includes(g))) return "core";
  return "upper";
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function formatElapsed(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function collectMusclesTrained(exercises: Exercise[]): MuscleGroup[] {
  const set = new Set<MuscleGroup>();
  exercises.forEach((ex) => {
    ex.primaryMuscles.forEach((m) => set.add(m));
  });
  return Array.from(set);
}

// ─── Superset helpers ─────────────────────────────────────────────────────────

function getSupersetPairKey(idA: string, idB: string): string {
  return `${idA}||${idB}`;
}

// ─── SupersetTransitionOverlay ────────────────────────────────────────────────

function SupersetTransitionOverlay({
  exerciseName,
  onDismiss,
}: {
  exerciseName: string;
  onDismiss: () => void;
}) {
  const [countdown, setCountdown] = useState(10);
  const onDismissRef = useRef(onDismiss);
  onDismissRef.current = onDismiss;

  useEffect(() => {
    const id = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(id);
          onDismissRef.current();
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/88 backdrop-blur-sm z-40 flex flex-col items-center justify-center gap-5 px-6"
      onClick={onDismiss}
    >
      <div className="flex items-center gap-2 text-amber-400">
        <Zap size={16} className="fill-current" />
        <p className="text-xs font-bold uppercase tracking-widest">Superset — no rest</p>
      </div>
      <div className="text-center space-y-1">
        <p className="text-white/40 text-sm">Up next</p>
        <p className="text-2xl font-black text-white leading-tight">{exerciseName}</p>
      </div>
      <div className="w-16 h-16 rounded-full border-2 border-amber-400/40 flex items-center justify-center">
        <p className="text-2xl font-black text-amber-400 tabular-nums">{countdown}</p>
      </div>
      <p className="text-xs text-white/25">Tap anywhere to continue</p>
    </motion.div>
  );
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function WorkoutHeader({
  elapsed,
  current,
  total,
  volumeKg,
  unit,
  onAbandon,
  voiceCoachSlot,
}: {
  elapsed: number;
  current: number;
  total: number;
  volumeKg: number;
  unit: "kg" | "lb";
  onAbandon: () => void;
  voiceCoachSlot?: React.ReactNode;
}) {
  return (
    <div className="sticky top-0 z-30 bg-trainer-black/95 backdrop-blur-md border-b border-white/8 px-4 py-3">
      <div className="flex items-center justify-between">
        <button
          onClick={onAbandon}
          className="w-8 h-8 rounded-full bg-white/8 flex items-center justify-center text-white/50 hover:text-white transition-colors"
          aria-label="Abandon workout"
        >
          <X size={16} />
        </button>

        <div className="flex items-center gap-4 text-center">
          <div className="flex items-center gap-1.5">
            <Timer size={13} className="text-trainer-indigo" />
            <span className="text-sm font-bold tabular-nums text-white">
              {formatElapsed(elapsed)}
            </span>
          </div>
          <div className="w-px h-4 bg-white/10" />
          <span className="text-xs text-white/40">
            {current}/{total}
          </span>
          <div className="w-px h-4 bg-white/10" />
          <div className="flex items-center gap-1">
            <TrendingUp size={13} className="text-trainer-success/70" />
            <span className="text-xs font-semibold text-white/70 tabular-nums">
              {formatVolume(volumeKg, unit)}
            </span>
          </div>
        </div>

        {voiceCoachSlot ?? <div className="w-8" />}
      </div>

      {/* Progress bar */}
      <div className="mt-2 h-1 bg-white/8 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-trainer-indigo rounded-full"
          animate={{ width: `${(current / total) * 100}%` }}
          transition={{ duration: 0.4 }}
        />
      </div>
    </div>
  );
}

// ─── Per-exercise set view ──────────────────────────────────────────────────────

function ExerciseView({
  exercise,
  exerciseIndex,
  totalExercises,
  completedSets,
  targetSets,
  targetRepsMin,
  targetRepsMax,
  prefillWeight,
  unit,
  showRpe,
  showPreviousPerformance,
  allLogs,
  sessionDates,
  suggestion,
  decisions,
  onSetDone,
  onAcceptSuggestion,
  onIgnoreSuggestion,
  onSetCustomWeight,
  onNext,
  onSkip,
  onSwap,
  isLast,
  injuryWarning,
  supersetPartnerName,
  dropsetMode,
  onToggleDropset,
  onEditSet,
  onDeleteSet,
  nextExercise,
}: {
  exercise: Exercise;
  exerciseIndex: number;
  totalExercises: number;
  completedSets: { setNumber: number; repsCompleted: number; weightUsed: number; weightUnit: "kg" | "lb"; rpe?: number; notes?: string }[];
  targetSets: number;
  targetRepsMin: number;
  targetRepsMax: number;
  prefillWeight: number;
  unit: "kg" | "lb";
  showRpe: boolean;
  showPreviousPerformance: boolean;
  allLogs: import("@/app/types").ExerciseLog[];
  sessionDates: Record<string, string>;
  suggestion: import("@/app/types").ProgressionSuggestion | undefined;
  decisions: Record<string, import("@/app/hooks/useProgressiveOverload").OverloadDecision>;
  onSetDone: (set: Omit<import("@/app/types").SetLog, "loggedAt">) => void;
  onAcceptSuggestion: () => void;
  onIgnoreSuggestion: () => void;
  onSetCustomWeight: (w: number) => void;
  onNext: () => void;
  onSkip: () => void;
  onSwap?: () => void;
  isLast: boolean;
  injuryWarning?: string;
  supersetPartnerName?: string;
  dropsetMode?: boolean;
  onToggleDropset?: () => void;
  onEditSet?: (setNumber: number, updates: { repsCompleted: number; weightUsed: number; rpe?: number }) => void;
  onDeleteSet?: (setNumber: number) => void;
  nextExercise?: Exercise;
}) {
  const [showVideo, setShowVideo] = useState(false);
  const [skipConfirm, setSkipConfirm] = useState(false);
  const [showPlates, setShowPlates] = useState(false);
  const [prFlash, setPrFlash] = useState(false);
  const history = useExerciseHistory(exercise.id, allLogs, sessionDates);
  const currentSetNumber = completedSets.length + 1;
  const allTargetsDone = completedSets.length >= targetSets;

  const bestAtReps = useCallback((reps: number): number | null => {
    let best = 0;
    for (const log of allLogs) {
      if (log.exerciseId !== exercise.id) continue;
      for (const s of log.sets) {
        if (s.repsCompleted === reps && s.weightUsed > best) best = s.weightUsed;
      }
    }
    return best > 0 ? best : null;
  }, [allLogs, exercise.id]);

  const nextLastWeight = useMemo(() => {
    if (!nextExercise) return null;
    let best = 0;
    for (const log of allLogs) {
      if (log.exerciseId !== nextExercise.id) continue;
      for (const s of log.sets) {
        if (s.weightUsed > best) best = s.weightUsed;
      }
    }
    return best > 0 ? best : null;
  }, [nextExercise, allLogs]);

  const lastSession =
    history.history.length > 0
      ? { date: history.history[0].date, sets: history.history[0].sets }
      : undefined;

  const prevData = {
    lastSession,
    personalBest:
      history.allTimeBest1RM > 0
        ? { weightKg: history.currentBestWeight, reps: history.history[0]?.topSetReps ?? 1, unit }
        : undefined,
    isFirstTime: history.totalSessions === 0,
  };

  const resolvedPrefill = useSuggestedWeight(
    exercise.id,
    decisions,
    suggestion ? [suggestion] : [],
    history.currentBestWeight || prefillWeight
  );

  // In dropset mode, each set uses 85% of the previous set's weight
  const dropsetPrefill = (() => {
    if (!dropsetMode || completedSets.length === 0) return null;
    const lastWeight = completedSets[completedSets.length - 1].weightUsed;
    const step = unit === "lb" ? 5 : 2.5;
    return Math.max(0, Math.round(lastWeight * 0.85 / step) * step);
  })();

  const activePrefill = dropsetPrefill ?? resolvedPrefill;

  function handleSetDone(set: Omit<import("@/app/types").SetLog, "loggedAt">) {
    const e1rm = estimateOneRepMax(set.weightUsed, set.repsCompleted);
    if (history.allTimeBest1RM > 0 && e1rm > history.allTimeBest1RM) {
      setPrFlash(true);
      setTimeout(() => setPrFlash(false), 2400);
    }
    onSetDone(set);
  }

  return (
    <motion.div
      key={exercise.id}
      initial={{ opacity: 0, x: 32 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -32 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="flex flex-col gap-4 px-4 pb-32"
    >
      {/* PR flash banner */}
      <AnimatePresence>
        {prFlash && (
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ type: "spring", stiffness: 380, damping: 28 }}
            className="fixed top-[60px] inset-x-0 flex justify-center z-50 pointer-events-none px-4"
          >
            <div className="flex items-center gap-2 bg-trainer-black/95 border border-trainer-gold/50 backdrop-blur-md rounded-full px-5 py-2.5 shadow-xl shadow-trainer-gold/15">
              <Trophy size={13} className="text-trainer-gold" />
              <span className="text-sm font-black text-trainer-gold tracking-wide">New Personal Record</span>
              <TrendingUp size={13} className="text-trainer-gold" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Injury warning */}
      <AnimatePresence>
        {injuryWarning && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 flex items-start gap-2.5 px-3 py-2.5 rounded-[10px] bg-trainer-danger/10 border border-trainer-danger/30"
          >
            <AlertTriangle size={14} className="text-trainer-danger shrink-0 mt-0.5" />
            <p className="text-xs text-trainer-danger leading-relaxed">{injuryWarning}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Exercise header */}
      <div className="pt-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <p className="text-xs text-white/35 font-medium uppercase tracking-wider mb-1">
              Exercise {exerciseIndex + 1} of {totalExercises}
            </p>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl font-bold text-white leading-tight">
                {exercise.name}
              </h2>
              {supersetPartnerName && (
                <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-[6px] bg-amber-400/15 border border-amber-400/25 text-amber-400 text-[10px] font-bold">
                  <Zap size={8} className="fill-current" /> SS
                </span>
              )}
              {dropsetMode && (
                <span className="px-1.5 py-0.5 rounded-[6px] bg-red-500/15 border border-red-500/25 text-red-400 text-[10px] font-bold">DS</span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Video demo button */}
            <motion.button
              whileTap={{ scale: 0.88 }}
              onClick={() => setShowVideo(true)}
              className="w-9 h-9 rounded-[10px] bg-trainer-indigo/10 border border-trainer-indigo/25 flex items-center justify-center text-trainer-indigo/70 hover:text-trainer-indigo hover:border-trainer-indigo/50 transition-colors"
              aria-label="Watch form video"
              title="Watch form video"
            >
              <Play size={14} />
            </motion.button>
            {onToggleDropset && (
              <motion.button
                whileTap={{ scale: 0.88 }}
                onClick={onToggleDropset}
                className={cn(
                  "w-9 h-9 rounded-[10px] border flex items-center justify-center text-[11px] font-black transition-colors",
                  dropsetMode
                    ? "bg-red-500/15 border-red-500/30 text-red-400 hover:bg-red-500/25"
                    : "bg-white/6 border-white/10 text-white/35 hover:text-white/65 hover:border-white/20"
                )}
                aria-label="Toggle dropset mode"
                title="Dropset mode"
              >
                DS
              </motion.button>
            )}
            {onSwap && (
              <motion.button
                whileTap={{ scale: 0.88 }}
                onClick={onSwap}
                className="w-9 h-9 rounded-[10px] bg-white/6 border border-white/10 flex items-center justify-center text-white/40 hover:text-white/70 hover:border-white/20 transition-colors"
                aria-label="Swap exercise"
                title="Swap exercise"
              >
                <RefreshCw size={15} />
              </motion.button>
            )}
            <div className="w-11 h-11 rounded-[12px] bg-trainer-indigo/15 flex items-center justify-center shrink-0">
              <Dumbbell size={20} className="text-trainer-indigo" />
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5 mt-3">
          {exercise.primaryMuscles.slice(0, 3).map((m) => (
            <Badge key={m} color="indigo" size="sm" className="capitalize text-[10px]">
              {m.replace(/-/g, " ")}
            </Badge>
          ))}
          <Badge color="muted" size="sm" className="capitalize text-[10px]">
            {exercise.movementType}
          </Badge>
        </div>
        {supersetPartnerName && (
          <p className="text-[11px] text-amber-400/70 mt-2">
            Paired with <span className="font-semibold">{supersetPartnerName}</span>
          </p>
        )}
      </div>

      {/* Previous performance */}
      {showPreviousPerformance && (
        <PreviousPerformancePanel data={prevData} unit={unit} />
      )}

      {/* Progression suggestion */}
      {suggestion && !decisions[exercise.id] && (
        <ProgressiveOverloadSuggestion
          suggestion={suggestion}
          unit={unit}
          onAccept={(w) => {
            onSetCustomWeight(w);
            onAcceptSuggestion();
          }}
          onIgnore={onIgnoreSuggestion}
        />
      )}

      {/* Set target info */}
      <div className="flex items-center justify-between text-xs">
        <span className="text-white/35">
          Target: {targetSets} sets × {targetRepsMin}–{targetRepsMax} reps
        </span>
        <div className="flex items-center gap-2">
          {exercise.movementType === "compound" && activePrefill > 0 && (
            <button
              onClick={() => setShowPlates((v) => !v)}
              className={cn(
                "flex items-center gap-1 px-2 py-0.5 rounded-[6px] text-[11px] font-semibold transition-colors border",
                showPlates
                  ? "bg-trainer-indigo/15 border-trainer-indigo/30 text-trainer-indigo"
                  : "bg-white/5 border-white/10 text-white/35 hover:text-white/60"
              )}
            >
              <Calculator size={10} />
              Plates
            </button>
          )}
          <span className={cn(
            "font-semibold",
            allTargetsDone ? "text-trainer-success" : "text-white/50"
          )}>
            {completedSets.length}/{targetSets} sets done
          </span>
        </div>
      </div>

      {/* Set progress dots */}
      <div className="flex items-center gap-2">
        {Array.from({ length: targetSets }, (_, i) => {
          const done = i < completedSets.length;
          const isNext = i === completedSets.length && !allTargetsDone;
          return (
            <motion.div
              key={i}
              animate={{
                width: done || isNext ? 12 : 8,
                height: done || isNext ? 12 : 8,
                backgroundColor: done
                  ? "#22c55e"
                  : isNext
                  ? "rgba(255,255,255,0.28)"
                  : "rgba(255,255,255,0.10)",
              }}
              transition={{ type: "spring", stiffness: 420, damping: 22 }}
              style={{ borderRadius: 999 }}
            />
          );
        })}
      </div>

      {/* Plate calculator inline panel */}
      <AnimatePresence>
        {showPlates && exercise.movementType === "compound" && activePrefill > 0 && (
          <PlateCalculator
            weightKg={unit === "lb" ? activePrefill / 2.20462 : activePrefill}
            unit={unit}
          />
        )}
      </AnimatePresence>

      {/* Completed sets */}
      {completedSets.length > 0 && (
        <div className="flex flex-col gap-1.5">
          {completedSets.map((s) => (
            <SetLogger
              key={s.setNumber}
              setNumber={s.setNumber}
              targetRepsMin={targetRepsMin}
              targetRepsMax={targetRepsMax}
              targetSets={targetSets}
              unit={unit}
              isCompleted
              completedLog={{ ...s, loggedAt: new Date().toISOString() }}
              onSetDone={() => {}}
              onEditSet={onEditSet}
              onDeleteSet={onDeleteSet}
            />
          ))}
        </div>
      )}

      {/* Warm-up ramp for compound movements on first set */}
      {!allTargetsDone && completedSets.length === 0 && exercise.movementType === "compound" && !dropsetMode && resolvedPrefill > 0 && (
        <WarmupRamp
          workingWeightKg={unit === "lb" ? resolvedPrefill / 2.20462 : resolvedPrefill}
          unit={unit}
        />
      )}

      {/* Dropset drop indicator */}
      {dropsetMode && completedSets.length > 0 && !allTargetsDone && (
        <div className="flex items-center gap-2 px-1">
          <div className="flex-1 h-px bg-red-500/20" />
          <span className="text-[10px] font-bold text-red-400/70 uppercase tracking-widest">
            Drop {completedSets.length}
          </span>
          <div className="flex-1 h-px bg-red-500/20" />
        </div>
      )}

      {/* Active set logger */}
      {!allTargetsDone && (
        <SetLogger
          setNumber={currentSetNumber}
          targetRepsMin={targetRepsMin}
          targetRepsMax={targetRepsMax}
          targetSets={targetSets}
          prefillWeight={activePrefill}
          unit={unit}
          showRpe={showRpe}
          restSuggestion={`Rest ${exercise.movementType === "compound" ? 90 : 60}s between sets`}
          bestAtReps={bestAtReps}
          onSetDone={handleSetDone}
        />
      )}

      {/* Next exercise / complete */}
      {allTargetsDone && (
        <div className="pt-2">
          <NextExerciseButton
            onClick={onNext}
            isLast={isLast}
            label="Next Exercise"
          />
        </div>
      )}

      {/* Skip exercise */}
      {!allTargetsDone && !isLast && (
        <AnimatePresence>
          {!skipConfirm ? (
            <motion.button
              key="skip-btn"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              onClick={() => setSkipConfirm(true)}
              className="flex items-center justify-center gap-1.5 text-xs text-white/25 hover:text-white/50 transition-colors py-1"
            >
              <SkipForward size={12} />
              Skip this exercise
            </motion.button>
          ) : (
            <motion.div
              key="skip-confirm"
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              className="bg-trainer-surface border border-white/10 rounded-[12px] p-4 space-y-3"
            >
              <p className="text-sm text-white/70 text-center">Skip this exercise?</p>
              <div className="flex gap-3">
                <button
                  onClick={() => { setSkipConfirm(false); onSkip(); }}
                  className="flex-1 py-2.5 rounded-[10px] bg-white/8 text-sm font-semibold text-white hover:bg-white/12 transition-colors"
                >
                  Yes, skip
                </button>
                <button
                  onClick={() => setSkipConfirm(false)}
                  className="flex-1 py-2.5 rounded-[10px] bg-trainer-indigo/15 text-sm font-semibold text-trainer-indigo hover:bg-trainer-indigo/25 transition-colors"
                >
                  Keep going
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      )}

      {/* Up next preview */}
      {nextExercise && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex items-center gap-2.5 px-3 py-2 rounded-[10px] bg-white/4 border border-white/6"
        >
          <ChevronRight size={11} className="text-white/20 shrink-0" />
          <span className="text-[10px] text-white/25 shrink-0">Up next</span>
          <span className="text-[10px] font-semibold text-white/50 flex-1 truncate">
            {nextExercise.name}
          </span>
          {nextLastWeight !== null && (
            <span className="text-[10px] text-white/25 tabular-nums shrink-0">
              Last: {unit === "lb" ? Math.round(nextLastWeight * 2.20462) : nextLastWeight}{unit}
            </span>
          )}
        </motion.div>
      )}

      {/* Video demo modal */}
      <AnimatePresence>
        {showVideo && (
          <>
            <motion.div
              key="video-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowVideo(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
            />
            <motion.div
              key="video-sheet"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 380, damping: 38 }}
              className="fixed bottom-0 inset-x-0 z-50 bg-trainer-elevated border-t border-white/10 rounded-t-[24px] pb-safe"
            >
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-9 h-1 rounded-full bg-white/15" />
              </div>
              <div className="px-4 pb-2 flex items-center justify-between">
                <p className="text-sm font-bold text-white">{exercise.name} — Form Video</p>
                <button
                  onClick={() => setShowVideo(false)}
                  className="w-7 h-7 rounded-full bg-white/8 flex items-center justify-center text-white/40"
                >
                  <X size={14} />
                </button>
              </div>
              <div className="aspect-video mx-4 mb-6 rounded-[14px] overflow-hidden bg-black">
                <iframe
                  src={`https://www.youtube-nocookie.com/embed/${exercise.youtubeId}?autoplay=1&rel=0&modestbranding=1`}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full"
                  title={`${exercise.name} form video`}
                />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Rest day view ─────────────────────────────────────────────────────────────

const REST_DAY_PROTOCOLS = [
  {
    name: "Hip Flexor Stretch",
    cue: "Kneel on one knee, push hips forward. 30s each side.",
    duration: "30s × 2",
    icon: "🦵",
  },
  {
    name: "Thoracic Rotation",
    cue: "Seated, arms crossed over chest, rotate left and right slowly.",
    duration: "10 reps × 2",
    icon: "🔄",
  },
  {
    name: "Cat-Cow Stretch",
    cue: "On hands and knees, arch and round your back alternately.",
    duration: "10 reps",
    icon: "🐱",
  },
  {
    name: "Doorframe Chest Opener",
    cue: "Place forearms on a doorframe, lean forward gently. Hold.",
    duration: "30s × 3",
    icon: "🚪",
  },
  {
    name: "Dead Hang",
    cue: "Hang from a pull-up bar with relaxed shoulders. Decompresses the spine.",
    duration: "20–30s",
    icon: "🏋️",
  },
  {
    name: "Pigeon Pose",
    cue: "Lay one shin horizontal on the floor, extend the other leg back. Hold.",
    duration: "60s each side",
    icon: "🧘",
  },
] as const;

const REST_DAY_TIPS = [
  { icon: "💤", text: "Aim for 7–9 hours of sleep — most muscle growth happens here." },
  { icon: "🥩", text: "Keep protein high (≥1.6g/kg). Your muscles repair even on rest days." },
  { icon: "💧", text: "Stay hydrated. Dehydration slows recovery and increases soreness." },
  { icon: "🚶", text: "Light walking (15–30 min) promotes blood flow without adding fatigue." },
] as const;

function RestDayView({ onBack }: { onBack: () => void }) {
  const [showMobility, setShowMobility] = useState(false);

  return (
    <div className="flex flex-col min-h-full pb-10">
      {/* Header */}
      <div className="px-5 pt-14 pb-6">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs text-white/35 hover:text-white/60 mb-5 transition-colors"
        >
          <ChevronLeft size={14} />
          Dashboard
        </button>
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-[12px] bg-trainer-indigo/10 flex items-center justify-center text-xl">
            😴
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white leading-tight">Rest Day</h1>
            <p className="text-sm text-white/35 mt-0.5">Recovery is training.</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4 px-5">
        {/* Recovery tips */}
        <div className="bg-trainer-surface border border-white/8 rounded-[18px] p-4">
          <p className="text-xs text-white/35 uppercase tracking-widest font-semibold mb-3">
            Recovery Checklist
          </p>
          <div className="flex flex-col gap-3">
            {REST_DAY_TIPS.map((tip) => (
              <div key={tip.icon} className="flex items-start gap-3">
                <span className="text-base leading-none mt-0.5 shrink-0">{tip.icon}</span>
                <p className="text-sm text-white/65 leading-relaxed">{tip.text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Mobility section */}
        <div className="bg-trainer-surface border border-white/8 rounded-[18px] p-4">
          <button
            onClick={() => setShowMobility((v) => !v)}
            className="flex items-center justify-between w-full"
          >
            <div>
              <p className="text-sm font-bold text-white text-left">Active Recovery Routine</p>
              <p className="text-xs text-white/35 mt-0.5 text-left">6 stretches · ~15 min</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-trainer-indigo font-semibold">
                {showMobility ? "Hide" : "View"}
              </span>
              {showMobility ? (
                <ChevronLeft size={14} className="text-white/30 rotate-90" />
              ) : (
                <ChevronRight size={14} className="text-white/30" />
              )}
            </div>
          </button>

          <AnimatePresence>
            {showMobility && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="border-t border-white/6 mt-4 pt-4 flex flex-col gap-3">
                  {REST_DAY_PROTOCOLS.map((p, i) => (
                    <motion.div
                      key={p.name}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="flex items-start gap-3 p-3 rounded-[12px] bg-trainer-elevated border border-white/6"
                    >
                      <span className="text-xl leading-none shrink-0 mt-0.5">{p.icon}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white/85">{p.name}</p>
                        <p className="text-xs text-white/40 leading-relaxed mt-0.5">{p.cue}</p>
                      </div>
                      <span className="text-[10px] font-semibold text-trainer-indigo/70 shrink-0 mt-0.5 bg-trainer-indigo/10 px-2 py-0.5 rounded-full">
                        {p.duration}
                      </span>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Back button */}
        <Button variant="secondary" fullWidth onClick={onBack}>
          <ChevronLeft size={16} />
          Back to Dashboard
        </Button>
      </div>
    </div>
  );
}

// ─── Pre-workout view ──────────────────────────────────────────────────────────

function PreWorkoutView({
  dayName,
  muscleGroups,
  exercises,
  isPendingSession,
  onBeginRequest,
  onSplit,
  supersetPairs,
  onToggleSuperset,
}: {
  dayName: string;
  muscleGroups: string[];
  exercises: Exercise[];
  isPendingSession: boolean;
  onBeginRequest: () => void;
  onSplit: () => void;
  supersetPairs?: Set<string>;
  onToggleSuperset?: (idA: string, idB: string) => void;
}) {
  const sessionTag = muscleGroupsToSessionTag(muscleGroups);
  const warmup = getWarmupForSession(sessionTag);

  return (
    <div className="flex flex-col min-h-full">
      {/* Header */}
      <div className="px-5 pt-14 pb-6">
        <p className="text-xs text-trainer-indigo/80 font-semibold uppercase tracking-wider mb-1">
          {isPendingSession ? "Scheduled Session" : "Today's Workout"}
        </p>
        <div className="flex items-center gap-2 flex-wrap">
          <h1 className="text-2xl font-bold text-white">{dayName}</h1>
        </div>
        <div className="flex flex-wrap gap-1.5 mt-3">
          {muscleGroups.map((m) => (
            <span
              key={m}
              className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-white/8 text-white/60 capitalize"
            >
              {m}
            </span>
          ))}
        </div>
      </div>

      {/* Warmup protocol */}
      {warmup && !isPendingSession && (
        <div className="mx-5 mb-5 bg-trainer-elevated border border-white/8 rounded-[14px] p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-trainer-warning/80 font-semibold uppercase tracking-widest">
              Warmup · {warmup.totalDurationMinutes} min
            </p>
            <span className="text-[10px] text-white/25">{warmup.steps.length} steps</span>
          </div>
          <div className="flex flex-col gap-2">
            {warmup.steps.map((step, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-trainer-warning/15 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-[9px] font-bold text-trainer-warning">{i + 1}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white/80">{step.name}</p>
                  <p className="text-[11px] text-white/35 mt-0.5">
                    {step.durationSeconds
                      ? `${step.durationSeconds}s`
                      : step.reps
                      ? `${step.reps} reps${step.sets && step.sets > 1 ? ` × ${step.sets}` : ""}${step.eachSide ? " each side" : ""}`
                      : step.holdSeconds
                      ? `Hold ${step.holdSeconds}s`
                      : ""}
                    {step.notes && ` · ${step.notes}`}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Exercise list */}
      <div className="flex-1 px-5 pb-8">
        <p className="text-xs text-white/35 uppercase tracking-widest font-semibold mb-3">
          {exercises.length} exercises
        </p>
        <div className="flex flex-col">
          {exercises.map((ex, i) => {
            const isPairedFirst = i < exercises.length - 1 && supersetPairs?.has(getSupersetPairKey(ex.id, exercises[i + 1].id));
            const isPairedSecond = i > 0 && supersetPairs?.has(getSupersetPairKey(exercises[i - 1].id, ex.id));
            const isPaired = isPairedFirst || isPairedSecond;
            return (
              <div key={ex.id}>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className={cn(
                    "flex items-center gap-3 p-3.5 rounded-[12px] bg-trainer-elevated border transition-colors",
                    isPaired ? "border-amber-400/25" : "border-white/8"
                  )}
                >
                  <div className={cn(
                    "w-7 h-7 rounded-[8px] flex items-center justify-center shrink-0",
                    isPaired ? "bg-amber-400/15" : "bg-trainer-indigo/15"
                  )}>
                    {isPaired
                      ? <Zap size={11} className="text-amber-400 fill-current" />
                      : <span className="text-[10px] font-bold text-trainer-indigo">{i + 1}</span>
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white/85 truncate">{ex.name}</p>
                    <p className="text-xs text-white/35 mt-0.5 capitalize">
                      {ex.primaryMuscles.slice(0, 2).join(", ").replace(/-/g, " ")}
                    </p>
                  </div>
                  <span className="text-[10px] text-white/30 capitalize">{ex.movementType}</span>
                </motion.div>

                {/* Superset toggle between this and the next exercise */}
                {i < exercises.length - 1 && !isPendingSession && (
                  <div className="flex items-center gap-2 my-1 pl-2">
                    <div className={cn("w-px self-stretch ml-3.5", isPairedFirst ? "bg-amber-400/30" : "bg-white/6")} />
                    <button
                      onClick={() => onToggleSuperset?.(ex.id, exercises[i + 1].id)}
                      className={cn(
                        "flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold transition-all",
                        isPairedFirst
                          ? "bg-amber-400/15 border border-amber-400/30 text-amber-400 hover:bg-amber-400/25"
                          : "bg-white/5 border border-white/10 text-white/30 hover:text-white/55 hover:border-white/20"
                      )}
                    >
                      <Zap size={8} className={isPairedFirst ? "fill-current" : ""} />
                      {isPairedFirst ? "Superset ✕" : "Superset"}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* CTA */}
      <div className="px-5 pb-10 border-t border-white/6 pt-4 space-y-2.5">
        <Button fullWidth size="lg" onClick={onBeginRequest}>
          <Dumbbell size={18} />
          Begin Workout
        </Button>
        {!isPendingSession && (
          <Button variant="secondary" fullWidth onClick={onSplit}>
            <Scissors size={16} />
            Split Session
          </Button>
        )}
      </div>
    </div>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────

function WorkoutPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dayParam = searchParams.get("day");
  const pendingParam = searchParams.get("pending");
  const exercisesParam = searchParams.get("exercises");
  const templateNameParam = searchParams.get("name");
  const dayIndex = dayParam !== null && !isNaN(Number(dayParam)) ? parseInt(dayParam, 10) : 0;

  const { profile, accessToken } = useUserStore();
  const { allExerciseLogs, sessionDates, addCompletedSession, recentSessions, setDraftSession, clearDraftSession } = useSessionStore();
  const { settings } = useSettingsStore();
  const { activeInjuries } = usePhysioStore();
  const { getById: getPendingById, removeSession: removePendingSession } = usePendingSessionStore();
  const { unlock, incrementPRCount, addVolume, prCount, totalVolumeKg: achievementVolume } = useAchievementStore();
  const { goals, markAchieved } = useGoalStore();
  const pushNotification = useNotificationStore((s) => s.push);
  const { customExercises } = useCustomExerciseStore();

  // Merge static exercise map with user-created custom exercises
  const mergedExerciseMap = useMemo(
    () => ({ ...exerciseMap, ...Object.fromEntries(customExercises.map((e) => [e.id, e])) }),
    [customExercises]
  );

  // If a pending session ID is in the URL, load that session instead
  const pendingSession = pendingParam ? getPendingById(pendingParam) : undefined;

  const split = useMemo(
    () => (profile?.splitId ? getSplitById(profile.splitId) : null),
    [profile?.splitId]
  );

  const splitDay = split?.days[dayIndex % (split?.days.length ?? 1)] ?? null;

  // Exercise IDs: from pending session or from split day
  const exerciseIds = useMemo(() => {
    if (pendingSession) {
      return pendingSession.exercises
        .filter((e) => e.type === "workout")
        .map((e) => e.id);
    }
    if (exercisesParam) return exercisesParam.split(",").filter(Boolean);
    return splitDay?.exercises ?? [];
  }, [pendingSession, exercisesParam, splitDay]);

  const exercises = useMemo(
    () => exerciseIds.map((id) => mergedExerciseMap[id]).filter(Boolean),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [exerciseIds, mergedExerciseMap]
  );

  // Override exercise list after user confirms the split sheet
  const [overrideExerciseIds, setOverrideExerciseIds] = useState<string[] | null>(null);
  const [showSplitSheet, setShowSplitSheet] = useState(false);

  const activeExerciseIds = overrideExerciseIds ?? exerciseIds;
  const activeExercises = useMemo(
    () => activeExerciseIds.map((id) => mergedExerciseMap[id]).filter(Boolean),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [activeExerciseIds, mergedExerciseMap]
  );

  const goal = profile?.goal ?? "muscle-gain";
  const unit = (settings.weightUnit ?? profile?.units ?? "kg") as "kg" | "lb";

  // ─── Session ─────────────────────────────────────────────────────────────────

  const {
    session,
    startSession,
    logSet,
    editSet,
    deleteSet,
    markExerciseComplete,
    swapExercise,
    finishSession,
    abandonSession,
    totalVolumeKg,
    elapsedSeconds,
  } = useSession();

  const [phase, setPhase] = useState<WorkoutPhase>("pre");
  const [currentExerciseIdx, setCurrentExerciseIdx] = useState(0);
  const [completedSession, setCompletedSession] = useState<WorkoutSession | null>(null);
  const [showAbandonConfirm, setShowAbandonConfirm] = useState(false);
  const [swapConfirm, setSwapConfirm] = useState<{ oldId: string; newId: string; newName: string } | null>(null);
  const [showRestTimer, setShowRestTimer] = useState(false);
  const [restTimerSeconds, setRestTimerSeconds] = useState(90);

  // ─── Dropset state ──────────────────────────────────────────────────────────
  const [dropsetExercises, setDropsetExercises] = useState<Set<string>>(new Set());

  // ─── Live PR flash ──────────────────────────────────────────────────────────
  const [prFlash, setPrFlash] = useState<{ exerciseName: string; weightKg: number; reps: number } | null>(null);

  // ─── Readiness check ────────────────────────────────────────────────────────
  const [showReadiness, setShowReadiness] = useState(false);
  const [readiness, setReadiness] = useState<Readiness>("ready");

  // ─── Superset state ─────────────────────────────────────────────────────────
  const [supersetPairs, setSupersetPairs] = useState<Set<string>>(new Set());
  const [supersetTracker, setSupersetTracker] = useState<{
    firstIdx: number;
    secondIdx: number;
    activeSide: 0 | 1;
  } | null>(null);
  const [showSupersetTransition, setShowSupersetTransition] = useState(false);
  const [supersetTransitionName, setSupersetTransitionName] = useState("");
  const [supersetPendingReturn, setSupersetPendingReturn] = useState(false);

  // ─── Injury-exercise cross-reference ────────────────────────────────────────
  // Build a warning string for an exercise given active physio conditions
  const getInjuryWarning = useMemo(() => {
    const injuryKeywords = activeInjuries.flatMap((inj) => {
      const cond = inj.condition.replace(/-/g, " ");
      return [cond, inj.condition];
    });
    return (exercise: Exercise): string | undefined => {
      if (!exercise.contraindications?.length || !injuryKeywords.length) return undefined;
      const matched = exercise.contraindications.filter((c) =>
        injuryKeywords.some((kw) => c.toLowerCase().includes(kw.toLowerCase()) || kw.toLowerCase().includes(c.toLowerCase()))
      );
      if (!matched.length) return undefined;
      return `Caution: this exercise may aggravate your ${activeInjuries.map((i) => i.condition.replace(/-/g, " ")).join(", ")}. Consider swapping or reducing load.`;
    };
  }, [activeInjuries]);

  // ─── Progressive overload ─────────────────────────────────────────────────

  const overloadEnabled = settings.progressiveOverloadEnabled ?? true;
  const overloadAmount = settings.overloadAmount ?? "standard";

  const {
    pendingSuggestions,
    decisions,
    acceptSuggestion,
    ignoreSuggestion,
    setCustomWeight,
    deloadSignal,
  } = useProgressiveOverload(
    activeExerciseIds,
    allExerciseLogs,
    goal,
    overloadAmount
  );

  // ─── Personal records detection ──────────────────────────────────────────

  const personalRecords = useMemo(() => {
    if (!completedSession?.exercisesCompleted?.length) return [];
    return completedSession.exercisesCompleted.flatMap((log) => {
      if (!log.sets.length) return [];
      const bestCurrentSet = log.sets.reduce((best, s) =>
        estimateOneRepMax(s.weightUsed, s.repsCompleted) >
        estimateOneRepMax(best.weightUsed, best.repsCompleted)
          ? s : best
      );
      if (bestCurrentSet.weightUsed === 0) return [];
      const currentE1RM = estimateOneRepMax(bestCurrentSet.weightUsed, bestCurrentSet.repsCompleted);
      const prevSets = allExerciseLogs
        .filter((l) => l.exerciseId === log.exerciseId)
        .flatMap((l) => l.sets);
      const prevBest1RM = prevSets.length
        ? Math.max(0, ...prevSets.map((s) => estimateOneRepMax(s.weightUsed, s.repsCompleted)))
        : 0;
      if (currentE1RM <= prevBest1RM) return [];
      const exercise = mergedExerciseMap[log.exerciseId];
      if (!exercise) return [];
      return [{ exerciseName: exercise.name, weightKg: bestCurrentSet.weightUsed, reps: bestCurrentSet.repsCompleted, unit }];
    });
  }, [completedSession, allExerciseLogs, unit]);

  // ─── Session complete view (before guards — must always render after finish) ─

  if (phase === "complete" && completedSession) {
    const musclesTrained = collectMusclesTrained(activeExercises);
    return (
      <SessionComplete
        session={completedSession}
        musclesTrained={musclesTrained}
        personalRecords={personalRecords}
        unit={unit}
        userWeightKg={profile?.weightKg}
        accessToken={accessToken ?? undefined}
        userGoal={profile?.goal}
        userLevel={profile?.fitnessLevel}
        allTimeBestVolumeKg={recentSessions.length > 0 ? Math.max(...recentSessions.map(s => s.totalVolumeKg)) : 0}
        onSave={(notes, rating) => {
          const updated = { ...completedSession, sessionNotes: notes, ...(rating ? { rating } : {}) };
          addCompletedSession(updated);
          if (accessToken) {
            sessionsApi.create(accessToken, updated).catch(() => {});
          }
          if (pendingSession) removePendingSession(pendingSession.id);
          clearDraftSession();

          // Achievement checks
          const newSessionCount = recentSessions.length + 1;
          const uniqueIds = new Set([...allExerciseLogs.map((l) => l.exerciseId), ...activeExerciseIds]);
          checkExerciseAchievements(uniqueIds.size, unlock);

          // Compute streak from sessions including the one just saved
          const allSessionsWithNew = [updated, ...recentSessions];
          const MS = 86400000;
          const todayMs = (() => { const d = new Date(); d.setHours(0,0,0,0); return d.getTime(); })();
          const uniqueDayMs = Array.from(new Set(allSessionsWithNew.map(s => { const d = new Date(s.date); d.setHours(0,0,0,0); return d.getTime(); }))).sort((a,b) => b-a);
          let computedStreak = 0;
          if (uniqueDayMs.length && (todayMs - uniqueDayMs[0]) / MS <= 1) {
            let expected = uniqueDayMs[0];
            for (const ms of uniqueDayMs) {
              if (ms === expected) { computedStreak++; expected -= MS; } else break;
            }
          }

          checkSessionAchievements({
            sessionCount: newSessionCount,
            streak: computedStreak,
            newPRCount: personalRecords.length,
            sessionVolumeKg: updated.totalVolumeKg,
            sessionDurationMinutes: updated.durationMinutes,
            sessionHour: new Date().getHours(),
            weekSessionCount: recentSessions.filter((s) => {
              const d = new Date(s.date);
              const now = new Date();
              const weekStart = new Date(now);
              weekStart.setDate(now.getDate() - ((now.getDay() + 6) % 7));
              weekStart.setHours(0, 0, 0, 0);
              return d >= weekStart;
            }).length + 1,
            unlock,
            incrementPRCount,
            addVolume,
            currentPRCount: prCount,
            currentTotalVolume: achievementVolume,
          });

          // Auto-detect goal achievement for strength goals
          const sessionE1RMByExercise: Record<string, number> = {};
          for (const log of (updated.exercisesCompleted ?? [])) {
            if (!log.sets.length) continue;
            const best = Math.max(...log.sets.map((s) => estimateOneRepMax(s.weightUsed, s.repsCompleted)));
            sessionE1RMByExercise[log.exerciseId] = best;
          }
          // Also incorporate all prior logs for a correct all-time best
          const allLogsWithNew = [...allExerciseLogs];
          const priorBestByExercise: Record<string, number> = {};
          for (const log of allLogsWithNew) {
            for (const s of log.sets) {
              const e = estimateOneRepMax(s.weightUsed, s.repsCompleted);
              if (!priorBestByExercise[log.exerciseId] || e > priorBestByExercise[log.exerciseId]) {
                priorBestByExercise[log.exerciseId] = e;
              }
            }
          }
          for (const goal of goals) {
            if (goal.achieved || goal.type !== "strength" || !goal.exerciseId) continue;
            const sessionBest = sessionE1RMByExercise[goal.exerciseId] ?? 0;
            const priorBest = priorBestByExercise[goal.exerciseId] ?? 0;
            const allTimeBest = Math.max(sessionBest, priorBest);
            if (allTimeBest >= goal.targetValue) {
              markAchieved(goal.id);
              pushNotification({
                type: "success",
                title: "Goal achieved!",
                body: goal.label,
              });
            }
          }

          router.push("/dashboard");
        }}
        onDiscard={() => {
          abandonSession();
          clearDraftSession();
          router.push("/dashboard");
        }}
        onRepeat={() => {
          // Reset back to pre phase with the same exercises
          abandonSession();
          setPhase("pre");
          setCurrentExerciseIdx(0);
          setCompletedSession(null);
        }}
      />
    );
  }

  // ─── Guards ────────────────────────────────────────────────────────────────

  if (!pendingSession && !exercisesParam && (!profile || !split || !splitDay)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-full px-5 gap-4">
        <AlertTriangle className="text-trainer-warning" size={40} />
        <p className="text-white/60 text-center">
          No training programme found.
          <br />
          Set one up in Settings.
        </p>
        <Button onClick={() => router.push("/settings")}>Go to Settings</Button>
      </div>
    );
  }

  if (!pendingSession && splitDay?.isRestDay) {
    return <RestDayView onBack={() => router.push("/dashboard")} />;
  }

  if (!activeExercises.length) {
    return (
      <div className="flex flex-col items-center justify-center min-h-full px-5 gap-4 text-center">
        <AlertTriangle className="text-trainer-warning" size={40} />
        <p className="text-white/60">No exercises found for this day.</p>
        <Button variant="secondary" onClick={() => router.push("/dashboard")}>
          Back to Dashboard
        </Button>
      </div>
    );
  }

  const dayName = pendingSession?.dayName ?? templateNameParam ?? splitDay?.dayName ?? "Workout";
  const muscleGroups = splitDay?.muscleGroups ?? [];

  // ─── Pre-workout view ──────────────────────────────────────────────────────

  function beginWorkout(r: Readiness) {
    setReadiness(r);
    setShowReadiness(false);
    if (r === "pain") {
      router.push("/physio");
      return;
    }
    setDraftSession({
      splitDay: dayName,
      exerciseIds: activeExerciseIds,
      dayIndex,
      startedAt: new Date().toISOString(),
    });
    startSession(dayName, activeExerciseIds);
    setPhase("active");
    setCurrentExerciseIdx(0);
    if (activeExercises.length > 1) {
      const a = activeExercises[0];
      const b = activeExercises[1];
      if (a && b && supersetPairs.has(getSupersetPairKey(a.id, b.id))) {
        setSupersetTracker({ firstIdx: 0, secondIdx: 1, activeSide: 0 });
      }
    }
  }

  if (phase === "pre") {
    return (
      <>
        <PreWorkoutView
          dayName={dayName}
          muscleGroups={muscleGroups}
          exercises={activeExercises}
          isPendingSession={!!pendingSession}
          onBeginRequest={() => setShowReadiness(true)}
          onSplit={() => setShowSplitSheet(true)}
          supersetPairs={supersetPairs}
          onToggleSuperset={(idA, idB) => {
            setSupersetPairs((prev) => {
              const next = new Set(prev);
              const key = getSupersetPairKey(idA, idB);
              if (next.has(key)) next.delete(key); else next.add(key);
              return next;
            });
          }}
        />

        {splitDay && (
          <SplitSessionSheet
            open={showSplitSheet}
            dayName={dayName}
            exercises={exercises}
            onClose={() => setShowSplitSheet(false)}
            onConfirm={(nowIds) => {
              setOverrideExerciseIds(nowIds.length > 0 ? nowIds : null);
            }}
          />
        )}

        <ReadinessCheck
          open={showReadiness}
          dayName={dayName}
          onSelect={beginWorkout}
          onClose={() => setShowReadiness(false)}
        />
      </>
    );
  }

  // ─── Active workout view ────────────────────────────────────────────────────

  // ─── Superset helpers ──────────────────────────────────────────────────────

  const goalKeyMap: Record<import("@/app/types").FitnessGoal, string> = {
    "muscle-gain": "muscleGain",
    "fat-loss": "fatLoss",
    strength: "strength",
    recomp: "recomp",
    "greek-god": "greekGod",
    calisthenics: "muscleGain",
    "general-fitness": "recomp",
  };

  function getRepRangeForExercise(ex: Exercise) {
    const key = goalKeyMap[goal] as keyof typeof ex.repRanges;
    return ex.repRanges?.[key] ?? ex.repRanges?.muscleGain;
  }

  function checkAndEnterSuperset(idx: number) {
    if (idx < activeExercises.length - 1) {
      const a = activeExercises[idx];
      const b = activeExercises[idx + 1];
      if (a && b && supersetPairs.has(getSupersetPairKey(a.id, b.id))) {
        setSupersetTracker({ firstIdx: idx, secondIdx: idx + 1, activeSide: 0 });
        return;
      }
    }
    setSupersetTracker(null);
  }

  // ─── Display exercise (may be superset partner) ────────────────────────────

  // Sets per primary muscle group this session — for VolumeLandmarkCard
  const setsPerMuscle = useMemo(() => {
    if (!session?.exercises) return {};
    const counts: Record<string, number> = {};
    for (const ex of session.exercises) {
      const exercise = mergedExerciseMap[ex.exerciseId];
      if (!exercise) continue;
      const setsDone = ex.sets.length;
      for (const m of exercise.primaryMuscles) {
        counts[m] = (counts[m] ?? 0) + setsDone;
      }
    }
    return counts;
  }, [session?.exercises]);

  const displayIdx = supersetTracker
    ? supersetTracker.activeSide === 0 ? supersetTracker.firstIdx : supersetTracker.secondIdx
    : currentExerciseIdx;

  const currentExercise = activeExercises[displayIdx];
  const repRange = currentExercise ? getRepRangeForExercise(currentExercise) : null;
  const targetSets = repRange?.sets ?? 3;
  const targetRepsMin = repRange?.repsMin ?? 8;
  const targetRepsMax = repRange?.repsMax ?? 12;

  // Effective sets in superset = min(A sets, B sets) so both finish together
  const effectiveTargetSets = supersetTracker
    ? Math.min(
        getRepRangeForExercise(activeExercises[supersetTracker.firstIdx])?.sets ?? 3,
        getRepRangeForExercise(activeExercises[supersetTracker.secondIdx])?.sets ?? 3
      )
    : targetSets;

  const isLastExercise = supersetTracker
    ? supersetTracker.secondIdx >= activeExercises.length - 1
    : displayIdx >= activeExercises.length - 1;

  const activeExerciseState = session?.exercises[displayIdx];
  const completedSets = activeExerciseState?.sets ?? [];

  const supersetPartnerName = supersetTracker
    ? supersetTracker.activeSide === 0
      ? activeExercises[supersetTracker.secondIdx]?.name
      : activeExercises[supersetTracker.firstIdx]?.name
    : undefined;

  const suggestionForCurrent = pendingSuggestions.find(
    (s) => s.exerciseId === currentExercise?.id
  );

  function getRestSeconds(): number {
    const rest = settings.defaultRest ?? "standard";
    let base: number;
    if (rest === "short") base = 60;
    else if (rest === "long") base = 180;
    else if (rest === "goal-based") {
      if (goal === "strength") base = 180;
      else if (goal === "fat-loss") base = 60;
      else base = currentExercise?.movementType === "compound" ? 120 : 60;
    } else {
      base = currentExercise?.movementType === "compound" ? 90 : 60;
    }
    // Reduce rest by 33% when feeling tired (lower intensity day)
    return readiness === "tired" ? Math.round(base * 0.67) : base;
  }

  const handleSetDone = (set: Omit<import("@/app/types").SetLog, "loggedAt">) => {
    if (!currentExercise) return;
    logSet(currentExercise.id, {
      setNumber: set.setNumber,
      repsCompleted: set.repsCompleted,
      weightUsed: set.weightUsed,
      weightUnit: set.weightUnit,
      rpe: set.rpe,
      notes: set.notes,
    });

    // Detect live PR
    if (set.weightUsed > 0 && set.repsCompleted > 0) {
      const current1RM = estimateOneRepMax(set.weightUsed, set.repsCompleted);
      const prevSets = allExerciseLogs
        .filter((l) => l.exerciseId === currentExercise.id)
        .flatMap((l) => l.sets);
      const prevBest = prevSets.length
        ? Math.max(0, ...prevSets.map((s) => estimateOneRepMax(s.weightUsed, s.repsCompleted)))
        : 0;
      if (current1RM > prevBest && prevBest > 0) {
        const wKg = unit === "lb" ? set.weightUsed / 2.20462 : set.weightUsed;
        setPrFlash({ exerciseName: currentExercise.name, weightKg: wKg, reps: set.repsCompleted });
        setTimeout(() => setPrFlash(null), 3000);
      }
    }

    if (supersetTracker) {
      if (supersetTracker.activeSide === 0) {
        // A set done → show transition to B (no rest)
        setSupersetTransitionName(activeExercises[supersetTracker.secondIdx]?.name ?? "");
        setShowSupersetTransition(true);
      } else {
        // B set done → check if all rounds complete
        const aSets = session?.exercises[supersetTracker.firstIdx]?.sets.length ?? 0;
        const bSets = (session?.exercises[supersetTracker.secondIdx]?.sets.length ?? 0) + 1;
        if (aSets >= effectiveTargetSets && bSets >= effectiveTargetSets) {
          markExerciseComplete(activeExercises[supersetTracker.firstIdx].id);
          markExerciseComplete(activeExercises[supersetTracker.secondIdx].id);
          const nextIdx = supersetTracker.secondIdx + 1;
          setSupersetTracker(null);
          if (nextIdx >= activeExercises.length) {
            const ws = finishSession();
            if (ws) { setCompletedSession(ws); setPhase("complete"); }
          } else {
            setCurrentExerciseIdx(nextIdx);
            if (nextIdx < activeExercises.length - 1) {
              const na = activeExercises[nextIdx];
              const nb = activeExercises[nextIdx + 1];
              if (na && nb && supersetPairs.has(getSupersetPairKey(na.id, nb.id))) {
                setSupersetTracker({ firstIdx: nextIdx, secondIdx: nextIdx + 1, activeSide: 0 });
              }
            }
          }
        } else {
          // More rounds to go — rest then back to A
          setRestTimerSeconds(getRestSeconds());
          setShowRestTimer(true);
          setSupersetPendingReturn(true);
        }
      }
    } else {
      const logged = (activeExerciseState?.sets.length ?? 0) + 1;
      const inDropset = dropsetExercises.has(currentExercise?.id ?? "");
      if (logged < effectiveTargetSets && !inDropset) {
        setRestTimerSeconds(getRestSeconds());
        setShowRestTimer(true);
      }
      // Dropset: no rest between sets — user goes straight to the next set
    }
  };

  const handleNextExercise = () => {
    if (supersetTracker) {
      if (supersetTracker.activeSide === 0) {
        // "Next" clicked while showing A → trigger transition to B
        setSupersetTransitionName(activeExercises[supersetTracker.secondIdx]?.name ?? "");
        setShowSupersetTransition(true);
      }
      return;
    }
    if (!currentExercise) return;
    markExerciseComplete(currentExercise.id);
    if (isLastExercise) {
      const ws = finishSession();
      if (ws) { setCompletedSession(ws); setPhase("complete"); }
    } else {
      const nextIdx = currentExerciseIdx + 1;
      setCurrentExerciseIdx(nextIdx);
      checkAndEnterSuperset(nextIdx);
    }
  };

  const handleSkipExercise = () => {
    if (supersetTracker) {
      markExerciseComplete(activeExercises[supersetTracker.firstIdx].id);
      markExerciseComplete(activeExercises[supersetTracker.secondIdx].id);
      const nextIdx = supersetTracker.secondIdx + 1;
      setSupersetTracker(null);
      if (nextIdx >= activeExercises.length) {
        const ws = finishSession();
        if (ws) { setCompletedSession(ws); setPhase("complete"); }
      } else {
        setCurrentExerciseIdx(nextIdx);
        checkAndEnterSuperset(nextIdx);
      }
      return;
    }
    if (isLastExercise) {
      const ws = finishSession();
      if (ws) { setCompletedSession(ws); setPhase("complete"); }
    } else {
      const nextIdx = currentExerciseIdx + 1;
      setCurrentExerciseIdx(nextIdx);
      checkAndEnterSuperset(nextIdx);
    }
  };

  return (
    <div className="flex flex-col min-h-full gym-bg">
      <GymBackground variant="alt" />
      <WorkoutHeader
        elapsed={elapsedSeconds}
        current={displayIdx + 1}
        total={activeExercises.length}
        volumeKg={totalVolumeKg}
        unit={unit}
        onAbandon={() => setShowAbandonConfirm(true)}
        voiceCoachSlot={
          <VoiceCoach
            accessToken={accessToken ?? undefined}
            context={{
              goal: profile?.goal,
              fitnessLevel: profile?.fitnessLevel,
              splitName: split?.name,
              recentSessionCount: recentSessions.length,
              injuries: [],
            }}
            exerciseName={currentExercise?.name}
          />
        }
      />

      {/* Deload warning banner */}
      {overloadEnabled && deloadSignal.detected && currentExerciseIdx === 0 && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="mx-4 mt-3 px-4 py-3 rounded-[12px] bg-trainer-warning/10 border border-trainer-warning/30 flex items-center gap-2.5"
        >
          <AlertTriangle size={16} className="text-trainer-warning shrink-0" />
          <p className="text-xs text-white/70">
            <span className="font-semibold text-trainer-warning">Deload week suggested</span>
            {" — "}{deloadSignal.reason}
          </p>
        </motion.div>
      )}

      {/* Tired mode banner */}
      {readiness === "tired" && currentExerciseIdx === 0 && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-4 mt-3 px-4 py-3 rounded-[12px] bg-amber-400/8 border border-amber-400/20 flex items-center gap-2.5"
        >
          <Timer size={14} className="text-amber-400 shrink-0" />
          <p className="text-xs text-white/70">
            <span className="font-semibold text-amber-400">Low-intensity day</span>
            {" — "}rest times reduced · listen to your body
          </p>
        </motion.div>
      )}

      {/* Volume landmarks — only show once there are sets logged */}
      {Object.values(setsPerMuscle).some((v) => v > 0) && (
        <div className="px-4 pb-2">
          <VolumeLandmarkCard setsPerMuscle={setsPerMuscle} />
        </div>
      )}

      <AnimatePresence mode="wait">
        {currentExercise && (
          <ExerciseView
            key={currentExercise.id}
            exercise={currentExercise}
            exerciseIndex={displayIdx}
            totalExercises={activeExercises.length}
            completedSets={completedSets}
            targetSets={effectiveTargetSets}
            targetRepsMin={targetRepsMin}
            targetRepsMax={targetRepsMax}
            prefillWeight={0}
            unit={unit}
            showRpe={settings.showRpe ?? false}
            showPreviousPerformance={settings.showPreviousPerformance ?? true}
            allLogs={allExerciseLogs}
            sessionDates={sessionDates}
            suggestion={overloadEnabled ? suggestionForCurrent : undefined}
            decisions={decisions}
            onSetDone={handleSetDone}
            onAcceptSuggestion={() => acceptSuggestion(currentExercise.id)}
            onIgnoreSuggestion={() => ignoreSuggestion(currentExercise.id)}
            onSetCustomWeight={(w) => setCustomWeight(currentExercise.id, w)}
            onNext={handleNextExercise}
            onSkip={handleSkipExercise}
            onSwap={supersetTracker ? undefined : () => {
              const alt = getAlternateExercise(currentExercise.id);
              if (alt) setSwapConfirm({ oldId: currentExercise.id, newId: alt.id, newName: alt.name });
            }}
            isLast={isLastExercise}
            injuryWarning={getInjuryWarning(currentExercise)}
            supersetPartnerName={supersetPartnerName}
            onEditSet={(setNumber, updates) => editSet(currentExercise.id, setNumber, updates)}
            onDeleteSet={(setNumber) => deleteSet(currentExercise.id, setNumber)}
            dropsetMode={dropsetExercises.has(currentExercise.id)}
            onToggleDropset={supersetTracker ? undefined : () => {
              setDropsetExercises((prev) => {
                const next = new Set(prev);
                if (next.has(currentExercise.id)) next.delete(currentExercise.id);
                else next.add(currentExercise.id);
                return next;
              });
            }}
            nextExercise={isLastExercise ? undefined : activeExercises[displayIdx + 1]}
          />
        )}
      </AnimatePresence>

      {/* Swap exercise confirmation */}
      <AnimatePresence>
        {swapConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-end"
          >
            <motion.div
              initial={{ y: 80 }}
              animate={{ y: 0 }}
              exit={{ y: 80 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className="w-full bg-trainer-surface border-t border-white/10 rounded-t-[24px] p-6 space-y-4"
            >
              <div className="flex justify-center mb-1">
                <div className="w-8 h-1 rounded-full bg-white/15" />
              </div>
              <h3 className="text-base font-bold text-white text-center">Swap Exercise?</h3>
              <p className="text-sm text-white/45 text-center">
                Replace with <span className="text-white font-semibold">{swapConfirm.newName}</span>?
                {"\n"}Sets already logged will be cleared.
              </p>
              <div className="flex flex-col gap-2">
                <Button
                  fullWidth
                  onClick={() => {
                    swapExercise(swapConfirm.oldId, swapConfirm.newId);
                    const newIds = activeExerciseIds.map((id) =>
                      id === swapConfirm.oldId ? swapConfirm.newId : id
                    );
                    setOverrideExerciseIds(newIds);
                    setSwapConfirm(null);
                  }}
                >
                  <RefreshCw size={15} /> Swap Exercise
                </Button>
                <Button variant="ghost" fullWidth onClick={() => setSwapConfirm(null)}>
                  Keep Current
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Rest timer */}
      <RestTimer
        open={showRestTimer}
        seconds={restTimerSeconds}
        onClose={() => {
          setShowRestTimer(false);
          if (supersetPendingReturn) {
            setSupersetPendingReturn(false);
            setSupersetTracker((t) => t ? { ...t, activeSide: 0 } : null);
          }
        }}
      />

      {/* Superset transition overlay */}
      <AnimatePresence>
        {showSupersetTransition && (
          <SupersetTransitionOverlay
            exerciseName={supersetTransitionName}
            onDismiss={() => {
              setShowSupersetTransition(false);
              setSupersetTracker((t) => t ? { ...t, activeSide: 1 } : null);
            }}
          />
        )}
      </AnimatePresence>

      {/* Abandon confirmation */}
      <AnimatePresence>
        {showAbandonConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-end"
          >
            <motion.div
              initial={{ y: 80 }}
              animate={{ y: 0 }}
              exit={{ y: 80 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className="w-full bg-trainer-surface border-t border-white/10 rounded-t-[24px] p-6 space-y-4"
            >
              <h3 className="text-base font-bold text-white text-center">
                Abandon workout?
              </h3>
              <p className="text-sm text-white/45 text-center">
                Your progress will be lost.
              </p>
              <div className="flex flex-col gap-2">
                <Button
                  variant="danger"
                  fullWidth
                  onClick={() => {
                    setPhase("pre");
                    abandonSession();
                    clearDraftSession();
                    router.push("/dashboard");
                  }}
                >
                  Yes, Abandon
                </Button>
                <Button
                  variant="ghost"
                  fullWidth
                  onClick={() => setShowAbandonConfirm(false)}
                >
                  Keep Going
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Live PR flash toast */}
      <AnimatePresence>
        {prFlash && (
          <motion.div
            key="pr-flash"
            initial={{ opacity: 0, y: 40, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 26 }}
            className="fixed bottom-28 inset-x-4 z-50 pointer-events-none"
            style={{ maxWidth: 340, margin: "0 auto" }}
          >
            <div className="flex items-center gap-3 p-4 rounded-[16px] bg-amber-400 shadow-xl shadow-amber-400/30">
              <Trophy size={22} className="text-black shrink-0" />
              <div>
                <p className="text-sm font-black text-black leading-tight">New Personal Record!</p>
                <p className="text-xs font-semibold text-black/70 mt-0.5">
                  {prFlash.exerciseName} · {unit === "lb"
                    ? `${Math.round(prFlash.weightKg * 2.20462)} lb`
                    : `${prFlash.weightKg.toFixed(1)} kg`} × {prFlash.reps}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function WorkoutPage() {
  return (
    <Suspense fallback={<WorkoutPageSkeleton />}>
      <WorkoutPageContent />
    </Suspense>
  );
}

function WorkoutPageSkeleton() {
  return (
    <div className="flex flex-col min-h-full">
      <div className="h-14 bg-trainer-surface/60 border-b border-white/8" />
      <div className="flex-1 px-5 pt-6 flex flex-col gap-4">
        <div className="h-8 w-48 rounded-lg skeleton" />
        <div className="h-6 w-32 rounded-lg skeleton" />
        <div className="h-40 rounded-[16px] skeleton" />
        <div className="h-56 rounded-[16px] skeleton" />
      </div>
    </div>
  );
}
