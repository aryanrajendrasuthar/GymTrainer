"use client";

import { Suspense, useState, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  ChevronLeft,
  Dumbbell,
  Timer,
  TrendingUp,
  AlertTriangle,
} from "lucide-react";
import { useUserStore } from "@/app/store/userStore";
import { sessionsApi } from "@/app/lib/api";
import { useSessionStore } from "@/app/store/sessionStore";
import { useSettingsStore } from "@/app/store/settingsStore";
import { useSession } from "@/app/hooks/useSession";
import {
  useProgressiveOverload,
  useSuggestedWeight,
} from "@/app/hooks/useProgressiveOverload";
import { useExerciseHistory } from "@/app/hooks/useExerciseHistory";
import { getGoalBasedRestSeconds } from "@/app/hooks/useSettings";
import { getSplitById } from "@/app/data/splits";
import { exerciseMap } from "@/app/data/exercises";
import { getWarmupForSession, type SessionTag } from "@/app/data/protocols";
import { SetLogger } from "@/app/components/workout/SetLogger";
import { PreviousPerformancePanel } from "@/app/components/workout/PreviousPerformancePanel";
import { ProgressiveOverloadSuggestion } from "@/app/components/workout/ProgressiveOverloadSuggestion";
import { NextExerciseButton } from "@/app/components/workout/NextExerciseButton";
import { SessionComplete } from "@/app/components/workout/SessionComplete";
import { Button } from "@/app/components/ui/Button";
import { Badge } from "@/app/components/ui/Badge";
import { type WorkoutSession, type MuscleGroup, type Exercise } from "@/app/types";
import { cn, formatVolume } from "@/app/lib/utils";

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

// ─── Sub-components ────────────────────────────────────────────────────────────

function WorkoutHeader({
  elapsed,
  current,
  total,
  volumeKg,
  unit,
  onAbandon,
}: {
  elapsed: number;
  current: number;
  total: number;
  volumeKg: number;
  unit: "kg" | "lb";
  onAbandon: () => void;
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

        <div className="w-8" />
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
  isLast,
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
  isLast: boolean;
}) {
  const history = useExerciseHistory(exercise.id, allLogs, sessionDates);
  const currentSetNumber = completedSets.length + 1;
  const allTargetsDone = completedSets.length >= targetSets;

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

  return (
    <motion.div
      key={exercise.id}
      initial={{ opacity: 0, x: 32 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -32 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="flex flex-col gap-4 px-4 pb-32"
    >
      {/* Exercise header */}
      <div className="pt-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <p className="text-xs text-white/35 font-medium uppercase tracking-wider mb-1">
              Exercise {exerciseIndex + 1} of {totalExercises}
            </p>
            <h2 className="text-xl font-bold text-white leading-tight">
              {exercise.name}
            </h2>
          </div>
          <div className="w-11 h-11 rounded-[12px] bg-trainer-indigo/15 flex items-center justify-center shrink-0">
            <Dumbbell size={20} className="text-trainer-indigo" />
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
        <span className={cn(
          "font-semibold",
          allTargetsDone ? "text-trainer-success" : "text-white/50"
        )}>
          {completedSets.length}/{targetSets} sets done
        </span>
      </div>

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
            />
          ))}
        </div>
      )}

      {/* Active set logger */}
      {!allTargetsDone && (
        <SetLogger
          setNumber={currentSetNumber}
          targetRepsMin={targetRepsMin}
          targetRepsMax={targetRepsMax}
          targetSets={targetSets}
          prefillWeight={resolvedPrefill}
          unit={unit}
          showRpe={showRpe}
          onSetDone={onSetDone}
          restSuggestion={`Rest ${exercise.movementType === "compound" ? 90 : 60}s between sets`}
        />
      )}

      {/* Next exercise / complete */}
      {allTargetsDone && (
        <div className="pt-2">
          <NextExerciseButton
            onClick={onNext}
            isLast={isLast}
            label={`Next: ${isLast ? "" : ""}`}
          />
        </div>
      )}
    </motion.div>
  );
}

// ─── Pre-workout view ──────────────────────────────────────────────────────────

function PreWorkoutView({
  dayName,
  muscleGroups,
  exercises,
  onBegin,
}: {
  dayName: string;
  muscleGroups: string[];
  exercises: Exercise[];
  onBegin: () => void;
}) {
  const sessionTag = muscleGroupsToSessionTag(muscleGroups);
  const warmup = getWarmupForSession(sessionTag);

  return (
    <div className="flex flex-col min-h-full">
      {/* Header */}
      <div className="px-5 pt-14 pb-6">
        <p className="text-xs text-trainer-indigo/80 font-semibold uppercase tracking-wider mb-1">
          Today's Workout
        </p>
        <h1 className="text-2xl font-bold text-white">{dayName}</h1>
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
      {warmup && (
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
        <div className="flex flex-col gap-2">
          {exercises.map((ex, i) => (
            <motion.div
              key={ex.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="flex items-center gap-3 p-3.5 rounded-[12px] bg-trainer-elevated border border-white/8"
            >
              <div className="w-7 h-7 rounded-[8px] bg-trainer-indigo/15 flex items-center justify-center shrink-0">
                <span className="text-[10px] font-bold text-trainer-indigo">
                  {i + 1}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white/85 truncate">
                  {ex.name}
                </p>
                <p className="text-xs text-white/35 mt-0.5 capitalize">
                  {ex.primaryMuscles.slice(0, 2).join(", ").replace(/-/g, " ")}
                </p>
              </div>
              <span className="text-[10px] text-white/30 capitalize">
                {ex.movementType}
              </span>
            </motion.div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="px-5 pb-10 border-t border-white/6 pt-4">
        <Button fullWidth size="lg" onClick={onBegin}>
          <Dumbbell size={18} />
          Begin Workout
        </Button>
      </div>
    </div>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────

function WorkoutPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dayParam = searchParams.get("day");
  const dayIndex = dayParam !== null && !isNaN(Number(dayParam)) ? parseInt(dayParam, 10) : 0;

  const { profile, accessToken } = useUserStore();
  const { allExerciseLogs, sessionDates, addCompletedSession } = useSessionStore();
  const { settings } = useSettingsStore();

  const split = useMemo(
    () => (profile?.splitId ? getSplitById(profile.splitId) : null),
    [profile?.splitId]
  );

  const splitDay = split?.days[dayIndex % (split?.days.length ?? 1)] ?? null;

  const exerciseIds = useMemo(
    () => splitDay?.exercises ?? [],
    [splitDay]
  );

  const exercises = useMemo(
    () => exerciseIds.map((id) => exerciseMap[id]).filter(Boolean),
    [exerciseIds]
  );

  const goal = profile?.goal ?? "muscle-gain";
  const unit = (settings.weightUnit ?? profile?.units ?? "kg") as "kg" | "lb";

  // ─── Session ─────────────────────────────────────────────────────────────────

  const {
    session,
    startSession,
    logSet,
    markExerciseComplete,
    finishSession,
    abandonSession,
    totalVolumeKg,
    elapsedSeconds,
  } = useSession();

  const [phase, setPhase] = useState<WorkoutPhase>("pre");
  const [currentExerciseIdx, setCurrentExerciseIdx] = useState(0);
  const [completedSession, setCompletedSession] = useState<WorkoutSession | null>(null);
  const [showAbandonConfirm, setShowAbandonConfirm] = useState(false);

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
    exerciseIds,
    allExerciseLogs,
    goal,
    overloadAmount
  );

  // ─── Guards ────────────────────────────────────────────────────────────────

  if (!profile || !split || !splitDay) {
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

  if (splitDay.isRestDay) {
    return (
      <div className="flex flex-col items-center justify-center min-h-full px-5 gap-4 text-center">
        <p className="text-4xl">😴</p>
        <h2 className="text-xl font-bold text-white">Rest Day</h2>
        <p className="text-white/45 text-sm">Recovery is training. Sleep, eat, repeat.</p>
        <Button variant="secondary" onClick={() => router.push("/dashboard")}>
          <ChevronLeft size={16} />
          Back to Dashboard
        </Button>
      </div>
    );
  }

  if (!exercises.length) {
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

  // ─── Session complete view ─────────────────────────────────────────────────

  if (phase === "complete" && completedSession) {
    const musclesTrained = collectMusclesTrained(exercises);
    return (
      <SessionComplete
        session={completedSession}
        musclesTrained={musclesTrained}
        personalRecords={[]}
        unit={unit}
        onSave={(notes) => {
          const updated = { ...completedSession, sessionNotes: notes };
          addCompletedSession(updated);
          if (accessToken) {
            sessionsApi.create(accessToken, updated).catch(() => {});
          }
          router.push("/dashboard");
        }}
        onDiscard={() => {
          abandonSession();
          router.push("/dashboard");
        }}
      />
    );
  }

  // ─── Pre-workout view ──────────────────────────────────────────────────────

  if (phase === "pre") {
    return (
      <PreWorkoutView
        dayName={splitDay.dayName}
        muscleGroups={splitDay.muscleGroups}
        exercises={exercises}
        onBegin={() => {
          startSession(splitDay.dayName, exerciseIds);
          setPhase("active");
          setCurrentExerciseIdx(0);
        }}
      />
    );
  }

  // ─── Active workout view ────────────────────────────────────────────────────

  const currentExercise = exercises[currentExerciseIdx];
  const goalKeyMap: Record<import("@/app/types").FitnessGoal, keyof typeof currentExercise.repRanges> = {
    "muscle-gain": "muscleGain",
    "fat-loss": "fatLoss",
    strength: "strength",
    recomp: "recomp",
    "greek-god": "greekGod",
    calisthenics: "muscleGain",
    "general-fitness": "recomp",
  };
  const repRange = currentExercise?.repRanges?.[goalKeyMap[goal]] ?? currentExercise?.repRanges?.muscleGain;
  const targetSets = repRange?.sets ?? 3;
  const targetRepsMin = repRange?.repsMin ?? 8;
  const targetRepsMax = repRange?.repsMax ?? 12;
  const isLastExercise = currentExerciseIdx === exercises.length - 1;

  const activeExerciseState = session?.exercises[currentExerciseIdx];
  const completedSets = activeExerciseState?.sets ?? [];

  const suggestionForCurrent = pendingSuggestions.find(
    (s) => s.exerciseId === currentExercise?.id
  );

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
  };

  const handleNextExercise = () => {
    if (!currentExercise) return;
    markExerciseComplete(currentExercise.id);
    if (isLastExercise) {
      const ws = finishSession();
      if (ws) {
        setCompletedSession(ws);
        setPhase("complete");
      }
    } else {
      setCurrentExerciseIdx((i) => i + 1);
    }
  };

  return (
    <div className="flex flex-col min-h-full bg-trainer-black">
      <WorkoutHeader
        elapsed={elapsedSeconds}
        current={currentExerciseIdx + 1}
        total={exercises.length}
        volumeKg={totalVolumeKg}
        unit={unit}
        onAbandon={() => setShowAbandonConfirm(true)}
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

      <AnimatePresence mode="wait">
        {currentExercise && (
          <ExerciseView
            key={currentExercise.id}
            exercise={currentExercise}
            exerciseIndex={currentExerciseIdx}
            totalExercises={exercises.length}
            completedSets={completedSets}
            targetSets={targetSets}
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
            isLast={isLastExercise}
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
                    abandonSession();
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
