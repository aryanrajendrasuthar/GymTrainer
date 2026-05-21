"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Target, Plus, X, Check, ChevronRight, Trophy } from "lucide-react";
import { useGoalStore, type PerformanceGoal } from "@/app/store/goalStore";
import { useSessionStore } from "@/app/store/sessionStore";
import { useProgressStore } from "@/app/store/progressStore";
import { useSettingsStore } from "@/app/store/settingsStore";
import { useUserStore } from "@/app/store/userStore";
import { allExercises, exerciseMap } from "@/app/data/exercises";
import { estimateOneRepMax } from "@/app/lib/progression-engine";
import { cn } from "@/app/lib/utils";

// ─── Progress computation ──────────────────────────────────────────────────────

function useGoalProgress(goal: PerformanceGoal): { current: number; pct: number } {
  const { allExerciseLogs } = useSessionStore();
  const { bodyWeightLogs } = useProgressStore();

  return useMemo(() => {
    let current = 0;

    if (goal.type === "strength" && goal.exerciseId) {
      const logs = allExerciseLogs.filter((l) => l.exerciseId === goal.exerciseId);
      let best = 0;
      for (const log of logs) {
        for (const s of log.sets) {
          const e1rm = estimateOneRepMax(s.weightUsed, s.repsCompleted);
          if (e1rm > best) best = e1rm;
        }
      }
      current = Math.round(best * 10) / 10;
    } else if (goal.type === "bodyweight") {
      const latest = bodyWeightLogs[0];
      if (latest) current = latest.weightKg;
    } else {
      current = goal.startValue ?? 0;
    }

    const start = goal.startValue ?? 0;
    const target = goal.targetValue;
    let pct = 0;
    if (target !== start) {
      pct = Math.min(1, Math.max(0, (current - start) / (target - start)));
    } else if (current >= target) {
      pct = 1;
    }

    return { current, pct };
  }, [goal, allExerciseLogs, bodyWeightLogs]);
}

// ─── Single goal card ──────────────────────────────────────────────────────────

function GoalPill({ goal, onDelete }: { goal: PerformanceGoal; onDelete: () => void }) {
  const { pct, current } = useGoalProgress(goal);
  const { markAchieved } = useGoalStore();
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  const achieved = goal.achieved || pct >= 1;
  const daysLeft = goal.deadline
    ? Math.ceil((new Date(goal.deadline).getTime() - Date.now()) / 86400000)
    : null;

  const pace = (() => {
    if (!goal.deadline || !goal.createdAt || achieved) return null;
    const total = new Date(goal.deadline).getTime() - new Date(goal.createdAt).getTime();
    if (total <= 0) return null;
    const elapsed = Date.now() - new Date(goal.createdAt).getTime();
    const expectedPct = Math.min(1, elapsed / total);
    const delta = pct - expectedPct;
    if (delta > 0.08) return { label: "Ahead", color: "text-trainer-success" };
    if (delta > -0.08) return { label: "On track", color: "text-trainer-success/70" };
    if (delta > -0.2) return { label: "Behind", color: "text-amber-400" };
    return { label: "Off pace", color: "text-red-400" };
  })();

  const projectedLabel = (() => {
    if (achieved || pct <= 0.02 || !goal.createdAt) return null;
    const elapsed = Date.now() - new Date(goal.createdAt).getTime();
    const projectedMs = new Date(goal.createdAt).getTime() + elapsed / pct;
    const projected = new Date(projectedMs);
    return projected.toLocaleDateString("en-US", { month: "short", year: "numeric" });
  })();

  const R = 20;
  const circ = 2 * Math.PI * R;
  const ringColor = achieved ? "#4ade80" : pct > 0.7 ? "#6c63ff" : pct > 0.4 ? "#f59e0b" : "#ffffff33";

  return (
    <div className="shrink-0 w-[152px] rounded-[16px] bg-trainer-surface border border-white/8 p-3.5 flex flex-col gap-2.5 relative">
      {/* Delete button */}
      {deleteConfirm ? (
        <div className="absolute inset-0 bg-trainer-surface rounded-[16px] z-10 flex flex-col items-center justify-center gap-2 p-3">
          <p className="text-xs text-white/60 text-center">Delete this goal?</p>
          <div className="flex gap-2 w-full">
            <button
              onClick={onDelete}
              className="flex-1 py-1.5 rounded-[8px] bg-red-500/15 text-red-400 text-xs font-bold"
            >Yes</button>
            <button
              onClick={() => setDeleteConfirm(false)}
              className="flex-1 py-1.5 rounded-[8px] bg-white/8 text-white/50 text-xs font-bold"
            >No</button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setDeleteConfirm(true)}
          className="absolute top-2 right-2 w-5 h-5 rounded-full bg-white/6 flex items-center justify-center text-white/20 hover:text-white/50 transition-colors"
        >
          <X size={10} />
        </button>
      )}

      {/* Ring gauge */}
      <div className="flex items-center justify-between">
        <div className="relative w-11 h-11">
          <svg width="44" height="44" className="-rotate-90">
            <circle cx="22" cy="22" r={R} strokeWidth="3" stroke="rgba(255,255,255,0.06)" fill="none" />
            <motion.circle
              cx="22" cy="22" r={R}
              strokeWidth="3"
              stroke={ringColor}
              fill="none"
              strokeLinecap="round"
              strokeDasharray={circ}
              initial={{ strokeDashoffset: circ }}
              animate={{ strokeDashoffset: circ * (1 - pct) }}
              transition={{ duration: 0.9, ease: "easeOut" }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            {achieved
              ? <Check size={14} className="text-trainer-success" />
              : <span className="text-[10px] font-black text-white/70">{Math.round(pct * 100)}%</span>
            }
          </div>
        </div>

        {/* Achieved badge */}
        {achieved && !goal.achieved && (
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            onClick={() => markAchieved(goal.id)}
            className="flex items-center gap-1 px-2 py-1 rounded-full bg-trainer-success/15 border border-trainer-success/30 text-trainer-success text-[9px] font-bold"
          >
            <Trophy size={9} /> Mark done
          </motion.button>
        )}
      </div>

      {/* Label */}
      <p className="text-xs font-bold text-white/85 leading-snug line-clamp-2">{goal.label}</p>

      {/* Progress numbers */}
      <div className="mt-auto">
        <p className="text-[10px] text-white/35">
          <span className="font-bold text-white/65 tabular-nums">{current.toFixed(1)}</span>
          <span className="mx-0.5">/</span>
          <span>{goal.targetValue} {goal.unit}</span>
        </p>
        {daysLeft !== null && !achieved && (
          <p className={cn("text-[9px] mt-0.5", daysLeft < 7 ? "text-amber-400" : "text-white/25")}>
            {daysLeft > 0 ? `${daysLeft}d left` : "Overdue"}
          </p>
        )}
        {pace && (
          <p className={cn("text-[9px] font-bold mt-0.5", pace.color)}>{pace.label}</p>
        )}
        {projectedLabel && (
          <p className="text-[9px] text-white/20 mt-0.5">~{projectedLabel}</p>
        )}
      </div>
    </div>
  );
}

// ─── Add goal form ─────────────────────────────────────────────────────────────

function AddGoalSheet({
  onClose,
  unit,
}: {
  onClose: () => void;
  unit: "kg" | "lb";
}) {
  const { addGoal } = useGoalStore();
  const { allExerciseLogs } = useSessionStore();
  const { bodyWeightLogs } = useProgressStore();

  const [type, setType] = useState<"strength" | "bodyweight">("strength");
  const [exerciseId, setExerciseId] = useState("");
  const [targetRaw, setTargetRaw] = useState("");
  const [deadline, setDeadline] = useState("");
  const [search, setSearch] = useState("");

  const popularExercises = useMemo(() => {
    const ids = new Set(allExerciseLogs.map((l) => l.exerciseId));
    const logged = allExercises.filter((ex) => ids.has(ex.id));
    const compound = allExercises.filter(
      (ex) => ex.movementType === "compound" && !ids.has(ex.id)
    );
    return [...logged.slice(0, 8), ...compound.slice(0, 12)].slice(0, 15);
  }, [allExerciseLogs]);

  const filteredExercises = useMemo(() => {
    if (!search) return popularExercises;
    const q = search.toLowerCase();
    return allExercises.filter((ex) => ex.name.toLowerCase().includes(q)).slice(0, 12);
  }, [search, popularExercises]);

  function handleSubmit() {
    const target = parseFloat(targetRaw);
    if (isNaN(target) || target <= 0) return;
    if (type === "strength" && !exerciseId) return;

    let label = "";
    let startValue = 0;

    if (type === "strength") {
      const ex = exerciseMap[exerciseId];
      const display = unit === "lb" ? `${Math.round(target / 2.20462 * 2.20462)} ${unit}` : `${target} ${unit}`;
      label = `${ex?.name ?? exerciseId} — ${display} e1RM`;
      // Compute current best
      const logs = allExerciseLogs.filter((l) => l.exerciseId === exerciseId);
      let best = 0;
      for (const log of logs) {
        for (const s of log.sets) {
          const e1rm = estimateOneRepMax(s.weightUsed, s.repsCompleted);
          if (e1rm > best) best = e1rm;
        }
      }
      startValue = unit === "lb" ? best * 2.20462 : best;
    } else {
      const current = bodyWeightLogs[0]?.weightKg ?? 0;
      startValue = unit === "lb" ? current * 2.20462 : current;
      label = `Body weight — ${target} ${unit}`;
    }

    addGoal({
      type,
      label,
      exerciseId: type === "strength" ? exerciseId : undefined,
      targetValue: unit === "lb" && type === "strength"
        ? target / 2.20462
        : unit === "lb" && type === "bodyweight"
        ? target / 2.20462
        : target,
      startValue: unit === "lb" ? startValue / 2.20462 : startValue,
      unit,
      deadline: deadline || undefined,
    });
    onClose();
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
      />
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 380, damping: 40 }}
        className="fixed bottom-0 inset-x-0 z-50 bg-trainer-elevated border-t border-white/10 rounded-t-[24px] max-h-[88vh] flex flex-col"
      >
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-9 h-1 rounded-full bg-white/15" />
        </div>
        <div className="flex items-center justify-between px-5 pb-3 shrink-0">
          <p className="text-base font-bold text-white">New Goal</p>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/8 flex items-center justify-center text-white/40">
            <X size={15} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-5 pb-8 flex flex-col gap-4">
          {/* Type toggle */}
          <div className="flex gap-2">
            {(["strength", "bodyweight"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setType(t)}
                className={cn(
                  "flex-1 py-2 rounded-[10px] text-sm font-semibold border transition-all",
                  type === t
                    ? "bg-trainer-indigo/15 border-trainer-indigo/40 text-trainer-indigo"
                    : "bg-white/5 border-white/10 text-white/40 hover:text-white/65"
                )}
              >
                {t === "strength" ? "Strength" : "Body Weight"}
              </button>
            ))}
          </div>

          {/* Exercise picker (for strength) */}
          {type === "strength" && (
            <div>
              <p className="text-xs text-white/40 mb-2">Exercise</p>
              <input
                type="text"
                placeholder="Search exercises…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-trainer-surface border border-white/10 rounded-[10px] px-3 py-2.5 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-trainer-indigo/40 mb-2"
                style={{ fontSize: "16px" }}
              />
              <div className="flex flex-col gap-1 max-h-36 overflow-y-auto">
                {filteredExercises.map((ex) => (
                  <button
                    key={ex.id}
                    onClick={() => { setExerciseId(ex.id); setSearch(""); }}
                    className={cn(
                      "w-full text-left px-3 py-2 rounded-[8px] text-sm transition-colors",
                      exerciseId === ex.id
                        ? "bg-trainer-indigo/15 text-trainer-indigo font-semibold"
                        : "text-white/65 hover:bg-white/6"
                    )}
                  >
                    {ex.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Target value */}
          <div>
            <p className="text-xs text-white/40 mb-1.5">
              {type === "strength" ? `Target e1RM (${unit})` : `Target weight (${unit})`}
            </p>
            <input
              type="number"
              step={unit === "lb" ? 5 : 2.5}
              min="1"
              placeholder={unit === "lb" ? "e.g. 225" : "e.g. 100"}
              value={targetRaw}
              onChange={(e) => setTargetRaw(e.target.value)}
              className="w-full bg-trainer-surface border border-white/10 rounded-[10px] px-3 py-2.5 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-trainer-indigo/40 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
              style={{ fontSize: "16px" }}
            />
          </div>

          {/* Optional deadline */}
          <div>
            <p className="text-xs text-white/40 mb-1.5">Target date (optional)</p>
            <input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              min={new Date().toISOString().split("T")[0]}
              className="w-full bg-trainer-surface border border-white/10 rounded-[10px] px-3 py-2.5 text-sm text-white/70 focus:outline-none focus:border-trainer-indigo/40"
              style={{ fontSize: "16px" }}
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={!targetRaw || parseFloat(targetRaw) <= 0 || (type === "strength" && !exerciseId)}
            className="w-full py-3 rounded-[12px] bg-trainer-indigo text-white text-sm font-bold hover:bg-trainer-indigo/80 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Add Goal
          </button>
        </div>
      </motion.div>
    </>
  );
}

// ─── Main card ─────────────────────────────────────────────────────────────────

export function GoalsCard() {
  const { goals } = useGoalStore();
  const { deleteGoal } = useGoalStore();
  const { settings } = useSettingsStore();
  const { profile } = useUserStore();
  const [showAdd, setShowAdd] = useState(false);
  const unit = (settings.weightUnit ?? profile?.units ?? "kg") as "kg" | "lb";

  const activeGoals = goals.filter((g) => !g.achieved);
  const achievedGoals = goals.filter((g) => g.achieved);

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.07 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-[8px] bg-trainer-indigo/15 flex items-center justify-center">
              <Target size={13} className="text-trainer-indigo" />
            </div>
            <p className="text-sm font-bold text-white">Goals</p>
            {activeGoals.length > 0 && (
              <span className="text-[10px] text-trainer-indigo font-bold bg-trainer-indigo/10 px-2 py-0.5 rounded-full">
                {activeGoals.length} active
              </span>
            )}
            {achievedGoals.length > 0 && (
              <span className="text-[10px] text-trainer-success font-bold bg-trainer-success/12 px-2 py-0.5 rounded-full">
                {achievedGoals.length} achieved
              </span>
            )}
          </div>
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-1 text-xs font-semibold text-trainer-indigo hover:text-white transition-colors"
          >
            <Plus size={13} />
            Add goal
          </button>
        </div>

        {activeGoals.length === 0 ? (
          <button
            onClick={() => setShowAdd(true)}
            className="w-full flex items-center justify-center gap-2 p-4 rounded-[14px] bg-trainer-surface border border-dashed border-white/15 text-white/30 text-sm hover:border-trainer-indigo/40 hover:text-white/50 transition-colors"
          >
            <Plus size={14} />
            Set your first performance goal
          </button>
        ) : (
          <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1 -mx-5 px-5">
            {activeGoals.map((goal) => (
              <GoalPill
                key={goal.id}
                goal={goal}
                onDelete={() => deleteGoal(goal.id)}
              />
            ))}
            <button
              onClick={() => setShowAdd(true)}
              className="shrink-0 w-[72px] rounded-[16px] border border-dashed border-white/12 flex flex-col items-center justify-center gap-1 text-white/20 hover:border-trainer-indigo/35 hover:text-trainer-indigo/50 transition-colors"
            >
              <Plus size={18} />
              <span className="text-[9px] font-semibold">Add</span>
            </button>
          </div>
        )}
      </motion.div>

      <AnimatePresence>
        {showAdd && (
          <AddGoalSheet onClose={() => setShowAdd(false)} unit={unit} />
        )}
      </AnimatePresence>
    </>
  );
}
