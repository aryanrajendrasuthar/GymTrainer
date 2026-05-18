"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, Plus, Trash2, ChevronDown, ChevronUp,
  Save, Search, Check, Moon,
} from "lucide-react";
import { allExercises } from "@/app/data/exercises";
import { useCustomSplitStore, makeCustomSplitId, buildEmptyDay } from "@/app/store/customSplitStore";
import { cn } from "@/app/lib/utils";
import type { SplitDay, Exercise } from "@/app/types";

const MUSCLE_GROUPS = [
  "chest", "back", "shoulders", "biceps", "triceps",
  "quads", "hamstrings", "glutes", "calves", "core", "full-body",
];

const CATEGORY_ORDER = ["chest", "back", "shoulders", "arms", "legs", "glutes", "core", "full-body"];

// ─── Exercise picker sheet ────────────────────────────────────────────────────

function ExercisePicker({
  selectedIds,
  onConfirm,
  onClose,
}: {
  selectedIds: string[];
  onConfirm: (ids: string[]) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set(selectedIds));
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let list = allExercises.filter((e) => e.movementType !== "warmup" && e.movementType !== "stretch");
    if (categoryFilter) list = list.filter((e) => e.category === categoryFilter || e.primaryMuscles.some((m) => m.includes(categoryFilter)));
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter((e) => e.name.toLowerCase().includes(q) || e.primaryMuscles.some((m) => m.includes(q)));
    }
    return list.slice(0, 60);
  }, [query, categoryFilter]);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  return (
    <motion.div
      initial={{ y: "100%" }}
      animate={{ y: 0 }}
      exit={{ y: "100%" }}
      transition={{ type: "spring", stiffness: 340, damping: 36 }}
      className="fixed inset-0 z-[60] bg-trainer-black flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-12 pb-3 border-b border-white/8">
        <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/8 flex items-center justify-center">
          <X size={15} className="text-white/60" />
        </button>
        <div className="flex-1 relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search exercises…"
            className="w-full bg-trainer-elevated border border-white/10 rounded-[10px] pl-9 pr-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-trainer-indigo/40"
          />
        </div>
        <button
          onClick={() => onConfirm(Array.from(selected))}
          className="px-3 py-1.5 bg-trainer-indigo text-white text-sm font-bold rounded-[8px]"
        >
          Done ({selected.size})
        </button>
      </div>

      {/* Category chips */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar px-4 py-2 border-b border-white/6">
        <button
          onClick={() => setCategoryFilter(null)}
          className={cn("text-[11px] font-semibold px-3 py-1 rounded-full shrink-0 transition-colors",
            !categoryFilter ? "bg-trainer-indigo text-white" : "bg-white/8 text-white/50"
          )}
        >
          All
        </button>
        {CATEGORY_ORDER.map((c) => (
          <button
            key={c}
            onClick={() => setCategoryFilter(categoryFilter === c ? null : c)}
            className={cn("text-[11px] font-semibold px-3 py-1 rounded-full shrink-0 capitalize transition-colors",
              categoryFilter === c ? "bg-trainer-indigo text-white" : "bg-white/8 text-white/50"
            )}
          >
            {c}
          </button>
        ))}
      </div>

      {/* Exercise list */}
      <div className="flex-1 overflow-y-auto px-4 py-2">
        {filtered.map((ex) => {
          const isSelected = selected.has(ex.id);
          return (
            <button
              key={ex.id}
              onClick={() => toggle(ex.id)}
              className={cn(
                "flex items-center gap-3 w-full py-3 border-b border-white/5 text-left",
                isSelected && "opacity-100"
              )}
            >
              <div className={cn(
                "w-6 h-6 rounded-[6px] border-2 flex items-center justify-center shrink-0 transition-colors",
                isSelected ? "border-trainer-indigo bg-trainer-indigo" : "border-white/20"
              )}>
                {isSelected && <Check size={12} className="text-white" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white/80 truncate">{ex.name}</p>
                <p className="text-[10px] text-white/30 mt-0.5 capitalize">
                  {ex.primaryMuscles.slice(0, 2).join(", ").replace(/-/g, " ")}
                </p>
              </div>
              <span className={cn(
                "text-[9px] font-semibold px-1.5 py-0.5 rounded-full capitalize shrink-0",
                ex.movementType === "compound" ? "text-trainer-indigo bg-trainer-indigo/10" : "text-white/30 bg-white/5"
              )}>
                {ex.movementType}
              </span>
            </button>
          );
        })}
      </div>
    </motion.div>
  );
}

// ─── Day editor row ────────────────────────────────────────────────────────────

function DayRow({
  day,
  index,
  onUpdate,
  onRemove,
}: {
  day: SplitDay;
  index: number;
  onUpdate: (patch: Partial<SplitDay>) => void;
  onRemove: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [showPicker, setShowPicker] = useState(false);

  const exerciseNames = useMemo(() => {
    const { exerciseMap } = require("@/app/data/exercises");
    return (day.exercises ?? []).map((id: string) => exerciseMap[id]?.name ?? id);
  }, [day.exercises]);

  return (
    <>
      <div className={cn(
        "rounded-[14px] border overflow-hidden transition-colors",
        day.isRestDay ? "border-white/6 bg-trainer-surface/50" : "border-white/10 bg-trainer-surface"
      )}>
        {/* Day header */}
        <div className="flex items-center gap-3 px-4 py-3">
          <div className="w-6 h-6 rounded-full bg-trainer-indigo/20 flex items-center justify-center shrink-0">
            <span className="text-[10px] font-bold text-trainer-indigo">{index + 1}</span>
          </div>
          <input
            value={day.dayName}
            onChange={(e) => onUpdate({ dayName: e.target.value })}
            className="flex-1 bg-transparent text-sm font-semibold text-white placeholder:text-white/30 focus:outline-none min-w-0"
            placeholder="Day name (e.g. Push A)"
          />
          <button
            onClick={() => onUpdate({ isRestDay: !day.isRestDay })}
            className={cn(
              "flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full transition-colors shrink-0",
              day.isRestDay ? "bg-white/10 text-white/50" : "bg-trainer-surface text-white/35 hover:bg-white/8"
            )}
          >
            <Moon size={10} />
            Rest
          </button>
          {!day.isRestDay && (
            <button onClick={() => setExpanded(!expanded)} className="text-white/30 hover:text-white/60">
              {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
          )}
          <button onClick={onRemove} className="text-white/20 hover:text-trainer-danger transition-colors">
            <Trash2 size={14} />
          </button>
        </div>

        {/* Expanded section */}
        <AnimatePresence>
          {expanded && !day.isRestDay && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden border-t border-white/6"
            >
              <div className="px-4 py-3 space-y-3">
                {/* Muscle groups */}
                <div>
                  <p className="text-[10px] text-white/35 font-semibold uppercase tracking-wider mb-2">Muscle groups</p>
                  <div className="flex flex-wrap gap-1.5">
                    {MUSCLE_GROUPS.map((m) => {
                      const active = day.muscleGroups.includes(m);
                      return (
                        <button
                          key={m}
                          onClick={() => {
                            const groups = active
                              ? day.muscleGroups.filter((g) => g !== m)
                              : [...day.muscleGroups, m];
                            onUpdate({ muscleGroups: groups });
                          }}
                          className={cn(
                            "text-[10px] font-semibold px-2.5 py-1 rounded-full capitalize transition-colors",
                            active ? "bg-trainer-indigo text-white" : "bg-white/8 text-white/40 hover:bg-white/12"
                          )}
                        >
                          {m}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Exercises */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[10px] text-white/35 font-semibold uppercase tracking-wider">
                      Exercises ({(day.exercises ?? []).length})
                    </p>
                    <button
                      onClick={() => setShowPicker(true)}
                      className="flex items-center gap-1 text-xs text-trainer-indigo font-semibold"
                    >
                      <Plus size={12} /> Add
                    </button>
                  </div>
                  {exerciseNames.length > 0 ? (
                    <div className="flex flex-col gap-1">
                      {exerciseNames.map((name: string, i: number) => (
                        <div key={i} className="flex items-center gap-2 text-xs text-white/55">
                          <div className="w-1 h-1 rounded-full bg-trainer-indigo/50 shrink-0" />
                          {name}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-white/25">No exercises yet — tap Add</p>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Exercise picker full-screen */}
      <AnimatePresence>
        {showPicker && (
          <ExercisePicker
            selectedIds={day.exercises ?? []}
            onConfirm={(ids) => { onUpdate({ exercises: ids }); setShowPicker(false); }}
            onClose={() => setShowPicker(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}

// ─── Builder sheet ────────────────────────────────────────────────────────────

interface CustomRoutineBuilderProps {
  open: boolean;
  onClose: () => void;
  onSaved: (splitId: string) => void;
}

export function CustomRoutineBuilder({ open, onClose, onSaved }: CustomRoutineBuilderProps) {
  const { addCustomSplit } = useCustomSplitStore();

  const [name, setName] = useState("");
  const [days, setDays] = useState<SplitDay[]>([
    buildEmptyDay("Day 1"),
    buildEmptyDay("Day 2"),
    buildEmptyDay("Day 3"),
  ]);

  function addDay() {
    setDays((d) => [...d, buildEmptyDay(`Day ${d.length + 1}`)]);
  }

  function updateDay(index: number, patch: Partial<SplitDay>) {
    setDays((prev) => prev.map((d, i) => (i === index ? { ...d, ...patch } : d)));
  }

  function removeDay(index: number) {
    setDays((prev) => prev.filter((_, i) => i !== index));
  }

  function handleSave() {
    if (!name.trim() || days.length === 0) return;
    const id = makeCustomSplitId();
    const workoutDays = days.filter((d) => !d.isRestDay);
    const split = {
      id,
      name: name.trim(),
      description: `Custom routine with ${workoutDays.length} training days`,
      daysPerWeek: workoutDays.length,
      days,
      targetGoals: ["general-fitness", "muscle-gain"] as ["general-fitness", "muscle-gain"],
      difficulty: "intermediate" as const,
    };
    addCustomSplit(split);
    onSaved(id);
    onClose();
  }

  const canSave = name.trim().length > 0 && days.length > 0;

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-40"
            onClick={onClose}
          />
          <motion.div
            key="sheet"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 34 }}
            className="fixed bottom-0 inset-x-0 z-50 bg-trainer-elevated border-t border-white/10 rounded-t-[28px] max-h-[92vh] flex flex-col"
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1 shrink-0">
              <div className="w-9 h-1 rounded-full bg-white/15" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-2 pb-4 border-b border-white/8 shrink-0">
              <div>
                <h2 className="text-base font-bold text-white">Custom Routine</h2>
                <p className="text-xs text-white/35 mt-0.5">Build your own training split</p>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-white/8 flex items-center justify-center"
              >
                <X size={15} className="text-white/50" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
              {/* Routine name */}
              <div>
                <p className="text-xs text-white/40 font-semibold uppercase tracking-wider mb-2">Routine name</p>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. My PPL, Bro Split, Upper-Lower"
                  className="w-full bg-trainer-surface border border-white/10 rounded-[12px] px-4 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-trainer-indigo/50"
                />
              </div>

              {/* Days */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs text-white/40 font-semibold uppercase tracking-wider">
                    Days ({days.length})
                  </p>
                  {days.length < 7 && (
                    <button
                      onClick={addDay}
                      className="flex items-center gap-1 text-xs text-trainer-indigo font-semibold"
                    >
                      <Plus size={12} /> Add Day
                    </button>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  {days.map((day, i) => (
                    <DayRow
                      key={i}
                      day={day}
                      index={i}
                      onUpdate={(patch) => updateDay(i, patch)}
                      onRemove={() => removeDay(i)}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Save */}
            <div className="px-5 pb-10 pt-4 border-t border-white/6 shrink-0">
              <button
                onClick={handleSave}
                disabled={!canSave}
                className={cn(
                  "w-full py-3.5 rounded-[14px] text-sm font-bold flex items-center justify-center gap-2 transition-all",
                  canSave
                    ? "bg-trainer-indigo text-white hover:bg-trainer-indigo-hover"
                    : "bg-white/8 text-white/25 cursor-not-allowed"
                )}
              >
                <Save size={16} /> Save Routine
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
