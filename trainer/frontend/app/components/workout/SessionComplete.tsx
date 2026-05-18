"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Clock, Dumbbell, BarChart3, Star, Save, X, Zap } from "lucide-react";
import { Button } from "@/app/components/ui/Button";
import { Textarea } from "@/app/components/ui/Input";
import { MuscleActivationDiagram } from "@/app/components/ui/MuscleActivationDiagram";
import { Badge } from "@/app/components/ui/Badge";
import { Confetti } from "@/app/components/ui/Confetti";
import { useCountUp } from "@/app/hooks/useCountUp";
import { type WorkoutSession, type MuscleGroup } from "@/app/types";
import { formatVolume } from "@/app/lib/utils";

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
  onSave: (notes: string) => void;
  onDiscard: () => void;
  onRepeat?: () => void;
}

// ─── Animated stat card ────────────────────────────────────────────────────────

function StatCard({
  icon: Icon,
  label,
  value,
  delay,
  highlight,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  delay: number;
  highlight?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.92 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay, type: "spring", stiffness: 300, damping: 24 }}
      className={`rounded-[16px] p-4 border ${
        highlight
          ? "bg-trainer-gold/8 border-trainer-gold/25"
          : "bg-trainer-elevated border-white/8"
      }`}
    >
      <Icon size={18} className={highlight ? "text-trainer-gold mb-2" : "text-trainer-indigo mb-2"} />
      <p className="text-xl font-bold">{value}</p>
      <p className="text-xs text-white/40 mt-0.5">{label}</p>
    </motion.div>
  );
}

export function SessionComplete({
  session,
  musclesTrained,
  personalRecords,
  unit = "kg",
  onSave,
  onDiscard,
  onRepeat,
}: SessionCompleteProps) {
  const [notes, setNotes] = useState(session.sessionNotes || "");
  const [discardConfirm, setDiscardConfirm] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const hasPR = personalRecords.length > 0;

  // Fire confetti after mount when there are PRs
  useEffect(() => {
    if (hasPR) {
      const t = setTimeout(() => setShowConfetti(true), 600);
      return () => clearTimeout(t);
    }
  }, [hasPR]);

  const durationFormatted = session.durationMinutes
    ? `${Math.floor(session.durationMinutes / 60)}h ${session.durationMinutes % 60}m`
    : "—";

  const totalSets =
    session.exercisesCompleted?.reduce((acc, ex) => acc + ex.sets.length, 0) ?? 0;

  const exerciseCount = session.exercisesCompleted?.length ?? 0;
  const volumeKg = session.totalVolumeKg ?? 0;

  const animatedSets = useCountUp(totalSets, 600, 400);
  const animatedExercises = useCountUp(exerciseCount, 500, 300);

  return (
    <div className="min-h-screen bg-trainer-black flex flex-col">
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
          />
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

        {/* Session notes */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
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

        {/* Action buttons */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="space-y-3 pb-20 md:pb-4"
        >
          <Button variant="primary" fullWidth size="lg" onClick={() => onSave(notes)}>
            <Save size={18} />
            Save Workout
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
