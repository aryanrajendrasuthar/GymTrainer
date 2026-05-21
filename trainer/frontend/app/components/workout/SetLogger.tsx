"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Plus, Minus, ChevronDown, ChevronUp, Calculator, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/app/components/ui/Button";
import { PlateCalculator } from "@/app/components/workout/PlateCalculator";
import { type SetLog } from "@/app/types";
import { cn } from "@/app/lib/utils";

interface SetLoggerProps {
  setNumber: number;
  targetRepsMin: number;
  targetRepsMax: number;
  targetSets: number;
  prefillWeight?: number;
  unit?: "kg" | "lb";
  showRpe?: boolean;
  onSetDone: (log: Omit<SetLog, "loggedAt">) => void;
  isCompleted?: boolean;
  completedLog?: SetLog;
  restSuggestion?: string;
  onEditSet?: (setNumber: number, updates: { repsCompleted: number; weightUsed: number; rpe?: number }) => void;
  onDeleteSet?: (setNumber: number) => void;
  bestAtReps?: (reps: number) => number | null;
}

const WEIGHT_STEPS = [1.25, 2.5, 5] as const;

// ─── Completed set row ────────────────────────────────────────────────────────

function CompletedSetRow({
  setNumber,
  repsCompleted,
  weightUsed,
  unit,
  rpe,
  onEdit,
  onDelete,
  isNew,
}: {
  setNumber: number;
  repsCompleted: number;
  weightUsed: number;
  unit: string;
  rpe?: number;
  onEdit?: (updates: { repsCompleted: number; weightUsed: number; rpe?: number }) => void;
  onDelete?: () => void;
  isNew?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [editWeight, setEditWeight] = useState(weightUsed);
  const [editReps, setEditReps] = useState(repsCompleted);
  const [editRpe, setEditRpe] = useState<number | undefined>(rpe);

  function handleSave() {
    onEdit?.({ repsCompleted: editReps, weightUsed: editWeight, rpe: editRpe });
    setEditing(false);
  }

  if (editing) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-trainer-elevated border border-trainer-indigo/30 rounded-[10px] p-3 space-y-3"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-trainer-indigo">Edit Set {setNumber}</span>
          <button onClick={() => setEditing(false)} className="text-xs text-white/30 hover:text-white/60">Cancel</button>
        </div>
        <div className="flex gap-3">
          <div className="flex-1">
            <p className="text-[10px] text-white/35 mb-1">Weight ({unit})</p>
            <input
              type="number"
              value={editWeight || ""}
              onChange={(e) => setEditWeight(parseFloat(e.target.value) || 0)}
              step="0.5"
              className="w-full bg-trainer-surface border border-white/10 rounded-[8px] px-3 py-2 text-sm font-bold text-white text-center focus:outline-none focus:border-trainer-indigo/40 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
              style={{ fontSize: "16px" }}
            />
          </div>
          <div className="flex-1">
            <p className="text-[10px] text-white/35 mb-1">Reps</p>
            <input
              type="number"
              value={editReps}
              onChange={(e) => setEditReps(parseInt(e.target.value) || 1)}
              min="1"
              className="w-full bg-trainer-surface border border-white/10 rounded-[8px] px-3 py-2 text-sm font-bold text-white text-center focus:outline-none focus:border-trainer-indigo/40 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
              style={{ fontSize: "16px" }}
            />
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleSave}
            className="flex-1 py-2 bg-trainer-indigo/15 border border-trainer-indigo/30 text-trainer-indigo text-xs font-semibold rounded-[8px] hover:bg-trainer-indigo/25 transition-colors"
          >
            Save
          </button>
          {onDelete && (
            <button
              onClick={() => { onDelete(); setEditing(false); }}
              className="w-9 py-2 bg-trainer-danger/10 border border-trainer-danger/20 text-trainer-danger rounded-[8px] flex items-center justify-center hover:bg-trainer-danger/20 transition-colors"
            >
              <Trash2 size={13} />
            </button>
          )}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.88, y: -4 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 500, damping: 30 }}
      className={cn(
        "relative flex items-center justify-between py-2.5 px-3 border rounded-[10px] overflow-hidden",
        onEdit ? "cursor-pointer hover:border-trainer-indigo/30 transition-colors" : "",
        "bg-trainer-success/8 border-trainer-success/20"
      )}
      onClick={onEdit ? () => { setEditing(true); setEditWeight(weightUsed); setEditReps(repsCompleted); setEditRpe(rpe); } : undefined}
    >
      {/* Burst ring — fires once on mount */}
      {isNew && (
        <motion.div
          className="absolute inset-0 rounded-[10px] border-2 border-trainer-success pointer-events-none"
          initial={{ opacity: 0.9, scale: 0.8 }}
          animate={{ opacity: 0, scale: 1.15 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      )}

      <div className="flex items-center gap-2.5">
        <motion.div
          className="w-6 h-6 rounded-full bg-trainer-success/20 flex items-center justify-center"
          initial={isNew ? { scale: 0, rotate: -90 } : false}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 600, damping: 20, delay: 0.05 }}
        >
          <Check size={13} className="text-trainer-success" />
        </motion.div>
        <span className="text-sm font-medium text-white/70">Set {setNumber}</span>
      </div>

      <div className="flex items-center gap-2">
        <motion.span
          className="text-sm font-semibold text-white tabular-nums"
          initial={isNew ? { opacity: 0, x: 8 } : false}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.08 }}
        >
          {repsCompleted} × {weightUsed}{unit}
          <span className="text-white/25 font-normal ml-1.5">= {Math.round(repsCompleted * weightUsed)}{unit}</span>
          {rpe && <span className="text-white/40 font-normal ml-1.5">RPE {rpe}</span>}
        </motion.span>
        {onEdit && <Pencil size={11} className="text-white/20 shrink-0" />}
      </div>
    </motion.div>
  );
}

// ─── Main SetLogger ────────────────────────────────────────────────────────────

export function SetLogger({
  setNumber,
  targetRepsMin,
  targetRepsMax,
  prefillWeight,
  unit = "kg",
  showRpe = false,
  onSetDone,
  isCompleted = false,
  completedLog,
  restSuggestion,
  onEditSet,
  onDeleteSet,
  bestAtReps,
}: SetLoggerProps) {
  const [reps, setReps] = useState(targetRepsMin);
  const [weight, setWeight] = useState(prefillWeight ?? 0);
  const [rpe, setRpe] = useState<number | undefined>(undefined);
  const [notes, setNotes] = useState("");
  const [showNotes, setShowNotes] = useState(false);
  const [showPlates, setShowPlates] = useState(false);
  const [weightStep] = useState<number>(2.5);
  const [btnPressed, setBtnPressed] = useState(false);

  const adjustWeight = useCallback(
    (delta: number) => setWeight((w) => Math.max(0, Math.round((w + delta) * 4) / 4)),
    []
  );
  const adjustReps = useCallback(
    (delta: number) => setReps((r) => Math.max(1, r + delta)),
    []
  );

  const handleDone = useCallback(() => {
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(40);
    }
    setBtnPressed(true);
    setTimeout(() => setBtnPressed(false), 300);
    onSetDone({
      setNumber,
      repsCompleted: reps,
      weightUsed: weight,
      weightUnit: unit,
      rpe,
      notes: notes || undefined,
    });
  }, [setNumber, reps, weight, unit, rpe, notes, onSetDone]);

  if (isCompleted && completedLog) {
    return (
      <CompletedSetRow
        setNumber={setNumber}
        repsCompleted={completedLog.repsCompleted}
        weightUsed={completedLog.weightUsed}
        unit={unit}
        rpe={completedLog.rpe}
        onEdit={onEditSet ? (updates) => onEditSet(setNumber, updates) : undefined}
        onDelete={onDeleteSet ? () => onDeleteSet(setNumber) : undefined}
      />
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-trainer-elevated border border-trainer-indigo/20 rounded-[12px] p-4 space-y-4"
    >
      {/* Set header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-trainer-indigo/20 flex items-center justify-center">
            <span className="text-[10px] font-bold text-trainer-indigo">{setNumber}</span>
          </div>
          <span className="text-sm font-semibold text-trainer-indigo">Set {setNumber}</span>
        </div>
        <div className="flex items-center gap-2">
          {bestAtReps && (() => {
            const pb = bestAtReps(reps);
            if (!pb) return null;
            const isBeating = weight > pb;
            return (
              <span className={cn(
                "text-[10px] font-semibold px-2 py-0.5 rounded-full",
                isBeating
                  ? "bg-trainer-gold/15 text-trainer-gold"
                  : "bg-white/6 text-white/35"
              )}>
                {isBeating ? "🏆 " : ""}PB@{reps}: {pb % 1 === 0 ? pb : pb.toFixed(1)}{unit}
              </span>
            );
          })()}
          <span className="text-xs text-white/40">
            Target: {targetRepsMin}–{targetRepsMax} reps
          </span>
        </div>
      </div>

      {/* Weight input */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs text-white/40">Weight ({unit})</label>
          {weight > 0 && (
            <button
              onClick={() => setShowPlates((v) => !v)}
              className={cn(
                "flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full transition-colors",
                showPlates
                  ? "bg-trainer-indigo/20 text-trainer-indigo"
                  : "text-white/25 hover:text-white/60"
              )}
            >
              <Calculator size={10} />
              Plates
            </button>
          )}
        </div>
        <div className="flex items-center gap-3">
          <motion.button
            whileTap={{ scale: 0.88 }}
            onClick={() => adjustWeight(-weightStep)}
            className="w-11 h-11 rounded-[10px] bg-trainer-surface border border-white/10 flex items-center justify-center hover:border-trainer-indigo/40 transition-colors"
            aria-label={`Decrease weight by ${weightStep}${unit}`}
          >
            <Minus size={16} className="text-white/60" />
          </motion.button>

          <input
            type="number"
            value={weight || ""}
            onChange={(e) => setWeight(parseFloat(e.target.value) || 0)}
            placeholder="0"
            min="0"
            step="0.5"
            className={cn(
              "flex-1 text-center text-2xl font-bold tabular-nums",
              "bg-transparent border-b-2 border-white/20 focus:border-trainer-indigo",
              "outline-none text-white pb-1 transition-colors"
            )}
            style={{ fontSize: "clamp(16px, 5vw, 28px)" }}
            aria-label={`Weight in ${unit}`}
          />

          <motion.button
            whileTap={{ scale: 0.88 }}
            onClick={() => adjustWeight(weightStep)}
            className="w-11 h-11 rounded-[10px] bg-trainer-surface border border-white/10 flex items-center justify-center hover:border-trainer-indigo/40 transition-colors"
            aria-label={`Increase weight by ${weightStep}${unit}`}
          >
            <Plus size={16} className="text-white/60" />
          </motion.button>
        </div>

        {/* Quick increment buttons */}
        <div className="flex gap-2 mt-2 justify-center">
          {WEIGHT_STEPS.map((step) => (
            <motion.button
              key={step}
              whileTap={{ scale: 0.9 }}
              onClick={() => adjustWeight(step)}
              className="px-2.5 py-1 rounded-full text-[10px] bg-trainer-surface border border-white/10 text-white/40 hover:text-trainer-indigo hover:border-trainer-indigo/30 transition-colors"
            >
              +{step}
            </motion.button>
          ))}
        </div>

        {/* Plate calculator */}
        <AnimatePresence>
          {showPlates && weight > 0 && (
            <PlateCalculator
              weightKg={unit === "lb" ? weight / 2.20462 : weight}
              unit={unit}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Reps input */}
      <div>
        <label className="text-xs text-white/40 mb-2 block">Reps</label>
        <div className="flex items-center gap-3">
          <motion.button
            whileTap={{ scale: 0.88 }}
            onClick={() => adjustReps(-1)}
            className="w-11 h-11 rounded-[10px] bg-trainer-surface border border-white/10 flex items-center justify-center hover:border-trainer-indigo/40 transition-colors"
            aria-label="Decrease reps"
          >
            <Minus size={16} className="text-white/60" />
          </motion.button>

          <input
            type="number"
            value={reps}
            onChange={(e) => setReps(parseInt(e.target.value) || 1)}
            min="1"
            className={cn(
              "flex-1 text-center font-bold tabular-nums",
              "bg-transparent border-b-2 border-white/20 focus:border-trainer-indigo",
              "outline-none text-white pb-1 transition-colors"
            )}
            style={{ fontSize: "clamp(16px, 5vw, 28px)" }}
            aria-label="Reps completed"
          />

          <motion.button
            whileTap={{ scale: 0.88 }}
            onClick={() => adjustReps(1)}
            className="w-11 h-11 rounded-[10px] bg-trainer-surface border border-white/10 flex items-center justify-center hover:border-trainer-indigo/40 transition-colors"
            aria-label="Increase reps"
          >
            <Plus size={16} className="text-white/60" />
          </motion.button>
        </div>
      </div>

      {/* RPE selector */}
      {showRpe && (
        <div>
          <label className="text-xs text-white/40 mb-2 block">RPE (optional)</label>
          <div className="flex gap-1.5 flex-wrap">
            {[6, 7, 7.5, 8, 8.5, 9, 9.5, 10].map((r) => (
              <motion.button
                key={r}
                whileTap={{ scale: 0.9 }}
                onClick={() => setRpe(rpe === r ? undefined : r)}
                className={cn(
                  "w-9 h-9 rounded-[8px] text-xs font-medium transition-all",
                  rpe === r
                    ? "bg-trainer-indigo text-white"
                    : "bg-trainer-surface border border-white/10 text-white/40 hover:border-trainer-indigo/30"
                )}
              >
                {r}
              </motion.button>
            ))}
          </div>
        </div>
      )}

      {/* Live set volume */}
      {weight > 0 && reps > 0 && (
        <div className="flex items-center justify-center gap-1.5 -mt-1">
          <span className="text-[10px] text-white/25">Set volume:</span>
          <span className="text-[10px] font-bold text-trainer-indigo/70 tabular-nums">{Math.round(weight * reps)} {unit}</span>
        </div>
      )}

      {/* Notes toggle */}
      <button
        onClick={() => setShowNotes((v) => !v)}
        className="text-xs text-white/30 hover:text-white/60 flex items-center gap-1 transition-colors"
      >
        {showNotes ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        {showNotes ? "Hide notes" : "Add note (optional)"}
      </button>

      <AnimatePresence>
        {showNotes && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
          >
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. felt heavy, good form..."
              rows={2}
              className="w-full bg-trainer-surface border border-white/10 rounded-[8px] px-3 py-2 text-sm text-white placeholder:text-white/20 outline-none focus:border-trainer-indigo/40 resize-none"
              style={{ fontSize: "16px" }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mark done button with press animation */}
      <motion.div
        animate={btnPressed ? { scale: [1, 0.95, 1.02, 1] } : {}}
        transition={{ duration: 0.25, ease: "easeOut" }}
      >
        <Button
          variant="primary"
          fullWidth
          size="lg"
          onClick={handleDone}
          className="mt-1 shadow-lg shadow-trainer-indigo/25"
        >
          <motion.span
            animate={btnPressed ? { scale: [1, 1.3, 1] } : {}}
            transition={{ duration: 0.25 }}
          >
            <Check size={18} />
          </motion.span>
          Mark Set Done
        </Button>
      </motion.div>

      {/* Rest suggestion */}
      {restSuggestion && (
        <p className="text-center text-xs text-white/30">{restSuggestion}</p>
      )}
    </motion.div>
  );
}
