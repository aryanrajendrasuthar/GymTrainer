"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Search, Dumbbell, Heart, Clock, ChevronDown, ChevronUp } from "lucide-react";
import { allExercises } from "@/app/data/exercises";
import { allPhysioExercises } from "@/app/data/physioExercises";
import { usePendingSessionStore, type PendingSlot } from "@/app/store/pendingSessionStore";
import { usePhysioStore } from "@/app/store/physioStore";
import { type Exercise, type PhysioExercise } from "@/app/types";
import { cn } from "@/app/lib/utils";

// ─── Types ──────────────────────────────────────────────────────────────────

type Assignment = "now" | "later";

interface AddedExercise {
  id: string;
  type: "workout" | "physio";
  assignment: Assignment;
}

interface SplitSessionSheetProps {
  open: boolean;
  dayName: string;
  exercises: Exercise[];
  onClose: () => void;
  /** Called with IDs of exercises to do NOW (workout type only) */
  onConfirm: (nowExerciseIds: string[]) => void;
}

// ─── Slot config ─────────────────────────────────────────────────────────────

const SLOTS: { value: PendingSlot; label: string; sub: string }[] = [
  { value: "morning", label: "Morning", sub: "Before noon" },
  { value: "afternoon", label: "Afternoon", sub: "12 – 5 pm" },
  { value: "evening", label: "Evening", sub: "After 5 pm" },
  { value: "anytime", label: "Later today", sub: "No set time" },
];

// ─── Small components ────────────────────────────────────────────────────────

function AssignToggle({
  value,
  onChange,
}: {
  value: Assignment;
  onChange: (v: Assignment) => void;
}) {
  return (
    <div className="flex rounded-[8px] bg-white/8 p-0.5 gap-0.5 shrink-0">
      {(["now", "later"] as Assignment[]).map((opt) => (
        <button
          key={opt}
          onClick={() => onChange(opt)}
          className={cn(
            "px-2.5 py-1 rounded-[6px] text-[11px] font-bold transition-all",
            value === opt
              ? opt === "now"
                ? "bg-trainer-indigo text-white"
                : "bg-trainer-warning/80 text-trainer-black"
              : "text-white/40 hover:text-white/60"
          )}
        >
          {opt === "now" ? "Now" : "Later"}
        </button>
      ))}
    </div>
  );
}

function ExerciseRow({
  name,
  sub,
  isPhysio,
  assignment,
  onAssign,
  onRemove,
}: {
  name: string;
  sub: string;
  isPhysio?: boolean;
  assignment: Assignment;
  onAssign: (v: Assignment) => void;
  onRemove?: () => void;
}) {
  return (
    <div className="flex items-center gap-3 px-3 py-2.5 rounded-[12px] bg-trainer-elevated border border-white/8">
      <div className="w-8 h-8 rounded-[8px] bg-trainer-indigo/12 flex items-center justify-center shrink-0">
        {isPhysio ? (
          <Heart size={14} className="text-trainer-success/70" />
        ) : (
          <Dumbbell size={14} className="text-trainer-indigo" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-white/85 truncate">{name}</p>
        <p className="text-[11px] text-white/35 truncate">{sub}</p>
      </div>
      <AssignToggle value={assignment} onChange={onAssign} />
      {onRemove && (
        <button
          onClick={onRemove}
          className="w-6 h-6 flex items-center justify-center text-white/25 hover:text-white/60 transition-colors shrink-0"
        >
          <X size={12} />
        </button>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function SplitSessionSheet({
  open,
  dayName,
  exercises,
  onClose,
  onConfirm,
}: SplitSessionSheetProps) {
  const { addSession } = usePendingSessionStore();
  const { activeInjuries } = usePhysioStore();

  // Each scheduled exercise starts as "now"
  const [assignments, setAssignments] = useState<Record<string, Assignment>>(
    () => Object.fromEntries(exercises.map((ex) => [ex.id, "now" as Assignment]))
  );
  const [added, setAdded] = useState<AddedExercise[]>([]);
  const [slot, setSlot] = useState<PendingSlot>("evening");

  const [showSearch, setShowSearch] = useState(false);
  const [searchTab, setSearchTab] = useState<"workout" | "physio">("workout");
  const [query, setQuery] = useState("");

  const laterCount =
    Object.values(assignments).filter((a) => a === "later").length +
    added.filter((a) => a.assignment === "later").length;

  const hasLater = laterCount > 0;

  // ─── Search results ────────────────────────────────────────────────────────

  const scheduledIds = new Set(exercises.map((e) => e.id));
  const addedIds = new Set(added.map((a) => a.id));

  const workoutResults = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return allExercises
      .filter(
        (ex) =>
          !scheduledIds.has(ex.id) &&
          !addedIds.has(ex.id) &&
          (ex.name.toLowerCase().includes(q) ||
            ex.primaryMuscles.some((m) => m.toLowerCase().includes(q)))
      )
      .slice(0, 6);
  }, [query, addedIds, scheduledIds]);

  const physioResults = useMemo(() => {
    if (!query.trim()) {
      // Default: show exercises for active injuries
      const conditions = new Set(activeInjuries.map((i) => i.condition));
      return allPhysioExercises
        .filter((ex) => conditions.has(ex.condition) && !addedIds.has(ex.id))
        .slice(0, 8);
    }
    const q = query.toLowerCase();
    return allPhysioExercises
      .filter(
        (ex) =>
          !addedIds.has(ex.id) &&
          (ex.name.toLowerCase().includes(q) ||
            ex.condition.toLowerCase().replace(/-/g, " ").includes(q))
      )
      .slice(0, 6);
  }, [query, addedIds, activeInjuries]);

  // ─── Handlers ─────────────────────────────────────────────────────────────

  function setAssignment(id: string, value: Assignment) {
    setAssignments((prev) => ({ ...prev, [id]: value }));
  }

  function setAddedAssignment(id: string, value: Assignment) {
    setAdded((prev) =>
      prev.map((a) => (a.id === id ? { ...a, assignment: value } : a))
    );
  }

  function addWorkoutExercise(ex: Exercise) {
    setAdded((prev) => [
      ...prev,
      { id: ex.id, type: "workout", assignment: "now" },
    ]);
    setQuery("");
  }

  function addPhysioExercise(ex: PhysioExercise) {
    setAdded((prev) => [
      ...prev,
      { id: ex.id, type: "physio", assignment: "now" },
    ]);
    setQuery("");
  }

  function removeAdded(id: string) {
    setAdded((prev) => prev.filter((a) => a.id !== id));
  }

  function handleConfirm() {
    const nowWorkoutIds = [
      ...exercises.filter((ex) => assignments[ex.id] === "now").map((ex) => ex.id),
      ...added.filter((a) => a.assignment === "now" && a.type === "workout").map((a) => a.id),
    ];

    const laterExercises = [
      ...exercises
        .filter((ex) => assignments[ex.id] === "later")
        .map((ex) => ({ id: ex.id, type: "workout" as const })),
      ...added
        .filter((a) => a.assignment === "later")
        .map((a) => ({ id: a.id, type: a.type })),
    ];

    if (laterExercises.length > 0) {
      const today = new Date().toISOString().split("T")[0];
      addSession({
        dayName,
        exercises: laterExercises,
        slot,
        date: today,
      });
    }

    onConfirm(nowWorkoutIds);
    onClose();
  }

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-end"
          onClick={(e) => e.target === e.currentTarget && onClose()}
        >
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 380, damping: 36 }}
            className="w-full bg-trainer-surface border-t border-white/10 rounded-t-[24px] max-h-[92vh] flex flex-col"
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1 shrink-0">
              <div className="w-10 h-1 rounded-full bg-white/15" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 pb-4 shrink-0">
              <div>
                <h2 className="text-base font-bold text-white">Split Session</h2>
                <p className="text-xs text-white/40 mt-0.5">
                  Choose what to do now vs. schedule for later
                </p>
                {(() => {
                  const nowCount = Object.values(assignments).filter((a) => a === "now").length
                    + added.filter((a) => a.assignment === "now").length;
                  return (
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <span className="text-[10px] font-bold text-trainer-indigo/70 bg-trainer-indigo/8 border border-trainer-indigo/15 px-1.5 py-0.5 rounded-full tabular-nums">
                        {nowCount} now
                      </span>
                      {laterCount > 0 && (
                        <span className="text-[10px] font-bold text-trainer-warning/70 bg-trainer-warning/8 border border-trainer-warning/15 px-1.5 py-0.5 rounded-full tabular-nums">
                          {laterCount} later
                        </span>
                      )}
                    </div>
                  );
                })()}
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-white/8 flex items-center justify-center text-white/50 hover:text-white transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto px-5 pb-6 space-y-5 no-scrollbar">

              {/* Scheduled exercises */}
              <div className="space-y-2">
                <p className="text-[11px] font-semibold text-white/35 uppercase tracking-widest">
                  Today&apos;s Schedule · {exercises.length} exercises
                </p>
                {exercises.map((ex) => (
                  <ExerciseRow
                    key={ex.id}
                    name={ex.name}
                    sub={ex.primaryMuscles.slice(0, 2).join(", ").replace(/-/g, " ")}
                    assignment={assignments[ex.id] ?? "now"}
                    onAssign={(v) => setAssignment(ex.id, v)}
                  />
                ))}
              </div>

              {/* Added extras */}
              {added.length > 0 && (
                <div className="space-y-2">
                  <p className="text-[11px] font-semibold text-white/35 uppercase tracking-widest">
                    Added · {added.length}
                  </p>
                  {added.map((a) => {
                    const isPhysio = a.type === "physio";
                    const label = isPhysio
                      ? allPhysioExercises.find((e) => e.id === a.id)?.name ?? a.id
                      : allExercises.find((e) => e.id === a.id)?.name ?? a.id;
                    const sub = isPhysio
                      ? (allPhysioExercises.find((e) => e.id === a.id)?.condition ?? "").replace(/-/g, " ")
                      : (allExercises.find((e) => e.id === a.id)?.primaryMuscles.slice(0, 2).join(", ").replace(/-/g, " ") ?? "");
                    return (
                      <ExerciseRow
                        key={a.id}
                        name={label}
                        sub={sub}
                        isPhysio={isPhysio}
                        assignment={a.assignment}
                        onAssign={(v) => setAddedAssignment(a.id, v)}
                        onRemove={() => removeAdded(a.id)}
                      />
                    );
                  })}
                </div>
              )}

              {/* Add more exercises */}
              <div className="border border-white/8 rounded-[16px] overflow-hidden">
                <button
                  onClick={() => setShowSearch((v) => !v)}
                  className="w-full flex items-center justify-between px-4 py-3.5 text-left"
                >
                  <div className="flex items-center gap-2.5 text-white/60">
                    <Plus size={16} className="text-trainer-indigo" />
                    <span className="text-sm font-semibold">Add more exercises</span>
                  </div>
                  {showSearch ? (
                    <ChevronUp size={15} className="text-white/30" />
                  ) : (
                    <ChevronDown size={15} className="text-white/30" />
                  )}
                </button>

                <AnimatePresence>
                  {showSearch && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden border-t border-white/8"
                    >
                      <div className="p-4 space-y-3">
                        {/* Tab row */}
                        <div className="flex gap-2">
                          {(["workout", "physio"] as const).map((tab) => (
                            <button
                              key={tab}
                              onClick={() => setSearchTab(tab)}
                              className={cn(
                                "flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] text-xs font-semibold transition-all",
                                searchTab === tab
                                  ? "bg-trainer-indigo text-white"
                                  : "bg-white/8 text-white/45 hover:text-white/70"
                              )}
                            >
                              {tab === "workout" ? (
                                <Dumbbell size={11} />
                              ) : (
                                <Heart size={11} />
                              )}
                              {tab === "workout" ? "Workout" : "Physio"}
                            </button>
                          ))}
                        </div>

                        {/* Search input */}
                        <div className="relative">
                          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                          <input
                            type="text"
                            placeholder={
                              searchTab === "workout"
                                ? "Search exercises…"
                                : "Search by name or condition…"
                            }
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            className="w-full pl-9 pr-3 py-2.5 rounded-[10px] bg-trainer-elevated border border-white/10 text-sm text-white placeholder:text-white/25 outline-none focus:border-trainer-indigo/50"
                          />
                        </div>

                        {/* Results */}
                        <div className="flex flex-col gap-1.5 max-h-52 overflow-y-auto no-scrollbar">
                          {searchTab === "workout" &&
                            (workoutResults.length === 0 && query.trim() ? (
                              <p className="text-xs text-white/30 text-center py-3">
                                No exercises found
                              </p>
                            ) : (
                              workoutResults.map((ex) => (
                                <button
                                  key={ex.id}
                                  onClick={() => addWorkoutExercise(ex)}
                                  className="flex items-center gap-3 px-3 py-2.5 rounded-[10px] bg-trainer-elevated border border-white/8 hover:border-trainer-indigo/30 transition-colors text-left"
                                >
                                  <Dumbbell size={13} className="text-trainer-indigo shrink-0" />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-white/80 truncate">
                                      {ex.name}
                                    </p>
                                    <p className="text-[11px] text-white/30 truncate capitalize">
                                      {ex.primaryMuscles.slice(0, 2).join(", ").replace(/-/g, " ")}
                                    </p>
                                  </div>
                                  <Plus size={14} className="text-white/25 shrink-0" />
                                </button>
                              ))
                            ))}

                          {searchTab === "physio" &&
                            (physioResults.length === 0 ? (
                              <p className="text-xs text-white/30 text-center py-3">
                                {query.trim()
                                  ? "No physio exercises found"
                                  : activeInjuries.length === 0
                                  ? "No active injuries — search to find physio exercises"
                                  : "All your physio exercises are added"}
                              </p>
                            ) : (
                              physioResults.map((ex) => (
                                <button
                                  key={ex.id}
                                  onClick={() => addPhysioExercise(ex)}
                                  className="flex items-center gap-3 px-3 py-2.5 rounded-[10px] bg-trainer-elevated border border-white/8 hover:border-trainer-success/30 transition-colors text-left"
                                >
                                  <Heart size={13} className="text-trainer-success/70 shrink-0" />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-white/80 truncate">
                                      {ex.name}
                                    </p>
                                    <p className="text-[11px] text-white/30 truncate capitalize">
                                      {ex.condition.replace(/-/g, " ")}
                                    </p>
                                  </div>
                                  <Plus size={14} className="text-white/25 shrink-0" />
                                </button>
                              ))
                            ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Slot picker — only shown when something is scheduled for later */}
              <AnimatePresence>
                {hasLater && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    className="space-y-2.5"
                  >
                    <div className="flex items-center gap-2">
                      <Clock size={13} className="text-trainer-warning/70" />
                      <p className="text-[11px] font-semibold text-white/40 uppercase tracking-widest">
                        When to do the later part? ({laterCount} exercises)
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {SLOTS.map((s) => (
                        <button
                          key={s.value}
                          onClick={() => setSlot(s.value)}
                          className={cn(
                            "px-3 py-2.5 rounded-[12px] border text-left transition-all",
                            slot === s.value
                              ? "bg-trainer-warning/12 border-trainer-warning/40"
                              : "bg-trainer-elevated border-white/8 hover:border-white/20"
                          )}
                        >
                          <p
                            className={cn(
                              "text-sm font-semibold",
                              slot === s.value
                                ? "text-trainer-warning"
                                : "text-white/70"
                            )}
                          >
                            {s.label}
                          </p>
                          <p className="text-[11px] text-white/30 mt-0.5">{s.sub}</p>
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Footer CTA */}
            <div className="px-5 pt-3 pb-safe border-t border-white/8 shrink-0" style={{ paddingBottom: "max(20px, env(safe-area-inset-bottom))" }}>
              {hasLater && (
                <p className="text-[11px] text-white/35 text-center mb-3">
                  {laterCount} exercise{laterCount !== 1 ? "s" : ""} will be saved to{" "}
                  <span className="text-trainer-warning/70">
                    {SLOTS.find((s) => s.value === slot)?.label}
                  </span>
                </p>
              )}
              <button
                onClick={handleConfirm}
                disabled={
                  Object.values(assignments).every((a) => a === "later") &&
                  added.filter((a) => a.assignment === "now").length === 0
                }
                className={cn(
                  "w-full py-3.5 rounded-[14px] text-sm font-bold transition-all",
                  "bg-trainer-indigo text-white hover:bg-trainer-indigo-hover active:scale-[0.98]",
                  "disabled:opacity-40 disabled:cursor-not-allowed disabled:scale-100"
                )}
              >
                Start Now
                {Object.values(assignments).filter((a) => a === "now").length +
                  added.filter((a) => a.assignment === "now" && a.type === "workout").length >
                  0 && (
                  <span className="ml-1.5 opacity-70 font-normal">
                    ·{" "}
                    {Object.values(assignments).filter((a) => a === "now").length +
                      added.filter(
                        (a) => a.assignment === "now" && a.type === "workout"
                      ).length}{" "}
                    exercises
                  </span>
                )}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
