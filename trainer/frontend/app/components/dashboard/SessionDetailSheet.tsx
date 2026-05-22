"use client";

import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Clock, TrendingUp, Dumbbell, Star, Flame } from "lucide-react";
import { exerciseMap } from "@/app/data/exercises";
import { useCustomExerciseStore } from "@/app/store/customExerciseStore";
import { useSettingsStore } from "@/app/store/settingsStore";
import { useUserStore } from "@/app/store/userStore";
import { type WorkoutSession } from "@/app/types";
import { formatVolume, cn } from "@/app/lib/utils";

const METABOLIC_IDS = ["battle-ropes", "burpee", "mountain-climbers", "box-jump", "jump-rope", "kettlebell-swing"];
const HEAVY_IDS     = ["barbell-deadlift", "barbell-squat", "barbell-bench-press", "overhead-press", "barbell-bent-over-row"];

function estimateCals(weightKg: number, durationMin: number, exerciseIds: string[]): number {
  if (!weightKg || durationMin <= 0) return 0;
  const isMetabolic = exerciseIds.some((id) => METABOLIC_IDS.includes(id));
  const heavyCount  = exerciseIds.filter((id) => HEAVY_IDS.includes(id)).length;
  const met = isMetabolic ? 7.0 : heavyCount >= 2 ? 5.5 : 4.0;
  return Math.round(met * weightKg * (durationMin / 60));
}

const RATING_LABELS = ["", "Rough session", "Below average", "Decent workout", "Solid session", "Absolute beast! 🔥"];

interface Props {
  session: WorkoutSession | null;
  open: boolean;
  onClose: () => void;
}

export function SessionDetailSheet({ session, open, onClose }: Props) {
  const { customExercises } = useCustomExerciseStore();
  const { settings } = useSettingsStore();
  const { profile } = useUserStore();

  const mergedMap = useMemo(
    () => ({ ...exerciseMap, ...Object.fromEntries(customExercises.map((e) => [e.id, e])) }),
    [customExercises]
  );

  const unit = (settings.weightUnit ?? profile?.units ?? "kg") as "kg" | "lb";
  const userWeightKg = profile?.weightKg ?? 70;

  if (!session) return null;

  const hours = Math.floor(session.durationMinutes / 60);
  const mins  = session.durationMinutes % 60;
  const timeStr = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;

  const exerciseIds = session.exercisesCompleted.map((e) => e.exerciseId);
  const cals = estimateCals(userWeightKg, session.durationMinutes, exerciseIds);
  const totalSets = session.exercisesCompleted.reduce((s, log) => s + log.sets.length, 0);
  const totalReps = session.exercisesCompleted.reduce(
    (s, log) => s + log.sets.reduce((r, set) => r + set.repsCompleted, 0),
    0
  );
  const avgRepsPerSet = totalSets > 0 ? Math.round(totalReps / totalSets) : null;

  const formattedDate = new Date(session.date).toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric", year: "numeric",
  });

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ type: "spring", stiffness: 380, damping: 42 }}
          className="fixed inset-0 z-50 bg-trainer-elevated flex flex-col"
        >
          {/* Header */}
          <div className="flex items-start justify-between px-5 pt-12 pb-4 border-b border-white/8 shrink-0">
            <div>
              <p className="text-base font-bold text-white">{session.splitDay}</p>
              <p className="text-xs text-white/35 mt-0.5">{formattedDate}</p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/8 flex items-center justify-center text-white/40 hover:text-white transition-colors"
            >
              <X size={15} />
            </button>
          </div>

          {/* Summary row */}
          <div className="px-4 py-3 border-b border-white/6 shrink-0">
            <div className="flex gap-2">
              {[
                { icon: TrendingUp, label: "Volume",    value: formatVolume(session.totalVolumeKg, unit),    color: "text-trainer-success" },
                { icon: Clock,      label: "Duration",  value: timeStr,                                       color: "text-trainer-warning" },
                { icon: Dumbbell,   label: avgRepsPerSet ? `~${avgRepsPerSet} reps/set` : "Sets", value: `${totalSets}`,         color: "text-trainer-indigo"  },
                ...(cals > 0 ? [{ icon: Flame, label: "Est. Cals", value: `~${cals}`, color: "text-orange-400" }] : []),
              ].map(({ icon: Icon, label, value, color }) => (
                <div key={label} className="flex-1 bg-trainer-surface rounded-[10px] p-2.5 text-center">
                  <Icon size={12} className={cn("mx-auto mb-1", color)} />
                  <p className="text-xs font-bold text-white">{value}</p>
                  <p className="text-[9px] text-white/30 mt-0.5">{label}</p>
                </div>
              ))}
            </div>

            {/* Star rating display */}
            {session.rating && (
              <div className="flex items-center gap-1.5 mt-2">
                <div className="flex gap-0.5">
                  {[1,2,3,4,5].map((s) => (
                    <Star
                      key={s}
                      size={12}
                      className={s <= session.rating! ? "text-trainer-gold fill-trainer-gold" : "text-white/10"}
                    />
                  ))}
                </div>
                <span className="text-[10px] text-white/35">{RATING_LABELS[session.rating]}</span>
              </div>
            )}
          </div>

          {/* Exercise list */}
          <div className="overflow-y-auto flex-1 px-4 py-4 pb-16 flex flex-col gap-3">
            {session.exercisesCompleted.map((log, i) => {
              const ex = mergedMap[log.exerciseId];
              const name = ex?.name ?? log.exerciseId;
              const totalVol = log.sets.reduce((s, set) => s + set.weightUsed * set.repsCompleted, 0);
              return (
                <motion.div
                  key={log.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="bg-trainer-surface rounded-[14px] overflow-hidden"
                >
                  {/* Exercise header */}
                  <div className="flex items-center justify-between px-3 py-2.5 border-b border-white/5">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-[7px] bg-trainer-indigo/15 flex items-center justify-center shrink-0">
                        <Dumbbell size={11} className="text-trainer-indigo" />
                      </div>
                      <p className="text-sm font-semibold text-white">{name}</p>
                    </div>
                    <span className="text-[10px] text-white/30">
                      {formatVolume(totalVol, unit)}
                    </span>
                  </div>

                  {/* Sets */}
                  <div className="px-3 py-2 flex flex-col gap-1">
                    {log.sets.map((set) => (
                      <div key={set.setNumber} className="flex items-center gap-3">
                        <span className="text-[10px] text-white/25 w-10 shrink-0">Set {set.setNumber}</span>
                        <div className="flex-1 flex items-center gap-2">
                          <span className="text-sm font-bold text-white tabular-nums">
                            {unit === "lb"
                              ? `${Math.round(set.weightUsed * 2.20462)} lb`
                              : `${set.weightUsed % 1 === 0 ? set.weightUsed : set.weightUsed.toFixed(1)} kg`}
                          </span>
                          <span className="text-white/25 text-xs">×</span>
                          <span className="text-sm font-bold text-white/80 tabular-nums">{set.repsCompleted} reps</span>
                        </div>
                        {set.rpe && (
                          <span className="text-[10px] text-white/25">RPE {set.rpe}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </motion.div>
              );
            })}

            {/* Session notes */}
            {session.sessionNotes && (
              <div className="bg-trainer-surface rounded-[14px] px-3 py-3">
                <p className="text-[10px] text-white/30 uppercase tracking-widest font-semibold mb-1">Notes</p>
                <p className="text-sm text-white/60 leading-relaxed">{session.sessionNotes}</p>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
