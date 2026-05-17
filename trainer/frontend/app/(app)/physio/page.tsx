"use client";

import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Heart,
  ChevronLeft,
  Check,
  Sun,
  Moon,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  Activity,
} from "lucide-react";
import { useUserStore } from "@/app/store/userStore";
import { usePhysioStore } from "@/app/store/physioStore";
import { buildPhysioSession, assessPhaseGate } from "@/app/lib/physio-engine";
import { Badge } from "@/app/components/ui/Badge";
import { Button } from "@/app/components/ui/Button";
import {
  type PhysioCondition,
  type PhysioPhase,
  type UserInjury,
} from "@/app/types";
import type { PhysioSession } from "@/app/lib/physio-engine";
import { cn } from "@/app/lib/utils";

// ─── Display maps ───────────────────────────────────────────────────────────────

const CONDITION_NAMES: Record<PhysioCondition, string> = {
  "adhesive-capsulitis": "Adhesive Capsulitis",
  "cervical-strain": "Cervical Strain",
  "thoracic-kyphosis": "Thoracic Kyphosis",
  "scapular-winging": "Scapular Winging",
  "scapular-dyskinesia": "Scapular Dyskinesia",
  "l4-l5-disc-herniation": "L4-L5 Disc Herniation",
  "l5-s1-disc-herniation": "L5-S1 Disc Herniation",
  coccydynia: "Coccydynia",
  "patellofemoral-pain-syndrome": "Patellofemoral Pain Syndrome",
  "it-band-syndrome": "IT Band Syndrome",
  "achilles-tendinopathy": "Achilles Tendinopathy",
  "plantar-fasciitis": "Plantar Fasciitis",
  "peroneal-tendon-injury": "Peroneal Tendon Injury",
  "rotator-cuff-strain": "Rotator Cuff Strain",
  "shoulder-impingement": "Shoulder Impingement",
  "piriformis-syndrome": "Piriformis Syndrome",
  "si-joint-dysfunction": "SI Joint Dysfunction",
  "thoracic-outlet-syndrome": "Thoracic Outlet Syndrome",
  "cervicogenic-headache": "Cervicogenic Headache",
  whiplash: "Whiplash",
};

const PHASE_STYLE: Record<PhysioPhase, { label: string; className: string }> = {
  acute: { label: "Acute", className: "text-trainer-danger bg-trainer-danger/10" },
  subacute: { label: "Sub-acute", className: "text-trainer-warning bg-trainer-warning/10" },
  chronic: { label: "Chronic", className: "text-sky-400 bg-sky-400/10" },
  maintenance: { label: "Maintenance", className: "text-trainer-success bg-trainer-success/10" },
};

const SEVERITY_STYLE = {
  mild: "text-emerald-400 bg-emerald-400/10",
  moderate: "text-amber-400 bg-amber-400/10",
  severe: "text-red-400 bg-red-400/10",
};

// ─── Pain scale helper ──────────────────────────────────────────────────────────

function painLabel(level: number): { text: string; color: string } {
  if (level <= 2) return { text: "No / minimal pain", color: "text-trainer-success" };
  if (level <= 4) return { text: "Mild pain", color: "text-amber-400" };
  if (level <= 6) return { text: "Moderate pain", color: "text-trainer-warning" };
  if (level <= 8) return { text: "Severe pain", color: "text-trainer-danger" };
  return { text: "Extreme pain", color: "text-red-600" };
}

// ─── Pain slider ─────────────────────────────────────────────────────────────────

function PainSlider({
  value,
  onChange,
  label,
}: {
  value: number;
  onChange: (n: number) => void;
  label: string;
}) {
  const { text, color } = painLabel(value);
  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm font-medium text-white/70">{label}</p>
      <div className="flex items-center gap-3">
        <span className="text-xs text-white/30 tabular-nums w-3">0</span>
        <div className="flex-1 relative">
          <input
            type="range"
            min={0}
            max={10}
            step={1}
            value={value}
            onChange={(e) => onChange(parseInt(e.target.value))}
            className="w-full h-2 appearance-none rounded-full outline-none cursor-pointer"
            style={{
              background: `linear-gradient(to right, #6C63FF ${value * 10}%, rgba(255,255,255,0.1) ${value * 10}%)`,
            }}
          />
        </div>
        <span className="text-xs text-white/30 tabular-nums w-3 text-right">10</span>
      </div>
      <div className="flex items-center justify-between">
        <span className={cn("text-2xl font-black tabular-nums", color)}>{value}</span>
        <span className={cn("text-sm font-medium", color)}>{text}</span>
      </div>
    </div>
  );
}

// ─── Condition card ─────────────────────────────────────────────────────────────

function ConditionCard({
  injury,
  completedSlots,
  onStartSlot,
  latestPain,
}: {
  injury: UserInjury;
  completedSlots: ("morning" | "evening")[];
  onStartSlot: (slot: "morning" | "evening") => void;
  latestPain: number | null;
}) {
  const phase = PHASE_STYLE[injury.phase];
  const severity = SEVERITY_STYLE[injury.severity];
  const name = CONDITION_NAMES[injury.condition] ?? injury.condition;

  const morningDone = completedSlots.includes("morning");
  const eveningDone = completedSlots.includes("evening");

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-trainer-surface border border-white/8 rounded-[16px] p-4"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex-1">
          <p className="text-sm font-bold text-white leading-tight">{name}</p>
          <p className="text-xs text-white/40 mt-0.5 capitalize">{injury.bodyRegion}</p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className={cn("text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide capitalize", severity)}>
            {injury.severity}
          </span>
          <span className={cn("text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide", phase.className)}>
            {phase.label}
          </span>
        </div>
      </div>

      {/* Pain indicator */}
      {latestPain !== null && (
        <div className="flex items-center gap-2 mb-3 px-3 py-2 rounded-[8px] bg-white/4">
          <Activity size={12} className="text-white/40" />
          <span className="text-xs text-white/40">Last pain:</span>
          <span className={cn("text-xs font-bold", painLabel(latestPain).color)}>
            {latestPain}/10
          </span>
        </div>
      )}

      {/* Session slot buttons */}
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => !morningDone && onStartSlot("morning")}
          className={cn(
            "flex items-center justify-center gap-2 py-2.5 rounded-[10px] border text-sm font-semibold transition-all",
            morningDone
              ? "bg-trainer-success/10 border-trainer-success/30 text-trainer-success"
              : "bg-white/5 border-white/10 text-white/60 hover:border-trainer-indigo/40 hover:text-white"
          )}
        >
          {morningDone ? <Check size={14} /> : <Sun size={14} />}
          Morning
        </button>
        <button
          onClick={() => !eveningDone && onStartSlot("evening")}
          className={cn(
            "flex items-center justify-center gap-2 py-2.5 rounded-[10px] border text-sm font-semibold transition-all",
            eveningDone
              ? "bg-trainer-success/10 border-trainer-success/30 text-trainer-success"
              : "bg-white/5 border-white/10 text-white/60 hover:border-trainer-indigo/40 hover:text-white"
          )}
        >
          {eveningDone ? <Check size={14} /> : <Moon size={14} />}
          Evening
        </button>
      </div>
    </motion.div>
  );
}

// ─── Exercise row ───────────────────────────────────────────────────────────────

function ExerciseRow({
  sessionExercise,
  isCompleted,
  onToggle,
}: {
  sessionExercise: PhysioSession["exercises"][number];
  isCompleted: boolean;
  onToggle: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const ex = sessionExercise.exercise;

  return (
    <div
      className={cn(
        "rounded-[12px] border transition-all duration-200",
        isCompleted ? "bg-trainer-success/6 border-trainer-success/25" : "bg-trainer-elevated border-white/10"
      )}
    >
      <div className="flex items-center gap-3 p-3.5">
        {/* Checkbox */}
        <button
          onClick={onToggle}
          className={cn(
            "w-6 h-6 rounded-full border-2 shrink-0 flex items-center justify-center transition-all",
            isCompleted ? "bg-trainer-success border-trainer-success" : "border-white/25 hover:border-trainer-success/60"
          )}
          aria-label={isCompleted ? "Mark incomplete" : "Mark complete"}
        >
          {isCompleted && <Check size={13} className="text-white" />}
        </button>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className={cn("text-sm font-semibold leading-tight", isCompleted ? "text-white/60 line-through" : "text-white/85")}>
            {ex.name}
          </p>
          <p className="text-xs text-white/35 mt-0.5">
            {ex.sets && ex.reps ? `${ex.sets} × ${ex.reps} reps` : ex.duration ?? ""}
            {ex.holdTime ? ` · ${ex.holdTime}s hold` : ""}
          </p>
        </div>

        {/* Expand */}
        <button
          onClick={() => setExpanded((v) => !v)}
          className="w-7 h-7 rounded-full bg-white/6 flex items-center justify-center shrink-0"
        >
          {expanded ? <ChevronUp size={13} className="text-white/40" /> : <ChevronDown size={13} className="text-white/40" />}
        </button>
      </div>

      {/* Expanded details */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-1 flex flex-col gap-3 border-t border-white/6">
              {/* Instructions */}
              <ol className="flex flex-col gap-1.5">
                {ex.instructions.map((step, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="text-[10px] font-bold text-trainer-indigo/60 tabular-nums mt-0.5 w-3">{i + 1}.</span>
                    <p className="text-xs text-white/55 leading-relaxed">{step}</p>
                  </li>
                ))}
              </ol>
              {/* Breathing */}
              {ex.breathingCues.length > 0 && (
                <div className="flex flex-col gap-1">
                  <p className="text-[10px] text-trainer-indigo/50 font-semibold uppercase tracking-wider">Breathing</p>
                  {ex.breathingCues.map((cue, i) => (
                    <p key={i} className="text-xs text-white/45">{cue}</p>
                  ))}
                </div>
              )}
              {/* Red flags */}
              {ex.redFlags.length > 0 && (
                <div className="flex items-start gap-2 px-2.5 py-2 rounded-[8px] bg-trainer-danger/8 border border-trainer-danger/20">
                  <AlertTriangle size={12} className="text-trainer-danger shrink-0 mt-0.5" />
                  <p className="text-xs text-white/60">Stop if: {ex.redFlags[0]}</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Page ───────────────────────────────────────────────────────────────────────

type PhysioView = "list" | "pre" | "active" | "post";

export default function PhysioPage() {
  const { profile } = useUserStore();
  const {
    todayCompletedSlots,
    addSession,
    markSlotComplete,
    logPain,
    getLatestPain,
    sessionHistory,
  } = usePhysioStore();

  const injuries: UserInjury[] = profile?.injuries ?? [];

  const [view, setView] = useState<PhysioView>("list");
  const [selectedInjury, setSelectedInjury] = useState<UserInjury | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<"morning" | "evening">("morning");
  const [session, setSession] = useState<PhysioSession | null>(null);
  const [painBefore, setPainBefore] = useState(5);
  const [painAfter, setPainAfter] = useState(5);
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());

  const handleStartSlot = useCallback(
    (injury: UserInjury, slot: "morning" | "evening") => {
      const latestPain = getLatestPain(injury.condition) ?? 5;
      const built = buildPhysioSession({
        condition: injury.condition,
        phase: injury.phase,
        slot,
        currentPainLevel: latestPain,
      });
      setSelectedInjury(injury);
      setSelectedSlot(slot);
      setSession(built);
      setPainBefore(latestPain);
      setPainAfter(latestPain);
      setCompletedIds(new Set());
      setView("pre");
    },
    [getLatestPain]
  );

  const handleBeginSession = () => {
    logPain(selectedInjury!.condition, painBefore);
    setView("active");
  };

  const handleFinishSession = () => {
    setView("post");
  };

  const handleSaveSession = () => {
    if (!session || !selectedInjury) return;
    const now = new Date().toISOString();
    logPain(selectedInjury.condition, painAfter);
    addSession({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      condition: selectedInjury.condition,
      phase: selectedInjury.phase,
      slot: selectedSlot,
      painBefore,
      painAfter,
      completedExerciseIds: Array.from(completedIds),
      completedAt: now,
    });
    markSlotComplete(selectedInjury.condition, selectedSlot);
    setView("list");
    setSession(null);
    setSelectedInjury(null);
  };

  // Phase gate check for each condition
  const phaseGateMap = useMemo(() => {
    const map = new Map<PhysioCondition, ReturnType<typeof assessPhaseGate>>();
    for (const injury of injuries) {
      const logs = sessionHistory
        .filter((s) => s.condition === injury.condition)
        .map((s) => ({
          condition: s.condition,
          phase: s.phase,
          completedExerciseIds: s.completedExerciseIds,
          painBefore: s.painBefore,
          painAfter: s.painAfter,
          loggedAt: s.completedAt,
        }));
      map.set(injury.condition, assessPhaseGate(logs, injury.condition, injury.phase));
    }
    return map;
  }, [injuries, sessionHistory]);

  // ─── Empty state ─────────────────────────────────────────────────────────────

  if (view === "list" && injuries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-full px-5 gap-5 text-center">
        <div className="w-16 h-16 rounded-full bg-trainer-success/12 flex items-center justify-center">
          <Heart size={28} className="text-trainer-success/60" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white mb-2">No active conditions</h2>
          <p className="text-sm text-white/45 leading-relaxed max-w-xs">
            When injuries or conditions are added to your profile, your personalised
            physiotherapy programme will appear here.
          </p>
        </div>
      </div>
    );
  }

  // ─── Active session ───────────────────────────────────────────────────────────

  if (view === "pre" && session && selectedInjury) {
    return (
      <div className="flex flex-col min-h-full">
        <div className="sticky top-0 z-20 flex items-center gap-3 px-4 pt-12 pb-4 bg-trainer-black/95 backdrop-blur-md border-b border-white/8">
          <button
            onClick={() => setView("list")}
            className="w-8 h-8 rounded-full bg-white/8 flex items-center justify-center"
          >
            <ChevronLeft size={16} className="text-white/60" />
          </button>
          <div className="flex-1">
            <p className="text-xs text-white/35 uppercase tracking-wider">
              {selectedSlot === "morning" ? "Morning" : "Evening"} · {PHASE_STYLE[selectedInjury.phase].label}
            </p>
            <p className="text-sm font-bold text-white truncate">
              {CONDITION_NAMES[selectedInjury.condition]}
            </p>
          </div>
        </div>

        <div className="flex-1 px-5 py-6 flex flex-col gap-6">
          <div>
            <h2 className="text-lg font-bold text-white mb-1">How is your pain right now?</h2>
            <p className="text-sm text-white/40">Rate your pain before starting. Be honest — this helps calibrate your exercises.</p>
          </div>

          <PainSlider value={painBefore} onChange={setPainBefore} label="Current pain level (0–10)" />

          <div className="bg-trainer-elevated border border-white/10 rounded-[12px] p-4">
            <p className="text-xs text-white/35 uppercase tracking-wider font-semibold mb-3">
              Today's session · {session.exercises.length} exercises · ~{session.estimatedDurationMinutes}min
            </p>
            <div className="flex flex-col gap-1.5">
              {session.exercises.map(({ exercise }) => (
                <div key={exercise.id} className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-trainer-indigo/50 shrink-0" />
                  <p className="text-sm text-white/60">{exercise.name}</p>
                </div>
              ))}
            </div>
          </div>

          {painBefore >= 8 && (
            <div className="flex items-start gap-3 p-3.5 rounded-[12px] bg-trainer-danger/10 border border-trainer-danger/30">
              <AlertTriangle size={16} className="text-trainer-danger shrink-0 mt-0.5" />
              <p className="text-sm text-white/70">
                Pain level is high. Consider rest today and consult your physiotherapist if it persists.
              </p>
            </div>
          )}
        </div>

        <div className="px-5 pb-10 border-t border-white/6 pt-4">
          <Button
            fullWidth
            size="lg"
            onClick={handleBeginSession}
            disabled={painBefore >= 9}
          >
            {selectedSlot === "morning" ? <Sun size={18} /> : <Moon size={18} />}
            Begin Session
          </Button>
        </div>
      </div>
    );
  }

  if (view === "active" && session && selectedInjury) {
    const totalDone = completedIds.size;
    const totalExercises = session.exercises.length;
    const allDone = totalDone >= totalExercises;

    return (
      <div className="flex flex-col min-h-full">
        <div className="sticky top-0 z-20 flex items-center gap-3 px-4 pt-12 pb-4 bg-trainer-black/95 backdrop-blur-md border-b border-white/8">
          <button onClick={() => setView("pre")} className="w-8 h-8 rounded-full bg-white/8 flex items-center justify-center">
            <ChevronLeft size={16} className="text-white/60" />
          </button>
          <div className="flex-1">
            <p className="text-sm font-bold text-white truncate">{CONDITION_NAMES[selectedInjury.condition]}</p>
          </div>
          <span className="text-xs text-white/35 tabular-nums">{totalDone}/{totalExercises}</span>
        </div>

        {/* Progress bar */}
        <div className="h-0.5 bg-white/6">
          <motion.div
            className="h-full bg-trainer-success"
            animate={{ width: `${(totalDone / totalExercises) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>

        <div className="flex-1 px-4 py-5 flex flex-col gap-2.5 pb-32">
          {session.exercises.map((se) => (
            <ExerciseRow
              key={se.exercise.id}
              sessionExercise={se}
              isCompleted={completedIds.has(se.exercise.id)}
              onToggle={() =>
                setCompletedIds((prev) => {
                  const next = new Set(prev);
                  if (next.has(se.exercise.id)) next.delete(se.exercise.id);
                  else next.add(se.exercise.id);
                  return next;
                })
              }
            />
          ))}
        </div>

        <div className="fixed bottom-0 left-0 right-0 px-5 pb-10 pt-4 border-t border-white/6 bg-trainer-black/95 backdrop-blur-md">
          <Button
            fullWidth
            size="lg"
            onClick={handleFinishSession}
            variant={allDone ? "primary" : "secondary"}
          >
            <Check size={18} />
            {allDone ? "Finish Session" : `Finish Early (${totalDone}/${totalExercises} done)`}
          </Button>
        </div>
      </div>
    );
  }

  if (view === "post" && selectedInjury) {
    return (
      <div className="flex flex-col min-h-full">
        <div className="sticky top-0 z-20 flex items-center gap-3 px-4 pt-12 pb-4 bg-trainer-black/95 backdrop-blur-md border-b border-white/8">
          <button onClick={() => setView("active")} className="w-8 h-8 rounded-full bg-white/8 flex items-center justify-center">
            <ChevronLeft size={16} className="text-white/60" />
          </button>
          <p className="text-sm font-bold text-white">Session Complete</p>
        </div>

        <div className="flex-1 px-5 py-6 flex flex-col gap-6">
          <div>
            <h2 className="text-lg font-bold text-white mb-1">How is your pain now?</h2>
            <p className="text-sm text-white/40">Rate your pain after completing the exercises.</p>
          </div>

          <PainSlider value={painAfter} onChange={setPainAfter} label="Post-session pain level (0–10)" />

          {/* Before vs after comparison */}
          <div className="flex items-center gap-3 p-4 rounded-[12px] bg-trainer-elevated border border-white/10">
            <div className="flex-1 text-center">
              <p className="text-[10px] text-white/30 uppercase tracking-wider mb-1">Before</p>
              <p className={cn("text-xl font-black", painLabel(painBefore).color)}>{painBefore}</p>
            </div>
            <TrendingUp
              size={16}
              className={cn(
                painAfter < painBefore ? "text-trainer-success" : painAfter > painBefore ? "text-trainer-danger" : "text-white/30"
              )}
            />
            <div className="flex-1 text-center">
              <p className="text-[10px] text-white/30 uppercase tracking-wider mb-1">After</p>
              <p className={cn("text-xl font-black", painLabel(painAfter).color)}>{painAfter}</p>
            </div>
          </div>

          {painAfter > painBefore + 2 && (
            <div className="flex items-start gap-3 p-3.5 rounded-[12px] bg-trainer-danger/10 border border-trainer-danger/30">
              <AlertTriangle size={16} className="text-trainer-danger shrink-0 mt-0.5" />
              <p className="text-sm text-white/70">
                Pain increased after the session. Consider reducing intensity next time or consulting your physiotherapist.
              </p>
            </div>
          )}
        </div>

        <div className="px-5 pb-10 border-t border-white/6 pt-4">
          <Button fullWidth size="lg" onClick={handleSaveSession}>
            Save Session
          </Button>
        </div>
      </div>
    );
  }

  // ─── Condition list ───────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col min-h-full pb-24">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="px-5 pt-14 pb-6"
      >
        <h1 className="text-2xl font-bold text-white">Physiotherapy</h1>
        <p className="text-sm text-white/40 mt-1">
          {injuries.length} active condition{injuries.length !== 1 ? "s" : ""}
        </p>
      </motion.div>

      <div className="flex flex-col gap-4 px-5">
        {injuries.map((injury) => {
          const slots = todayCompletedSlots[injury.condition] ?? [];
          const gate = phaseGateMap.get(injury.condition);
          const latestPain = getLatestPain(injury.condition);

          return (
            <div key={injury.condition}>
              <ConditionCard
                injury={injury}
                completedSlots={slots}
                onStartSlot={(slot) => handleStartSlot(injury, slot)}
                latestPain={latestPain}
              />

              {/* Phase gate banner */}
              {gate?.canProgress && gate.suggestedPhase && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="mt-2 flex items-start gap-2.5 px-3.5 py-2.5 rounded-[10px] bg-trainer-success/8 border border-trainer-success/25"
                >
                  <TrendingUp size={14} className="text-trainer-success shrink-0 mt-0.5" />
                  <p className="text-xs text-white/65 leading-relaxed">
                    <span className="font-semibold text-trainer-success">Ready to progress </span>
                    to {PHASE_STYLE[gate.suggestedPhase].label} phase. {gate.reason}
                  </p>
                </motion.div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
