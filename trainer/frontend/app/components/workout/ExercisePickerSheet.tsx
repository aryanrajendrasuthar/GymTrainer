"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Search, Check, Dumbbell, ChevronRight, BookMarked, Trash2, Save, Plus, Star } from "lucide-react";
import { allExercises, searchExercises, exerciseMap } from "@/app/data/exercises";
import { type Exercise } from "@/app/types";
import { useWorkoutTemplateStore } from "@/app/store/workoutTemplateStore";
import { useCustomExerciseStore, type CustomExercise } from "@/app/store/customExerciseStore";
import { AddCustomExerciseSheet } from "@/app/components/workout/AddCustomExerciseSheet";
import { cn } from "@/app/lib/utils";

function isCustomExercise(ex: Exercise): ex is CustomExercise {
  return ex.id.startsWith("custom-");
}

const CATEGORIES = [
  { id: "all",        label: "All"       },
  { id: "custom",     label: "My Exercises" },
  { id: "chest",      label: "Chest"     },
  { id: "back",       label: "Back"      },
  { id: "shoulders",  label: "Shoulders" },
  { id: "arms",       label: "Arms"      },
  { id: "legs",       label: "Legs"      },
  { id: "core",       label: "Core"      },
  { id: "full-body",  label: "Full Body" },
  { id: "cardio",     label: "Cardio"    },
] as const;

type CategoryId = (typeof CATEGORIES)[number]["id"];
type View = "picker" | "templates";

interface ExercisePickerSheetProps {
  open: boolean;
  onClose: () => void;
  onStart: (exerciseIds: string[], dayName: string) => void;
  recentIds?: string[];
}

export function ExercisePickerSheet({
  open,
  onClose,
  onStart,
  recentIds = [],
}: ExercisePickerSheetProps) {
  const [view, setView] = useState<View>("picker");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<CategoryId>("all");
  const [selected, setSelected] = useState<string[]>([]);
  const [dayName, setDayName] = useState("Quick Workout");
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [showAddCustom, setShowAddCustom] = useState(false);

  const { templates, saveTemplate, deleteTemplate, touchTemplate } = useWorkoutTemplateStore();
  const { customExercises, removeCustomExercise } = useCustomExerciseStore();

  // Merged map for template name lookup
  const mergedExerciseMap = useMemo(() => ({
    ...exerciseMap,
    ...Object.fromEntries(customExercises.map((e) => [e.id, e])),
  }), [customExercises]);

  const filteredExercises = useMemo(() => {
    // "My Exercises" tab shows only custom
    if (category === "custom") {
      if (query.trim().length > 0) {
        const q = query.toLowerCase();
        return customExercises.filter((e) => e.name.toLowerCase().includes(q));
      }
      return customExercises;
    }

    // Regular categories
    let list: Exercise[];
    if (query.trim().length > 1) {
      // Search built-in + custom
      const builtIn = searchExercises(query);
      const q = query.toLowerCase();
      const custom = customExercises.filter((e) => e.name.toLowerCase().includes(q));
      list = [...custom, ...builtIn];
    } else {
      const builtIn = category === "all"
        ? allExercises
        : allExercises.filter((e) => e.category === (category as Exercise["category"]));
      list = category === "all" ? [...customExercises, ...builtIn] : builtIn;
    }

    list = list.filter((e) => e.movementType !== "stretch" && e.movementType !== "warmup");

    const recentSet = new Set(recentIds);
    return [
      ...list.filter((e) => recentSet.has(e.id)),
      ...list.filter((e) => !recentSet.has(e.id)),
    ];
  }, [query, category, recentIds, customExercises]);

  function toggleExercise(id: string) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  function handleStart() {
    if (selected.length === 0) return;
    onStart(selected, dayName.trim() || "Quick Workout");
    reset();
  }

  function handleSaveTemplate() {
    if (selected.length === 0) return;
    saveTemplate(dayName.trim() || "Quick Workout", selected);
    setSavingTemplate(true);
    setTimeout(() => setSavingTemplate(false), 1500);
  }

  function handleLoadTemplate(tpl: { id: string; name: string; exerciseIds: string[] }) {
    touchTemplate(tpl.id);
    setSelected(tpl.exerciseIds);
    setDayName(tpl.name);
    setView("picker");
  }

  function reset() {
    setSelected([]);
    setQuery("");
    setCategory("all");
    setDayName("Quick Workout");
    setView("picker");
  }

  function handleClose() {
    reset();
    onClose();
  }

  return (
    <>
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleClose}
              className="fixed inset-0 bg-black/65 z-40"
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 360, damping: 38 }}
              className="fixed inset-x-0 bottom-0 z-50 bg-trainer-elevated border-t border-white/10 rounded-t-[24px] flex flex-col"
              style={{ maxHeight: "92vh" }}
            >
              {/* Handle */}
              <div className="flex justify-center pt-3 pb-1 shrink-0">
                <div className="w-9 h-1 rounded-full bg-white/15" />
              </div>

              {/* Header */}
              <div className="px-4 pb-3 shrink-0">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <p className="text-base font-bold text-white">Quick Workout</p>
                    {templates.length > 0 && (
                      <button
                        onClick={() => setView(view === "templates" ? "picker" : "templates")}
                        className={cn(
                          "flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold transition-all",
                          view === "templates"
                            ? "bg-trainer-indigo text-white"
                            : "bg-white/8 text-white/40 hover:text-white"
                        )}
                      >
                        <BookMarked size={10} />
                        Templates
                      </button>
                    )}
                    {selected.length > 0 && (
                      <span className="text-[10px] font-bold text-trainer-indigo/70 bg-trainer-indigo/8 border border-trainer-indigo/15 px-1.5 py-0.5 rounded-full tabular-nums">
                        {selected.length} ✓
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Add custom exercise */}
                    <button
                      onClick={() => setShowAddCustom(true)}
                      className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-trainer-gold/10 border border-trainer-gold/25 text-trainer-gold hover:bg-trainer-gold/18 transition-all"
                    >
                      <Plus size={10} />
                      Custom
                    </button>
                    <button
                      onClick={handleClose}
                      className="w-7 h-7 rounded-full bg-white/8 flex items-center justify-center text-white/40 hover:text-white transition-colors"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>

                {view === "picker" && (
                  <>
                    {/* Workout name */}
                    <input
                      type="text"
                      value={dayName}
                      onChange={(e) => setDayName(e.target.value)}
                      placeholder="Workout name"
                      className="w-full bg-trainer-surface border border-white/10 rounded-[10px] px-3 py-2 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-trainer-indigo/40 mb-3"
                      style={{ fontSize: "16px" }}
                    />

                    {/* Search */}
                    <div className="relative mb-3">
                      <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
                      <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search exercises…"
                        className="w-full bg-trainer-surface border border-white/10 rounded-[10px] pl-8 pr-3 py-2 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-trainer-indigo/40"
                        style={{ fontSize: "16px" }}
                      />
                    </div>

                    {/* Category chips */}
                    {!query && (
                      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                        {CATEGORIES.map((cat) => (
                          <button
                            key={cat.id}
                            onClick={() => setCategory(cat.id)}
                            className={cn(
                              "shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all",
                              category === cat.id
                                ? cat.id === "custom"
                                  ? "bg-trainer-gold text-black"
                                  : "bg-trainer-indigo text-white"
                                : "bg-white/8 text-white/45 hover:text-white"
                            )}
                          >
                            {cat.id === "custom" && <Star size={9} className="inline mr-1" />}
                            {cat.label}
                            {cat.id === "custom" && customExercises.length > 0 && (
                              <span className="ml-1 text-[10px] opacity-70">({customExercises.length})</span>
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Templates view */}
              {view === "templates" ? (
                <div className="flex-1 overflow-y-auto px-4 pb-2">
                  {templates.length === 0 ? (
                    <p className="text-sm text-white/30 text-center py-8">No templates saved yet</p>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {templates.map((tpl) => (
                        <div
                          key={tpl.id}
                          className="flex items-center gap-3 p-3 rounded-[12px] bg-trainer-surface border border-white/7"
                        >
                          <button
                            onClick={() => handleLoadTemplate(tpl)}
                            className="flex-1 text-left min-w-0"
                          >
                            <p className="text-sm font-semibold text-white/85 truncate">{tpl.name}</p>
                            <p className="text-xs text-white/30 mt-0.5 truncate">
                              {tpl.exerciseIds
                                .slice(0, 3)
                                .map((id) => mergedExerciseMap[id]?.name ?? id)
                                .join(", ")}
                              {tpl.exerciseIds.length > 3 && ` +${tpl.exerciseIds.length - 3} more`}
                            </p>
                          </button>
                          <span className="text-[10px] text-white/25 shrink-0">
                            {tpl.exerciseIds.length} ex
                          </span>
                          <button
                            onClick={() => deleteTemplate(tpl.id)}
                            className="w-7 h-7 rounded-full bg-white/5 flex items-center justify-center text-white/25 hover:text-red-400 transition-colors shrink-0"
                          >
                            <Trash2 size={11} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                /* Exercise picker list */
                <div className="flex-1 overflow-y-auto px-4 pb-2">
                  {/* "My Exercises" empty state */}
                  {category === "custom" && customExercises.length === 0 ? (
                    <div className="flex flex-col items-center gap-3 py-10">
                      <div className="w-12 h-12 rounded-full bg-trainer-gold/10 flex items-center justify-center">
                        <Star size={20} className="text-trainer-gold/50" />
                      </div>
                      <p className="text-sm text-white/35 text-center">
                        No custom exercises yet.
                      </p>
                      <button
                        onClick={() => setShowAddCustom(true)}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-trainer-gold/10 border border-trainer-gold/25 text-trainer-gold text-xs font-semibold"
                      >
                        <Plus size={12} /> Create your first exercise
                      </button>
                    </div>
                  ) : filteredExercises.length === 0 ? (
                    <p className="text-sm text-white/30 text-center py-8">No exercises found</p>
                  ) : (
                    <div className="flex flex-col gap-1.5">
                      {query.trim().length > 0 && (
                        <p className="text-[10px] text-white/25 mb-2 pt-1 tabular-nums">
                          {filteredExercises.length} result{filteredExercises.length !== 1 ? "s" : ""}
                        </p>
                      )}
                      {query.length === 0 && recentIds.length > 0 && category === "all" && (
                        <p className="text-[10px] text-white/25 font-semibold uppercase tracking-widest mb-1 pt-1">
                          Recently used
                        </p>
                      )}
                      {category === "all" && !query && customExercises.length > 0 && (
                        <p className="text-[10px] text-trainer-gold/50 font-semibold uppercase tracking-widest mb-1 pt-1">
                          My Exercises
                        </p>
                      )}
                      {filteredExercises.map((ex) => {
                        const isSelected = selected.includes(ex.id);
                        const isCustom = isCustomExercise(ex);
                        return (
                          <div key={ex.id} className="flex items-center gap-1">
                            <motion.button
                              whileTap={{ scale: 0.98 }}
                              onClick={() => toggleExercise(ex.id)}
                              className={cn(
                                "flex-1 flex items-center gap-3 p-3 rounded-[12px] border text-left transition-all",
                                isSelected
                                  ? "bg-trainer-indigo/12 border-trainer-indigo/35"
                                  : "bg-trainer-surface border-white/7 hover:border-white/15"
                              )}
                            >
                              <div className={cn(
                                "w-8 h-8 rounded-[8px] flex items-center justify-center shrink-0 transition-colors",
                                isSelected
                                  ? "bg-trainer-indigo/25"
                                  : isCustom
                                  ? "bg-trainer-gold/12"
                                  : "bg-white/6"
                              )}>
                                {isSelected
                                  ? <Check size={14} className="text-trainer-indigo" />
                                  : isCustom
                                  ? <Star size={13} className="text-trainer-gold/60" />
                                  : <Dumbbell size={13} className="text-white/35" />
                                }
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5 min-w-0">
                                  <p className={cn(
                                    "text-sm font-semibold truncate transition-colors",
                                    isSelected ? "text-white" : "text-white/75"
                                  )}>
                                    {ex.name}
                                  </p>
                                  {isCustom && (
                                    <span className="shrink-0 text-[9px] font-bold text-trainer-gold bg-trainer-gold/10 px-1.5 py-0.5 rounded-full">
                                      CUSTOM
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-white/30 truncate capitalize">
                                  {ex.primaryMuscles.slice(0, 2).join(" · ").replace(/-/g, " ")}
                                </p>
                              </div>
                              <span className="text-[10px] text-white/25 capitalize shrink-0">
                                {ex.movementType}
                              </span>
                            </motion.button>
                            {/* Delete custom exercise */}
                            {isCustom && (
                              <button
                                onClick={() => removeCustomExercise(ex.id)}
                                className="w-7 h-7 rounded-full bg-white/5 flex items-center justify-center text-white/20 hover:text-red-400 transition-colors shrink-0"
                              >
                                <Trash2 size={11} />
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Footer */}
              <div className="px-4 pt-3 pb-6 border-t border-white/8 shrink-0 flex flex-col gap-2">
                {view === "picker" && selected.length > 0 && (
                  <motion.button
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={handleSaveTemplate}
                    className="w-full py-2.5 rounded-[12px] text-xs font-semibold flex items-center justify-center gap-2 bg-white/5 border border-white/10 text-white/50 hover:text-white/70 transition-all"
                  >
                    <Save size={12} />
                    {savingTemplate ? "Saved!" : "Save as template"}
                  </motion.button>
                )}

                {view === "picker" && (
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={handleStart}
                    disabled={selected.length === 0}
                    className={cn(
                      "w-full py-3.5 rounded-[14px] text-sm font-bold flex items-center justify-center gap-2 transition-all",
                      selected.length > 0
                        ? "bg-trainer-indigo text-white shadow-lg shadow-trainer-indigo/30"
                        : "bg-white/6 text-white/25 cursor-not-allowed"
                    )}
                  >
                    <Dumbbell size={16} />
                    {selected.length > 0
                      ? `Start Workout · ${selected.length} exercise${selected.length !== 1 ? "s" : ""}`
                      : "Select exercises to begin"
                    }
                    {selected.length > 0 && <ChevronRight size={15} />}
                  </motion.button>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Add Custom Exercise Sheet — rendered outside the picker z-stack */}
      <AddCustomExerciseSheet
        open={showAddCustom}
        onClose={() => setShowAddCustom(false)}
        onCreated={(id) => {
          setShowAddCustom(false);
          setCategory("custom");
          toggleExercise(id);
        }}
      />
    </>
  );
}
