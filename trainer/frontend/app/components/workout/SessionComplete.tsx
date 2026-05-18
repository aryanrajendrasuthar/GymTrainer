"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Trophy, Clock, Dumbbell, BarChart3, Star, Save, X } from "lucide-react";
import { Button } from "@/app/components/ui/Button";
import { Textarea } from "@/app/components/ui/Input";
import { MuscleActivationDiagram } from "@/app/components/ui/MuscleActivationDiagram";
import { Badge } from "@/app/components/ui/Badge";
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
}

export function SessionComplete({
  session,
  musclesTrained,
  personalRecords,
  unit = "kg",
  onSave,
  onDiscard,
}: SessionCompleteProps) {
  const [notes, setNotes] = useState(session.sessionNotes || "");
  const [discardConfirm, setDiscardConfirm] = useState(false);

  const durationFormatted = session.durationMinutes
    ? `${Math.floor(session.durationMinutes / 60)}h ${session.durationMinutes % 60}m`
    : "—";

  const totalSets = session.exercisesCompleted?.reduce(
    (acc, ex) => acc + ex.sets.length,
    0
  ) ?? 0;

  return (
    <div className="min-h-screen bg-trainer-black flex flex-col">
      {/* Header */}
      <div className="relative flex items-center justify-center pt-12 pb-6 px-4">
        <motion.div
          initial={{ scale: 0, rotate: -10 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.1 }}
          className="w-16 h-16 rounded-full bg-trainer-indigo/20 border border-trainer-indigo/40 flex items-center justify-center"
        >
          <Trophy size={32} className="text-trainer-indigo" />
        </motion.div>
      </div>

      <div className="flex-1 px-4 max-w-content mx-auto w-full pb-8 space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
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
          {[
            {
              icon: Dumbbell,
              label: "Exercises",
              value: `${session.exercisesCompleted?.length ?? 0}`,
              delay: 0.1,
            },
            {
              icon: BarChart3,
              label: "Total Sets",
              value: `${totalSets}`,
              delay: 0.15,
            },
            {
              icon: Clock,
              label: "Duration",
              value: durationFormatted,
              delay: 0.2,
            },
            {
              icon: Star,
              label: "Volume",
              value: formatVolume(session.totalVolumeKg ?? 0, unit),
              delay: 0.25,
            },
          ].map(({ icon: Icon, label, value, delay }) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay }}
              className="bg-trainer-elevated border border-white/8 rounded-[16px] p-4"
            >
              <Icon size={18} className="text-trainer-indigo mb-2" />
              <p className="text-xl font-bold">{value}</p>
              <p className="text-xs text-white/40 mt-0.5">{label}</p>
            </motion.div>
          ))}
        </div>

        {/* Muscle diagram */}
        {musclesTrained.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-trainer-surface border border-white/8 rounded-[16px] p-4"
          >
            <h3 className="text-sm font-medium text-white/60 mb-4 text-center">Muscles Trained</h3>
            <MuscleActivationDiagram
              primaryMuscles={musclesTrained}
              secondaryMuscles={[]}
              size="md"
            />
          </motion.div>
        )}

        {/* Personal records */}
        {personalRecords.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="space-y-2"
          >
            <h3 className="text-sm font-semibold text-trainer-gold flex items-center gap-2">
              <Trophy size={14} />
              Personal Records
            </h3>
            {personalRecords.map((pr) => (
              <div
                key={pr.exerciseName}
                className="flex items-center justify-between bg-trainer-gold/8 border border-trainer-gold/20 rounded-[12px] px-3 py-2.5"
              >
                <div className="flex items-center gap-2">
                  <Badge color="gold" size="sm">PR</Badge>
                  <span className="text-sm font-medium">{pr.exerciseName}</span>
                </div>
                <span className="text-sm font-bold text-trainer-gold tabular-nums">
                  {pr.weightKg}{unit} × {pr.reps}
                </span>
              </div>
            ))}
          </motion.div>
        )}

        {/* Session notes */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
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
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="space-y-3 pb-20 md:pb-4"
        >
          <Button variant="primary" fullWidth size="lg" onClick={() => onSave(notes)}>
            <Save size={18} />
            Save Workout
          </Button>

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
            <div className="bg-trainer-danger/10 border border-trainer-danger/30 rounded-[12px] p-4 space-y-3">
              <p className="text-sm text-trainer-danger text-center">
                Are you sure? Your workout data will be lost.
              </p>
              <div className="flex gap-3">
                <Button
                  variant="danger"
                  fullWidth
                  size="sm"
                  onClick={onDiscard}
                >
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
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
