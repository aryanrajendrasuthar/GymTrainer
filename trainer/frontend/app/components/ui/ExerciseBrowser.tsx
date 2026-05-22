"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, ChevronLeft, ChevronRight, Wind } from "lucide-react";
import { allExercises } from "@/app/data/exercises";
import { ExerciseMediaTabs } from "@/app/components/ui/ExerciseMediaTabs";
import { type Exercise, type ExerciseCategory } from "@/app/types";
import { cn } from "@/app/lib/utils";

const CATEGORY_CHIPS: { label: string; value: ExerciseCategory | null }[] = [
  { label: "All", value: null },
  { label: "Chest", value: "chest" },
  { label: "Back", value: "back" },
  { label: "Shoulders", value: "shoulders" },
  { label: "Arms", value: "arms" },
  { label: "Legs", value: "legs" },
  { label: "Glutes", value: "glutes" },
  { label: "Core", value: "core" },
  { label: "Full Body", value: "full-body" },
  { label: "Cardio", value: "cardio" },
];

const DIFFICULTY_COLORS = {
  beginner: "text-emerald-400 bg-emerald-400/10",
  intermediate: "text-amber-400 bg-amber-400/10",
  advanced: "text-red-400 bg-red-400/10",
};

function matchesSearch(ex: Exercise, query: string): boolean {
  if (!query) return true;
  const q = query.toLowerCase();
  return (
    ex.name.toLowerCase().includes(q) ||
    ex.alternativeNames.some((n) => n.toLowerCase().includes(q)) ||
    ex.tags.some((t) => t.toLowerCase().includes(q)) ||
    ex.primaryMuscles.some((m) => m.toLowerCase().includes(q))
  );
}

function ExerciseDetailView({ exercise }: { exercise: Exercise }) {
  const [showInstructions, setShowInstructions] = useState(true);

  return (
    <div className="flex flex-col gap-5">
      <div>
        <div className="flex flex-wrap gap-1.5">
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-trainer-indigo/15 text-trainer-indigo capitalize">
            {exercise.category}
          </span>
          <span className={cn("text-xs font-semibold px-2.5 py-0.5 rounded-full capitalize", DIFFICULTY_COLORS[exercise.difficulty])}>
            {exercise.difficulty}
          </span>
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-white/8 text-white/50 capitalize">
            {exercise.movementType}
          </span>
        </div>
      </div>

      <ExerciseMediaTabs
        youtubeId={exercise.youtubeId}
        exerciseName={exercise.name}
        primaryMuscles={exercise.primaryMuscles}
        secondaryMuscles={exercise.secondaryMuscles}
        wgerExerciseId={exercise.wgerExerciseId}
        defaultTab="muscles"
        instructions={exercise.instructions}
      />

      <div>
        <button
          onClick={() => setShowInstructions((v) => !v)}
          className="flex items-center justify-between w-full mb-3"
        >
          <p className="text-xs text-white/35 uppercase tracking-widest font-semibold">Instructions</p>
          <span className="text-xs text-white/30">{showInstructions ? "Hide" : "Show"}</span>
        </button>
        <AnimatePresence>
          {showInstructions && (
            <motion.ol
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="flex flex-col gap-2 overflow-hidden"
            >
              {exercise.instructions.map((step, i) => (
                <li key={i} className="flex gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-trainer-indigo/20 text-trainer-indigo text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <p className="text-sm text-white/65 leading-relaxed">{step}</p>
                </li>
              ))}
            </motion.ol>
          )}
        </AnimatePresence>
      </div>

      {exercise.formCues.length > 0 && (
        <div>
          <p className="text-xs text-white/35 uppercase tracking-widest font-semibold mb-3">Form Cues</p>
          <ul className="flex flex-col gap-2">
            {exercise.formCues.map((cue, i) => (
              <li key={i} className="flex gap-2 items-start">
                <span className="w-1.5 h-1.5 rounded-full bg-trainer-success/60 shrink-0 mt-1.5" />
                <p className="text-sm text-white/60 leading-relaxed">{cue}</p>
              </li>
            ))}
          </ul>
        </div>
      )}

      {exercise.commonMistakes.length > 0 && (
        <div>
          <p className="text-xs text-white/35 uppercase tracking-widest font-semibold mb-3">Common Mistakes</p>
          <ul className="flex flex-col gap-2">
            {exercise.commonMistakes.map((m, i) => (
              <li key={i} className="flex gap-2 items-start">
                <span className="w-1.5 h-1.5 rounded-full bg-trainer-danger/60 shrink-0 mt-1.5" />
                <p className="text-sm text-white/60 leading-relaxed">{m}</p>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex items-start gap-2.5 p-3.5 rounded-[12px] bg-trainer-indigo/8 border border-trainer-indigo/20">
        <Wind size={14} className="text-trainer-indigo shrink-0 mt-0.5" />
        <div>
          <p className="text-[10px] text-trainer-indigo/70 font-semibold uppercase tracking-wider mb-1">Breathing</p>
          <p className="text-sm text-white/60">{exercise.breathingPattern}</p>
        </div>
      </div>

      {(exercise.progressionExercise || exercise.regressionExercise) && (
        <div className="flex gap-3">
          {exercise.regressionExercise && (
            <div className="flex-1 p-3 rounded-[10px] bg-white/4 border border-white/8">
              <p className="text-[9px] text-white/30 uppercase tracking-widest mb-1">Easier</p>
              <p className="text-xs text-white/60 capitalize">{exercise.regressionExercise.replace(/-/g, " ")}</p>
            </div>
          )}
          {exercise.progressionExercise && (
            <div className="flex-1 p-3 rounded-[10px] bg-trainer-indigo/8 border border-trainer-indigo/20">
              <p className="text-[9px] text-trainer-indigo/60 uppercase tracking-widest mb-1">Progression</p>
              <p className="text-xs text-white/70 capitalize">{exercise.progressionExercise.replace(/-/g, " ")}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ExerciseDetailSheet({ exercise, onClose }: { exercise: Exercise | null; onClose: () => void }) {
  const isOpen = exercise !== null;

  useEffect(() => {
    if (!isOpen) return;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  if (typeof window === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && exercise && (
        <motion.div
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ type: "spring", stiffness: 380, damping: 42 }}
          className="fixed inset-0 z-50 bg-trainer-black flex flex-col"
        >
          <div className="flex items-center gap-3 px-4 pt-14 pb-4 border-b border-white/8 shrink-0">
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/8 flex items-center justify-center text-white/50 shrink-0"
            >
              <ChevronLeft size={18} />
            </button>
            <p className="text-base font-bold text-white truncate flex-1">{exercise.name}</p>
          </div>
          <div className="overflow-y-auto flex-1 px-4 py-5 pb-16">
            <ExerciseDetailView exercise={exercise} />
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}

export function ExerciseBrowser() {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<ExerciseCategory | null>(null);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);

  const filtered = useMemo(() => {
    return allExercises.filter((ex) => {
      if (!matchesSearch(ex, search)) return false;
      if (categoryFilter && ex.category !== categoryFilter) return false;
      return true;
    });
  }, [search, categoryFilter]);

  const clearSearch = useCallback(() => setSearch(""), []);

  return (
    <div className="flex flex-col flex-1">
      <div className="px-5 pb-3">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search exercises, muscles…"
            className={cn(
              "w-full bg-trainer-elevated border border-white/10 rounded-[10px]",
              "pl-9 pr-4 py-3 text-sm text-white placeholder:text-white/30",
              "outline-none focus:border-trainer-indigo/50 transition-colors"
            )}
            style={{ fontSize: "16px" }}
          />
          {search && (
            <button onClick={clearSearch} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60">
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      <div className="px-5 pb-3">
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {CATEGORY_CHIPS.map(({ label, value }) => (
            <button
              key={label}
              onClick={() => setCategoryFilter(value)}
              className={cn(
                "shrink-0 text-xs font-semibold px-3 py-1.5 rounded-full transition-colors",
                categoryFilter === value
                  ? "bg-trainer-indigo text-white"
                  : "bg-white/8 text-white/50 hover:text-white"
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-5 pb-2">
        <p className="text-xs text-white/35">
          <span className="font-semibold text-white/60">{filtered.length}</span>{" "}
          exercise{filtered.length !== 1 ? "s" : ""}
        </p>
      </div>

      <div className="flex-1 px-5 pb-6 flex flex-col gap-2">
        <AnimatePresence mode="popLayout">
          {filtered.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center gap-3 py-16"
            >
              <p className="text-white/25 text-sm text-center">No exercises match your search.</p>
            </motion.div>
          ) : (
            filtered.map((exercise, i) => (
              <motion.button
                key={exercise.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.025, 0.4) }}
                onClick={() => setSelectedExercise(exercise)}
                className="flex items-center gap-3 w-full p-3.5 rounded-[12px] bg-trainer-elevated border border-white/8 hover:border-white/20 transition-colors text-left"
              >
                <div className="w-8 h-8 rounded-[8px] bg-white/6 flex items-center justify-center shrink-0">
                  <span className="text-[11px] font-bold text-white/35 tabular-nums">{i + 1}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white/85 truncate">{exercise.name}</p>
                  <p className="text-xs text-white/35 mt-0.5 truncate capitalize">
                    {exercise.primaryMuscles.slice(0, 3).join(", ").replace(/-/g, " ")}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span className={cn("text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide", DIFFICULTY_COLORS[exercise.difficulty])}>
                    {exercise.difficulty.slice(0, 3)}
                  </span>
                  <span className="text-[10px] text-white/25 capitalize">{exercise.movementType}</span>
                </div>
                <ChevronRight size={14} className="text-white/20 shrink-0" />
              </motion.button>
            ))
          )}
        </AnimatePresence>
      </div>

      <ExerciseDetailSheet
        exercise={selectedExercise}
        onClose={() => setSelectedExercise(null)}
      />
    </div>
  );
}
