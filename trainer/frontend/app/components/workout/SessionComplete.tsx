"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Clock, Dumbbell, BarChart3, Star, Save, X, Zap, Share2, Flame, Bookmark, Check } from "lucide-react";
import { Button } from "@/app/components/ui/Button";
import { Textarea } from "@/app/components/ui/Input";
import { MuscleActivationDiagram } from "@/app/components/ui/MuscleActivationDiagram";
import { Badge } from "@/app/components/ui/Badge";
import { Confetti } from "@/app/components/ui/Confetti";
import { useCountUp } from "@/app/hooks/useCountUp";
import { GymBackground } from "@/app/components/ui/GymBackground";
import { CooldownCard } from "@/app/components/workout/CooldownCard";
import { useWorkoutTemplateStore } from "@/app/store/workoutTemplateStore";
import { type WorkoutSession, type MuscleGroup } from "@/app/types";
import { formatVolume, cn } from "@/app/lib/utils";
import { aiApi } from "@/app/lib/api";

interface PersonalRecord {
  exerciseName: string;
  weightKg: number;
  reps: number;
  unit: "kg" | "lb";
}

interface SessionCompleteProps {
  session: Partial<WorkoutSession>;
  musclesTrained: MuscleGroup[];
  personalRecords: PersonalRecord[];
  unit?: "kg" | "lb";
  userWeightKg?: number;
  accessToken?: string;
  userGoal?: string;
  userLevel?: string;
  allTimeBestVolumeKg?: number;
  onSave: (notes: string, rating?: number) => void;
  onDiscard: () => void;
  onRepeat?: () => void;
}

function estimateCaloriesBurned(
  userWeightKg: number,
  durationMinutes: number,
  exercises: WorkoutSession["exercisesCompleted"]
): number {
  if (!exercises?.length || durationMinutes <= 0) return 0;
  // MET values for different training styles
  const exerciseIds = exercises.map((e) => e.exerciseId);
  const metabolicIds = ["battle-ropes", "burpee", "mountain-climbers", "box-jump", "jump-rope", "kettlebell-swing"];
  const isMetabolic = exerciseIds.some((id) => metabolicIds.includes(id));
  const heavyCompoundIds = ["barbell-deadlift", "barbell-squat", "barbell-bench-press", "overhead-press", "barbell-bent-over-row"];
  const heavyCount = exerciseIds.filter((id) => heavyCompoundIds.includes(id)).length;
  const met = isMetabolic ? 7.0 : heavyCount >= 2 ? 5.5 : 4.0;
  return Math.round(met * userWeightKg * (durationMinutes / 60));
}

// ─── Animated stat card ────────────────────────────────────────────────────────

function StatCard({
  icon: Icon,
  label,
  value,
  delay,
  highlight,
  isPR,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  delay: number;
  highlight?: boolean;
  isPR?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.92 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay, type: "spring", stiffness: 300, damping: 24 }}
      className={`rounded-[16px] p-4 border ${
        isPR
          ? "bg-trainer-gold/12 border-trainer-gold/35"
          : highlight
          ? "bg-trainer-gold/8 border-trainer-gold/25"
          : "bg-trainer-elevated border-white/8"
      }`}
    >
      <Icon size={18} className={isPR || highlight ? "text-trainer-gold mb-2" : "text-trainer-indigo mb-2"} />
      <p className="text-xl font-bold">{value}</p>
      <p className="text-xs text-white/40 mt-0.5">{label}</p>
      {isPR && (
        <span className="inline-flex items-center gap-0.5 mt-1.5 text-[9px] font-black text-trainer-gold bg-trainer-gold/15 border border-trainer-gold/30 rounded-full px-1.5 py-0.5 uppercase tracking-wide">
          <Zap size={7} className="fill-current" />
          Vol. Record
        </span>
      )}
    </motion.div>
  );
}

export function SessionComplete({
  session,
  musclesTrained,
  personalRecords,
  unit = "kg",
  userWeightKg,
  accessToken,
  userGoal,
  userLevel,
  allTimeBestVolumeKg = 0,
  onSave,
  onDiscard,
  onRepeat,
}: SessionCompleteProps) {
  const { saveTemplate } = useWorkoutTemplateStore();
  const [notes, setNotes] = useState(session.sessionNotes || "");
  const [rating, setRating] = useState<number>(0);
  const [discardConfirm, setDiscardConfirm] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [shared, setShared] = useState(false);
  const [coachTip, setCoachTip] = useState<string | null>(null);
  const [saveAsTemplate, setSaveAsTemplate] = useState(false);
  const [templateName, setTemplateName] = useState(session.splitDay ?? "My Workout");
  const [templateSaved, setTemplateSaved] = useState(false);
  const exerciseIds = session.exercisesCompleted?.map((e) => e.exerciseId) ?? [];
  const hasPR = personalRecords.length > 0;

  // Fire confetti after mount when there are PRs
  useEffect(() => {
    if (hasPR) {
      const t = setTimeout(() => setShowConfetti(true), 600);
      return () => clearTimeout(t);
    }
  }, [hasPR]);

  // Fetch post-workout AI tip
  useEffect(() => {
    if (!accessToken || !userGoal) return;
    const totalSets = session.exercisesCompleted?.reduce((a, e) => a + e.sets.length, 0) ?? 0;
    aiApi
      .getPostWorkoutTip(accessToken, {
        splitDay: session.splitDay ?? "Workout",
        exerciseCount: session.exercisesCompleted?.length ?? 0,
        totalSets,
        durationMinutes: session.durationMinutes ?? 0,
        volumeKg: session.totalVolumeKg ?? 0,
        prCount: personalRecords.length,
        goal: userGoal,
        fitnessLevel: userLevel,
      })
      .then((r) => setCoachTip(r.tip))
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleShare() {
    const splitDay = session.splitDay ?? "Workout";
    const text = [
      `${splitDay} complete!`,
      `${exerciseCount} exercises · ${totalSets} sets`,
      formatVolume(volumeKg, unit) + " volume",
      session.durationMinutes ? `${Math.floor(session.durationMinutes / 60)}h ${session.durationMinutes % 60}m` : "",
      personalRecords.length > 0 ? `${personalRecords.length} PR${personalRecords.length !== 1 ? "s" : ""}!` : "",
    ].filter(Boolean).join(" · ");

    if (typeof navigator !== "undefined" && "share" in navigator) {
      try {
        await navigator.share({ title: splitDay, text });
        setShared(true);
        return;
      } catch {
        // fall through
      }
    }
    navigator.clipboard?.writeText(text).catch(() => {});
    setShared(true);
    setTimeout(() => setShared(false), 2000);
  }

  const durationFormatted = session.durationMinutes
    ? `${Math.floor(session.durationMinutes / 60)}h ${session.durationMinutes % 60}m`
    : "—";

  const totalSets =
    session.exercisesCompleted?.reduce((acc, ex) => acc + ex.sets.length, 0) ?? 0;

  const exerciseCount = session.exercisesCompleted?.length ?? 0;
  const volumeKg = session.totalVolumeKg ?? 0;
  const isVolumePR = allTimeBestVolumeKg > 0 && volumeKg > allTimeBestVolumeKg;
  const estimatedCals =
    userWeightKg && session.durationMinutes
      ? estimateCaloriesBurned(userWeightKg, session.durationMinutes, session.exercisesCompleted ?? [])
      : 0;

  const totalReps =
    session.exercisesCompleted?.reduce(
      (a, ex) => a + ex.sets.reduce((b, s) => b + s.repsCompleted, 0),
      0
    ) ?? 0;
  const avgRepsPerSet = totalSets > 0 ? Math.round(totalReps / totalSets) : 0;

  const animatedSets = useCountUp(totalSets, 600, 400);
  const animatedExercises = useCountUp(exerciseCount, 500, 300);

  return (
    <div className="min-h-screen gym-bg flex flex-col">
      <GymBackground variant="alt" />
      {/* Canvas confetti overlay */}
      <Confetti active={showConfetti} count={100} originY={0.25} />

      {/* Header */}
      <div className="relative flex items-center justify-center pt-12 pb-6 px-4">
        <motion.div
          initial={{ scale: 0, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 280, damping: 18, delay: 0.1 }}
          className="relative"
        >
          <div className="w-20 h-20 rounded-full bg-trainer-indigo/20 border border-trainer-indigo/40 flex items-center justify-center">
            <Trophy size={36} className="text-trainer-indigo" />
          </div>
          {/* Pulsing ring */}
          <motion.div
            className="absolute inset-0 rounded-full border border-trainer-indigo/40"
            animate={{ scale: [1, 1.35, 1], opacity: [0.6, 0, 0.6] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: "easeOut" }}
          />
        </motion.div>

        {hasPR && (
          <motion.div
            initial={{ opacity: 0, x: 20, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{ delay: 0.8, type: "spring", stiffness: 300 }}
            className="absolute right-6 top-14 flex items-center gap-1.5 bg-trainer-gold/15 border border-trainer-gold/30 rounded-full px-3 py-1.5"
          >
            <Zap size={12} className="text-trainer-gold" />
            <span className="text-[11px] font-bold text-trainer-gold">
              {personalRecords.length} PR{personalRecords.length !== 1 ? "s" : ""}!
            </span>
          </motion.div>
        )}
      </div>

      <div className="flex-1 px-4 max-w-content mx-auto w-full pb-8 space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="text-center"
        >
          <h1 className="text-2xl font-bold">Workout Complete</h1>
          <p className="text-white/40 text-sm mt-1">
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          </p>
        </motion.div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            icon={Dumbbell}
            label="Exercises"
            value={`${animatedExercises}`}
            delay={0.15}
          />
          <StatCard
            icon={BarChart3}
            label="Total Sets"
            value={`${animatedSets}`}
            delay={0.2}
          />
          <StatCard
            icon={Clock}
            label="Duration"
            value={durationFormatted}
            delay={0.25}
          />
          <StatCard
            icon={Star}
            label="Volume"
            value={formatVolume(volumeKg, unit)}
            delay={0.3}
            highlight={volumeKg > 0}
            isPR={isVolumePR}
          />
          {estimatedCals > 0 && (
            <StatCard
              icon={Flame}
              label="Est. Calories"
              value={`~${estimatedCals} kcal`}
              delay={0.35}
            />
          )}
          {avgRepsPerSet > 0 && (
            <StatCard
              icon={BarChart3}
              label="Avg Reps / Set"
              value={`${avgRepsPerSet}`}
              delay={0.4}
            />
          )}
        </div>

        {/* Muscle diagram */}
        {musclesTrained.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="bg-trainer-surface border border-white/8 rounded-[16px] p-4"
          >
            <h3 className="text-sm font-medium text-white/60 mb-4 text-center">
              Muscles Trained
            </h3>
            <MuscleActivationDiagram
              primaryMuscles={musclesTrained}
              secondaryMuscles={[]}
              size="md"
            />
          </motion.div>
        )}

        {/* Personal records */}
        <AnimatePresence>
          {personalRecords.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="space-y-2"
            >
              <motion.h3
                className="text-sm font-semibold text-trainer-gold flex items-center gap-2"
                animate={{ scale: [1, 1.04, 1] }}
                transition={{ duration: 0.6, delay: 0.8 }}
              >
                <Trophy size={14} />
                Personal Records
              </motion.h3>
              {personalRecords.map((pr, i) => (
                <motion.div
                  key={pr.exerciseName}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.45 + i * 0.08, type: "spring", stiffness: 300, damping: 24 }}
                  className="flex items-center justify-between bg-trainer-gold/8 border border-trainer-gold/20 rounded-[12px] px-3 py-2.5"
                >
                  <div className="flex items-center gap-2">
                    <Badge color="gold" size="sm">PR</Badge>
                    <span className="text-sm font-medium">{pr.exerciseName}</span>
                  </div>
                  <span className="text-sm font-bold text-trainer-gold tabular-nums">
                    {pr.weightKg}{unit} × {pr.reps}
                  </span>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Cooldown stretches */}
        {musclesTrained.length > 0 && (
          <CooldownCard musclesTrained={musclesTrained} />
        )}

        {/* Session notes */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.47 }}
        >
          <Textarea
            label="Session Notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="How did it go? What felt good? What to improve next time..."
            rows={4}
            className="text-sm"
          />
        </motion.div>

        {/* Workout rating */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.49 }}
          className="bg-trainer-surface border border-white/8 rounded-[14px] p-4"
        >
          <p className="text-xs text-white/40 mb-3 text-center uppercase tracking-widest font-semibold">
            Rate this workout
          </p>
          <div className="flex items-center justify-center gap-3">
            {[1, 2, 3, 4, 5].map((star) => (
              <motion.button
                key={star}
                whileTap={{ scale: 0.85 }}
                onClick={() => setRating(rating === star ? 0 : star)}
                className="focus:outline-none"
              >
                <Star
                  size={28}
                  className={cn(
                    "transition-all duration-150",
                    star <= rating
                      ? "text-trainer-gold fill-trainer-gold"
                      : "text-white/15"
                  )}
                />
              </motion.button>
            ))}
          </div>
          {rating > 0 && (
            <motion.p
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-[11px] text-white/35 text-center mt-2"
            >
              {["", "Rough session", "Below average", "Decent workout", "Solid session", "Absolute beast! 🔥"][rating]}
            </motion.p>
          )}
        </motion.div>

        {/* Coach AI tip */}
        <AnimatePresence>
          {coachTip && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="flex items-start gap-3 bg-trainer-indigo/8 border border-trainer-indigo/25 rounded-[14px] p-3.5"
            >
              <Zap size={14} className="text-trainer-indigo mt-0.5 shrink-0" />
              <p className="text-xs text-white/70 leading-relaxed italic">{coachTip}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Action buttons */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="space-y-3 pb-20 md:pb-4"
        >
          <Button
            variant="primary"
            fullWidth
            size="lg"
            onClick={() => {
              if (saveAsTemplate && exerciseIds.length > 0) {
                saveTemplate(templateName.trim() || (session.splitDay ?? "My Workout"), exerciseIds);
                setTemplateSaved(true);
              }
              onSave(notes, rating > 0 ? rating : undefined);
            }}
          >
            <Save size={18} />
            Save Workout
          </Button>

          {/* Save as Template toggle */}
          {exerciseIds.length > 0 && (
            <div className="rounded-[12px] bg-trainer-surface border border-white/8 overflow-hidden">
              <button
                onClick={() => setSaveAsTemplate((v) => !v)}
                className="w-full flex items-center justify-between px-4 py-3"
              >
                <div className="flex items-center gap-2.5">
                  <Bookmark size={14} className={saveAsTemplate ? "text-trainer-indigo" : "text-white/30"} />
                  <span className={cn("text-sm font-medium", saveAsTemplate ? "text-white" : "text-white/45")}>
                    Save as Template
                  </span>
                </div>
                <div className={cn(
                  "w-10 h-5.5 rounded-full transition-colors relative",
                  saveAsTemplate ? "bg-trainer-indigo" : "bg-white/12"
                )} style={{ height: "22px", width: "40px" }}>
                  <motion.div
                    className="absolute top-[3px] w-4 h-4 rounded-full bg-white shadow-sm"
                    animate={{ left: saveAsTemplate ? "20px" : "3px" }}
                    transition={{ type: "spring", stiffness: 500, damping: 35 }}
                  />
                </div>
              </button>
              <AnimatePresence>
                {saveAsTemplate && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden border-t border-white/8 px-4 py-3"
                  >
                    <input
                      type="text"
                      value={templateName}
                      onChange={(e) => setTemplateName(e.target.value)}
                      placeholder="Template name…"
                      className="w-full bg-trainer-elevated border border-white/10 rounded-[10px] px-3 py-2.5 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-trainer-indigo/40"
                    />
                    <p className="text-[10px] text-white/30 mt-1.5 text-center">
                      Saved to your templates for quick access
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          <Button
            variant="secondary"
            fullWidth
            onClick={handleShare}
            className="border-white/15 text-white/60"
          >
            <Share2 size={16} />
            {shared ? "Copied!" : "Share Session"}
          </Button>

          {onRepeat && (
            <Button
              variant="secondary"
              fullWidth
              onClick={onRepeat}
              className="border-trainer-indigo/30 text-trainer-indigo"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Repeat Today&apos;s Session
            </Button>
          )}

          {!discardConfirm ? (
            <Button
              variant="ghost"
              fullWidth
              onClick={() => setDiscardConfirm(true)}
              className="text-white/40"
            >
              <X size={16} />
              Discard
            </Button>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-trainer-danger/10 border border-trainer-danger/30 rounded-[12px] p-4 space-y-3"
            >
              <p className="text-sm text-trainer-danger text-center">
                Are you sure? Your workout data will be lost.
              </p>
              <div className="flex gap-3">
                <Button variant="danger" fullWidth size="sm" onClick={onDiscard}>
                  Yes, Discard
                </Button>
                <Button
                  variant="ghost"
                  fullWidth
                  size="sm"
                  onClick={() => setDiscardConfirm(false)}
                >
                  Cancel
                </Button>
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
