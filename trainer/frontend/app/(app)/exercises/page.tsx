"use client";

import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, SlidersHorizontal, ChevronRight, Wind, BookOpen, TrendingUp, History } from "lucide-react";
import Link from "next/link";
import { useUserStore } from "@/app/store/userStore";
import { useSessionStore } from "@/app/store/sessionStore";
import { useSettingsStore } from "@/app/store/settingsStore";
import { allExercises } from "@/app/data/exercises";
import { Modal } from "@/app/components/ui/Modal";
import { Badge } from "@/app/components/ui/Badge";
import { ExerciseMediaTabs } from "@/app/components/ui/ExerciseMediaTabs";
import { OneRMChart } from "@/app/components/progress/OneRMChart";
import { useExerciseHistory } from "@/app/hooks/useExerciseHistory";
import { OneRMCalculatorSheet } from "@/app/components/workout/OneRMCalculatorSheet";
import { estimateOneRepMax } from "@/app/lib/progression-engine";
import { type Exercise, type ExerciseCategory, type Equipment } from "@/app/types";
import { cn } from "@/app/lib/utils";

// ─── Filter config ──────────────────────────────────────────────────────────────

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

const EQUIPMENT_CHIPS: { label: string; value: Equipment | null }[] = [
  { label: "All", value: null },
  { label: "Barbell", value: "barbell" },
  { label: "Dumbbell", value: "dumbbell" },
  { label: "Cable", value: "cable" },
  { label: "Machine", value: "machine" },
  { label: "Bodyweight", value: "bodyweight" },
  { label: "Bands", value: "resistance-band" },
  { label: "Kettlebell", value: "kettlebell" },
];

const DIFFICULTY_COLORS = {
  beginner: "text-emerald-400 bg-emerald-400/10",
  intermediate: "text-amber-400 bg-amber-400/10",
  advanced: "text-red-400 bg-red-400/10",
};

// ─── Helpers ────────────────────────────────────────────────────────────────────

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

// ─── Exercise card ──────────────────────────────────────────────────────────────

function formatLastTrained(dateStr: string): string {
  const today = new Date().toISOString().slice(0, 10);
  if (dateStr === today) return "Today";
  const days = Math.round(
    (new Date(today).getTime() - new Date(dateStr).getTime()) / 86_400_000
  );
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  if (days < 14) return "1w ago";
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

function ExerciseCard({
  exercise,
  index,
  onClick,
  lastTrained,
  improvementPct,
}: {
  exercise: Exercise;
  index: number;
  onClick: () => void;
  lastTrained?: string;
  improvementPct?: number;
}) {
  return (
    <motion.button
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.025, 0.4) }}
      onClick={onClick}
      className="flex items-center gap-3 w-full p-3.5 rounded-[12px] bg-trainer-elevated border border-white/8 hover:border-white/20 transition-colors text-left"
    >
      {/* Index number */}
      <div className="w-8 h-8 rounded-[8px] bg-white/6 flex items-center justify-center shrink-0">
        <span className="text-[11px] font-bold text-white/35 tabular-nums">
          {index + 1}
        </span>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-white/85 truncate">{exercise.name}</p>
        <p className="text-xs text-white/35 mt-0.5 truncate capitalize">
          {exercise.primaryMuscles.slice(0, 3).join(", ").replace(/-/g, " ")}
        </p>
      </div>

      {/* Meta */}
      <div className="flex flex-col items-end gap-1 shrink-0">
        {improvementPct !== undefined && improvementPct >= 5 ? (
          <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-trainer-success/12 text-trainer-success border border-trainer-success/25 uppercase tracking-wide">
            +{improvementPct}%
          </span>
        ) : (
          <span
            className={cn(
              "text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide",
              DIFFICULTY_COLORS[exercise.difficulty]
            )}
          >
            {exercise.difficulty.slice(0, 3)}
          </span>
        )}
        {lastTrained ? (
          <span className="text-[9px] text-trainer-success/70 font-semibold">
            {formatLastTrained(lastTrained)}
          </span>
        ) : (
          <span className="text-[10px] text-white/25 capitalize">
            {exercise.movementType}
          </span>
        )}
      </div>

      <ChevronRight size={14} className="text-white/20 shrink-0" />
    </motion.button>
  );
}

// ─── Exercise detail modal ──────────────────────────────────────────────────────

function ExerciseDetail({ exercise }: { exercise: Exercise }) {
  const [showInstructions, setShowInstructions] = useState(true);
  const { allExerciseLogs, sessionDates } = useSessionStore();
  const { settings } = useSettingsStore();
  const unit = (settings.weightUnit ?? "kg") as "kg" | "lb";
  const history = useExerciseHistory(exercise.id, allExerciseLogs, sessionDates);

  const oneRMData = useMemo(() => {
    return history.history
      .slice(0, 20)
      .reverse()
      .map((entry) => {
        const factor = unit === "lb" ? 2.20462 : 1;
        return {
          date: entry.date,
          estimated1RM: Math.round(entry.estimatedOneRepMax * factor),
          topWeight: Math.round(entry.topSetWeight * factor * 10) / 10,
          topReps: entry.topSetReps,
        };
      });
  }, [history.history, unit]);

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-white mb-2">{exercise.name}</h2>
        <div className="flex flex-wrap gap-1.5">
          <Badge color="indigo" size="sm" className="capitalize">
            {exercise.category}
          </Badge>
          <span
            className={cn(
              "inline-flex items-center text-xs font-semibold px-2.5 py-0.5 rounded-full capitalize",
              DIFFICULTY_COLORS[exercise.difficulty]
            )}
          >
            {exercise.difficulty}
          </span>
          <Badge color="muted" size="sm" className="capitalize">
            {exercise.movementType}
          </Badge>
          {exercise.mechanic !== "bilateral" && (
            <Badge color="muted" size="sm" className="capitalize">
              {exercise.mechanic}
            </Badge>
          )}
        </div>
      </div>

      {/* Personal best callout */}
      {history.allTimeBest1RM > 0 && history.history[0] && (
        <div className="flex items-center gap-3 px-3.5 py-3 rounded-[12px] bg-trainer-gold/8 border border-trainer-gold/20">
          <div className="w-8 h-8 rounded-full bg-trainer-gold/15 flex items-center justify-center shrink-0">
            <TrendingUp size={14} className="text-trainer-gold" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] text-trainer-gold/60 uppercase tracking-widest font-bold mb-0.5">Your Best</p>
            <p className="text-sm font-bold text-trainer-gold tabular-nums">
              {unit === "lb"
                ? `${Math.round(history.history[0].topSetWeight * 2.20462)} lb`
                : `${history.history[0].topSetWeight} kg`}{" "}
              × {history.history[0].topSetReps}
            </p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-[9px] text-white/30 uppercase tracking-wide font-semibold">e1RM</p>
            <p className="text-sm font-bold text-white/70 tabular-nums">
              {unit === "lb"
                ? `${Math.round(history.allTimeBest1RM * 2.20462)}`
                : `${Math.round(history.allTimeBest1RM * 10) / 10}`}{unit}
            </p>
          </div>
        </div>
      )}

      {/* Equipment */}
      <div>
        <p className="text-xs text-white/35 uppercase tracking-widest font-semibold mb-2">
          Equipment
        </p>
        <div className="flex flex-wrap gap-1.5">
          {exercise.equipment.map((eq) => (
            <span
              key={eq}
              className="text-xs px-2.5 py-1 rounded-full bg-white/8 text-white/60 capitalize"
            >
              {eq.replace(/-/g, " ")}
            </span>
          ))}
        </div>
      </div>

      {/* Muscle map */}
      <ExerciseMediaTabs
        youtubeId={exercise.youtubeId}
        exerciseName={exercise.name}
        primaryMuscles={exercise.primaryMuscles}
        secondaryMuscles={exercise.secondaryMuscles}
        wgerExerciseId={exercise.wgerExerciseId}
        defaultTab="muscles"
        instructions={exercise.instructions}
        localDetails={{
          equipment: exercise.equipment,
          movementType: exercise.movementType,
          forceType: exercise.forceType,
          mechanic: exercise.mechanic,
          tags: exercise.tags,
          contraindications: exercise.contraindications,
        }}
      />

      {/* Instructions */}
      <div>
        <button
          onClick={() => setShowInstructions((v) => !v)}
          className="flex items-center justify-between w-full mb-3"
        >
          <p className="text-xs text-white/35 uppercase tracking-widest font-semibold">
            Instructions
          </p>
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

      {/* Form cues */}
      {exercise.formCues.length > 0 && (
        <div>
          <p className="text-xs text-white/35 uppercase tracking-widest font-semibold mb-3">
            Form Cues
          </p>
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

      {/* Common mistakes */}
      {exercise.commonMistakes.length > 0 && (
        <div>
          <p className="text-xs text-white/35 uppercase tracking-widest font-semibold mb-3">
            Common Mistakes
          </p>
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

      {/* Personal history mini-chart */}
      {oneRMData.length >= 2 && (
        <div className="rounded-[12px] bg-trainer-indigo/6 border border-trainer-indigo/15 p-3.5">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp size={12} className="text-trainer-indigo" />
            <p className="text-[10px] text-trainer-indigo/70 font-semibold uppercase tracking-wider">
              Your e1RM Progress
            </p>
            <span className="ml-auto text-xs font-bold text-white/70 tabular-nums">
              {oneRMData[oneRMData.length - 1]?.estimated1RM} {unit}
            </span>
          </div>
          <OneRMChart
            data={oneRMData}
            unit={unit}
            exerciseName={exercise.name}
          />
          <p className="text-[9px] text-white/20 mt-1 text-right">
            {history.totalSessions} sessions logged
          </p>
        </div>
      )}

      {/* Last session set-by-set breakdown */}
      {history.history.length > 0 && history.history[0].sets.length > 0 && (() => {
        const last = history.history[0];
        const factor = unit === "lb" ? 2.20462 : 1;
        return (
          <div className="rounded-[12px] bg-white/4 border border-white/8 p-3.5">
            <div className="flex items-center gap-2 mb-2.5">
              <History size={12} className="text-white/30" />
              <p className="text-[10px] text-white/30 font-semibold uppercase tracking-wider">
                Last Session
              </p>
              <span className="ml-auto text-[10px] text-white/25">{last.date}</span>
            </div>
            <div className="flex flex-col gap-1.5">
              {last.sets.map((s, i) => (
                <div key={i} className="flex items-center justify-between">
                  <span className="text-[10px] text-white/35 w-12">Set {i + 1}</span>
                  <div className="flex-1 flex items-center justify-end gap-2">
                    <span className="text-xs font-semibold text-white/75 tabular-nums">
                      {Math.round(s.weightUsed * factor * 10) / 10}{unit} × {s.repsCompleted}
                    </span>
                    {s.rpe != null && s.rpe > 0 && (
                      <span className={cn(
                        "text-[9px] font-bold px-1.5 py-0.5 rounded-full",
                        s.rpe >= 9 ? "bg-red-500/15 text-red-400" :
                        s.rpe >= 7 ? "bg-amber-400/15 text-amber-400" :
                        "bg-white/8 text-white/35"
                      )}>
                        RPE {s.rpe}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      {/* Breathing */}
      <div className="flex items-start gap-2.5 p-3.5 rounded-[12px] bg-trainer-indigo/8 border border-trainer-indigo/20">
        <Wind size={14} className="text-trainer-indigo shrink-0 mt-0.5" />
        <div>
          <p className="text-[10px] text-trainer-indigo/70 font-semibold uppercase tracking-wider mb-1">
            Breathing
          </p>
          <p className="text-sm text-white/60">{exercise.breathingPattern}</p>
        </div>
      </div>

      {/* Progression / regression */}
      {(exercise.progressionExercise || exercise.regressionExercise) && (
        <div className="flex gap-3">
          {exercise.regressionExercise && (
            <div className="flex-1 p-3 rounded-[10px] bg-white/4 border border-white/8">
              <p className="text-[9px] text-white/30 uppercase tracking-widest mb-1">Easier</p>
              <p className="text-xs text-white/60 capitalize">
                {exercise.regressionExercise.replace(/-/g, " ")}
              </p>
            </div>
          )}
          {exercise.progressionExercise && (
            <div className="flex-1 p-3 rounded-[10px] bg-trainer-indigo/8 border border-trainer-indigo/20">
              <p className="text-[9px] text-trainer-indigo/60 uppercase tracking-widest mb-1">Progression</p>
              <p className="text-xs text-white/70 capitalize">
                {exercise.progressionExercise.replace(/-/g, " ")}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Page ───────────────────────────────────────────────────────────────────────

export default function ExercisesPage() {
  const { profile } = useUserStore();
  const { settings } = useSettingsStore();
  const { allExerciseLogs } = useSessionStore();
  const pageUnit = (settings.weightUnit ?? profile?.units ?? "kg") as "kg" | "lb";

  const lastTrainedMap = useMemo(() => {
    const map: Record<string, string> = {};
    for (const log of allExerciseLogs) {
      const date = log.loggedAt?.slice(0, 10);
      if (!date) continue;
      if (!map[log.exerciseId] || date > map[log.exerciseId]) {
        map[log.exerciseId] = date;
      }
    }
    return map;
  }, [allExerciseLogs]);

  const improvementMap = useMemo(() => {
    const now = Date.now();
    const cut8 = now - 56 * 86400000;
    const cut16 = now - 112 * 86400000;
    const byExercise: Record<string, { recent: number[]; earlier: number[] }> = {};
    for (const log of allExerciseLogs) {
      const t = new Date(log.loggedAt).getTime();
      if (t < cut16) continue;
      const e1rms = log.sets
        .map((s) => estimateOneRepMax(s.weightUsed, s.repsCompleted))
        .filter((v) => v > 0);
      const best = e1rms.length ? Math.max(...e1rms) : 0;
      if (best === 0) continue;
      if (!byExercise[log.exerciseId]) byExercise[log.exerciseId] = { recent: [], earlier: [] };
      if (t >= cut8) byExercise[log.exerciseId].recent.push(best);
      else byExercise[log.exerciseId].earlier.push(best);
    }
    const result: Record<string, number> = {};
    for (const [id, { recent, earlier }] of Object.entries(byExercise)) {
      if (recent.length < 2 || earlier.length < 2) continue;
      const recentBest = Math.max(...recent);
      const earlierBest = Math.max(...earlier);
      if (earlierBest === 0) continue;
      const pct = Math.round(((recentBest - earlierBest) / earlierBest) * 100);
      if (pct >= 5) result[id] = pct;
    }
    return result;
  }, [allExerciseLogs]);

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<ExerciseCategory | null>(null);
  const [equipmentFilter, setEquipmentFilter] = useState<Equipment | null>(null);
  const [difficultyFilter, setDifficultyFilter] = useState<Exercise["difficulty"] | null>(null);
  const [myEquipmentOnly, setMyEquipmentOnly] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);

  const userEquipment = useMemo(() => profile?.equipment ?? [], [profile?.equipment]);

  const filtered = useMemo(() => {
    return allExercises.filter((ex) => {
      if (!matchesSearch(ex, search)) return false;
      if (categoryFilter && ex.category !== categoryFilter) return false;
      if (equipmentFilter && !ex.equipment.includes(equipmentFilter)) return false;
      if (difficultyFilter && ex.difficulty !== difficultyFilter) return false;
      if (myEquipmentOnly && userEquipment.length > 0) {
        const hasEquipment = ex.equipment.some(
          (eq) => userEquipment.includes(eq) || eq === "bodyweight" || eq === "none"
        );
        if (!hasEquipment) return false;
      }
      return true;
    });
  }, [search, categoryFilter, equipmentFilter, difficultyFilter, myEquipmentOnly, userEquipment]);

  const activeFilterCount = [
    categoryFilter,
    equipmentFilter,
    difficultyFilter,
    myEquipmentOnly,
  ].filter(Boolean).length;

  const clearFilters = useCallback(() => {
    setCategoryFilter(null);
    setEquipmentFilter(null);
    setDifficultyFilter(null);
    setMyEquipmentOnly(false);
  }, []);

  return (
    <div className="flex flex-col min-h-full page-enter">
      {/* Header */}
      <div className="px-5 pt-14 pb-4 space-y-3">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">Exercises</h1>
          <div className="flex items-center gap-2">
            {activeFilterCount > 0 && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1 text-xs text-trainer-indigo"
              >
                Clear ({activeFilterCount})
                <X size={12} />
              </button>
            )}
            <OneRMCalculatorSheet unit={pageUnit} />
            <Link
              href="/glossary"
              className="flex items-center gap-1.5 text-xs font-semibold text-white/40 hover:text-white/70 transition-colors"
            >
              <BookOpen size={14} />
              Glossary
            </Link>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none"
          />
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
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Filter toggle */}
        <button
          onClick={() => setShowFilters((v) => !v)}
          className={cn(
            "flex items-center gap-2 text-sm font-medium px-3 py-2 rounded-[8px] transition-colors",
            showFilters
              ? "bg-trainer-indigo/15 text-trainer-indigo border border-trainer-indigo/30"
              : "bg-white/6 text-white/60 hover:text-white border border-white/8"
          )}
        >
          <SlidersHorizontal size={14} />
          Filters
          {activeFilterCount > 0 && (
            <span className="ml-1 w-4 h-4 rounded-full bg-trainer-indigo text-white text-[10px] font-bold flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {/* Filter panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden border-y border-white/6 bg-trainer-surface/60"
          >
            <div className="px-5 py-4 flex flex-col gap-4">
              {/* Category */}
              <div>
                <p className="text-[10px] text-white/30 uppercase tracking-widest font-semibold mb-2">
                  Category
                </p>
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

              {/* Equipment */}
              <div>
                <p className="text-[10px] text-white/30 uppercase tracking-widest font-semibold mb-2">
                  Equipment
                </p>
                <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                  {EQUIPMENT_CHIPS.map(({ label, value }) => (
                    <button
                      key={label}
                      onClick={() => setEquipmentFilter(value)}
                      className={cn(
                        "shrink-0 text-xs font-semibold px-3 py-1.5 rounded-full transition-colors",
                        equipmentFilter === value
                          ? "bg-trainer-indigo text-white"
                          : "bg-white/8 text-white/50 hover:text-white"
                      )}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Difficulty */}
              <div>
                <p className="text-[10px] text-white/30 uppercase tracking-widest font-semibold mb-2">
                  Difficulty
                </p>
                <div className="flex gap-2">
                  {(["beginner", "intermediate", "advanced"] as const).map((d) => (
                    <button
                      key={d}
                      onClick={() => setDifficultyFilter(difficultyFilter === d ? null : d)}
                      className={cn(
                        "text-xs font-semibold px-3 py-1.5 rounded-full transition-colors capitalize",
                        difficultyFilter === d
                          ? "bg-trainer-indigo text-white"
                          : "bg-white/8 text-white/50 hover:text-white"
                      )}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              {/* My equipment toggle */}
              {userEquipment.length > 0 && (
                <button
                  onClick={() => setMyEquipmentOnly((v) => !v)}
                  className={cn(
                    "flex items-center gap-2 text-sm font-medium px-3 py-2.5 rounded-[10px] border transition-colors text-left",
                    myEquipmentOnly
                      ? "bg-trainer-success/12 border-trainer-success/40 text-trainer-success"
                      : "bg-white/4 border-white/10 text-white/50"
                  )}
                >
                  <div
                    className={cn(
                      "w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0",
                      myEquipmentOnly ? "bg-trainer-success border-trainer-success" : "border-white/30"
                    )}
                  >
                    {myEquipmentOnly && (
                      <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  My equipment only ({userEquipment.length} items)
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results count */}
      <div className="px-5 py-3">
        <p className="text-xs text-white/35">
          <span className="font-semibold text-white/60">{filtered.length}</span>
          {" "}exercise{filtered.length !== 1 ? "s" : ""}
          {activeFilterCount > 0 || search ? " matching" : " total"}
        </p>
      </div>

      {/* Exercise list */}
      <div className="flex-1 px-5 pb-24 flex flex-col gap-2">
        <AnimatePresence mode="popLayout">
          {filtered.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center gap-3 py-16"
            >
              <p className="text-white/25 text-sm text-center">
                No exercises match your filters.
                <br />
                Try adjusting your search.
              </p>
              {activeFilterCount > 0 && (
                <button
                  onClick={clearFilters}
                  className="text-xs text-trainer-indigo underline"
                >
                  Clear filters
                </button>
              )}
            </motion.div>
          ) : (
            filtered.map((exercise, i) => (
              <ExerciseCard
                key={exercise.id}
                exercise={exercise}
                index={i}
                onClick={() => setSelectedExercise(exercise)}
                lastTrained={lastTrainedMap[exercise.id]}
                improvementPct={improvementMap[exercise.id]}
              />
            ))
          )}
        </AnimatePresence>
      </div>

      {/* Exercise detail modal */}
      <Modal
        isOpen={selectedExercise !== null}
        onClose={() => setSelectedExercise(null)}
        showClose
      >
        {selectedExercise && <ExerciseDetail exercise={selectedExercise} />}
      </Modal>
    </div>
  );
}
