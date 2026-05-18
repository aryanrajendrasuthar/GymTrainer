"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  Check,
  Dumbbell,
  Calendar,
  Target,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useUserStore } from "@/app/store/userStore";
import { authApi } from "@/app/lib/api";
import { workoutSplits } from "@/app/data/splits";
import { exerciseMap } from "@/app/data/exercises";
import { getWeekLabel } from "@/app/lib/weekVariant";
import { cn } from "@/app/lib/utils";
import type { WorkoutSplit } from "@/app/types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const DIFFICULTY_STYLE = {
  beginner:     "text-trainer-success bg-trainer-success/10",
  intermediate: "text-trainer-warning bg-trainer-warning/10",
  advanced:     "text-trainer-danger  bg-trainer-danger/10",
};

const GOAL_LABELS: Record<string, string> = {
  "muscle-gain":      "Muscle Gain",
  "fat-loss":         "Fat Loss",
  "recomp":           "Recomp",
  "strength":         "Strength",
  "greek-god":        "Greek God",
  "calisthenics":     "Calisthenics",
  "general-fitness":  "General Fitness",
};

const MUSCLE_COLOR: Record<string, string> = {
  chest:        "text-rose-400 bg-rose-400/10",
  back:         "text-sky-400 bg-sky-400/10",
  shoulders:    "text-violet-400 bg-violet-400/10",
  biceps:       "text-indigo-400 bg-indigo-400/10",
  triceps:      "text-purple-400 bg-purple-400/10",
  quads:        "text-amber-400 bg-amber-400/10",
  hamstrings:   "text-orange-400 bg-orange-400/10",
  glutes:       "text-pink-400 bg-pink-400/10",
  calves:       "text-yellow-400 bg-yellow-400/10",
  "full-body":  "text-emerald-400 bg-emerald-400/10",
};

function muscleChip(m: string) {
  return MUSCLE_COLOR[m.toLowerCase()] ?? "text-white/60 bg-white/8";
}

// ─── Day breakdown sheet ──────────────────────────────────────────────────────

function DayBreakdown({ split, weekLabel }: { split: WorkoutSplit; weekLabel: string }) {
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  return (
    <div className="flex flex-col gap-2">
      {split.days.map((day, i) => {
        const isOpen = openIdx === i;
        const exercises = (weekLabel === "Week B" && day.exercisesAlt?.length)
          ? day.exercisesAlt
          : (day.exercises ?? []);

        return (
          <div
            key={i}
            className={cn(
              "rounded-[12px] border overflow-hidden transition-colors",
              isOpen ? "border-trainer-indigo/30 bg-trainer-indigo/5" : "border-white/8 bg-trainer-elevated"
            )}
          >
            <button
              onClick={() => setOpenIdx(isOpen ? null : i)}
              className="flex items-center gap-3 w-full px-3.5 py-3 text-left"
            >
              <div className={cn(
                "w-6 h-6 rounded-full shrink-0 flex items-center justify-center text-[10px] font-bold",
                day.isRestDay ? "bg-white/8 text-white/30" : "bg-trainer-indigo/20 text-trainer-indigo"
              )}>
                {i + 1}
              </div>
              <div className="flex-1 min-w-0">
                <p className={cn("text-sm font-semibold", day.isRestDay ? "text-white/40" : "text-white/85")}>
                  {day.dayName}
                </p>
                {!day.isRestDay && (
                  <p className="text-[11px] text-white/30 mt-0.5">
                    {exercises.length} exercise{exercises.length !== 1 ? "s" : ""}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {day.muscleGroups.slice(0, 2).map((m) => (
                  <span key={m} className={cn("text-[9px] font-bold px-1.5 py-0.5 rounded-full capitalize", muscleChip(m))}>
                    {m}
                  </span>
                ))}
                {!day.isRestDay && (
                  isOpen
                    ? <ChevronUp size={13} className="text-white/30" />
                    : <ChevronDown size={13} className="text-white/30" />
                )}
              </div>
            </button>

            <AnimatePresence>
              {isOpen && !day.isRestDay && exercises.length > 0 && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="px-4 pb-3.5 pt-0 border-t border-white/6 flex flex-col gap-1.5">
                    {exercises.map((exId) => {
                      const ex = exerciseMap[exId];
                      return (
                        <div key={exId} className="flex items-center gap-2">
                          <div className="w-1 h-1 rounded-full bg-trainer-indigo/50 shrink-0" />
                          <p className="text-xs text-white/55">{ex?.name ?? exId}</p>
                          {ex && (
                            <span className="ml-auto text-[10px] text-white/20 capitalize">{ex.difficulty}</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}

// ─── Split card ───────────────────────────────────────────────────────────────

function SplitCard({
  split,
  isCurrent,
  onSelect,
  weekLabel,
}: {
  split: WorkoutSplit;
  isCurrent: boolean;
  onSelect: (id: string) => void;
  weekLabel: string;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.div
      layout
      className={cn(
        "rounded-[18px] border overflow-hidden transition-colors duration-200",
        isCurrent
          ? "border-trainer-indigo/40 bg-gradient-to-br from-trainer-indigo/10 via-trainer-elevated to-trainer-surface"
          : "border-white/8 bg-trainer-surface"
      )}
    >
      <div className="p-4">
        {/* Header row */}
        <div className="flex items-start gap-3 mb-3">
          <div className={cn(
            "w-10 h-10 rounded-[11px] flex items-center justify-center shrink-0",
            isCurrent ? "bg-trainer-indigo/20 border border-trainer-indigo/30" : "bg-white/6"
          )}>
            <Dumbbell size={18} className={isCurrent ? "text-trainer-indigo" : "text-white/40"} />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-sm font-bold text-white leading-tight">{split.name}</p>
              {isCurrent && (
                <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-trainer-indigo text-white uppercase tracking-wide">
                  Current
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 mt-1">
              <span className={cn("text-[10px] font-semibold px-1.5 py-0.5 rounded-full capitalize", DIFFICULTY_STYLE[split.difficulty])}>
                {split.difficulty}
              </span>
              <span className="flex items-center gap-1 text-[11px] text-white/35">
                <Calendar size={10} /> {split.daysPerWeek} days/wk
              </span>
            </div>
          </div>
        </div>

        {/* Description */}
        <p className="text-xs text-white/45 leading-relaxed mb-3">{split.description}</p>

        {/* Goals */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {split.targetGoals.map((goal) => (
            <span key={goal} className="flex items-center gap-1 text-[10px] text-white/50 bg-white/5 border border-white/8 px-2 py-0.5 rounded-full">
              <Target size={9} />
              {GOAL_LABELS[goal] ?? goal}
            </span>
          ))}
        </div>

        {/* Action buttons */}
        <div className="flex gap-2">
          {!isCurrent ? (
            <button
              onClick={() => onSelect(split.id)}
              className="flex-1 py-2.5 rounded-[10px] bg-trainer-indigo text-white text-sm font-bold hover:bg-trainer-indigo-hover transition-colors"
            >
              Use This Split
            </button>
          ) : (
            <div className="flex-1 py-2.5 rounded-[10px] bg-trainer-success/10 border border-trainer-success/25 flex items-center justify-center gap-1.5">
              <Check size={13} className="text-trainer-success" />
              <span className="text-sm font-semibold text-trainer-success">Active Split</span>
            </div>
          )}
          <button
            onClick={() => setExpanded((v) => !v)}
            className="px-3.5 py-2.5 rounded-[10px] bg-white/6 border border-white/8 text-white/50 hover:text-white transition-colors"
            aria-label={expanded ? "Hide days" : "View days"}
          >
            {expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
          </button>
        </div>
      </div>

      {/* Expanded day breakdown */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden border-t border-white/6"
          >
            <div className="p-4 pt-3">
              <p className="text-[10px] text-white/30 uppercase tracking-widest font-semibold mb-3">
                Schedule · {weekLabel}
              </p>
              <DayBreakdown split={split} weekLabel={weekLabel} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SplitsPage() {
  const router = useRouter();
  const { profile, updateProfile, accessToken } = useUserStore();
  const [saving, setSaving] = useState<string | null>(null);
  const weekLabel = getWeekLabel();

  async function handleSelect(splitId: string) {
    if (saving || splitId === profile?.splitId) return;
    setSaving(splitId);
    updateProfile({ splitId });
    if (accessToken) {
      authApi.updateProfile(accessToken, { split_id: splitId }).catch(() => {});
    }
    await new Promise((r) => setTimeout(r, 300));
    setSaving(null);
    router.back();
  }

  return (
    <div className="flex flex-col min-h-full pb-28">
      {/* Header */}
      <div className="sticky top-0 z-20 flex items-center gap-3 px-4 pt-12 pb-4 bg-trainer-black/95 backdrop-blur-md border-b border-white/8">
        <button
          onClick={() => router.back()}
          className="w-8 h-8 rounded-full bg-white/8 flex items-center justify-center"
        >
          <ChevronLeft size={16} className="text-white/60" />
        </button>
        <div className="flex-1">
          <h1 className="text-base font-bold text-white">Training Splits</h1>
          <p className="text-xs text-white/35 mt-0.5">
            {workoutSplits.length} splits · {weekLabel} active
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-4 px-4 py-4">
        {workoutSplits.map((split) => (
          <SplitCard
            key={split.id}
            split={split}
            isCurrent={profile?.splitId === split.id}
            onSelect={handleSelect}
            weekLabel={weekLabel}
          />
        ))}
      </div>

      {saving && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center pointer-events-none">
          <div className="bg-trainer-elevated border border-white/10 rounded-[16px] px-6 py-4 flex items-center gap-3">
            <div className="w-4 h-4 border-2 border-trainer-indigo border-t-transparent rounded-full animate-spin" />
            <p className="text-sm font-medium text-white">Switching split…</p>
          </div>
        </div>
      )}
    </div>
  );
}
