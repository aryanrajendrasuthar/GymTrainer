"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BarChart2, ChevronDown, ChevronUp, Info } from "lucide-react";
import { useSessionStore } from "@/app/store/sessionStore";
import { exerciseMap } from "@/app/data/exercises";
import { cn } from "@/app/lib/utils";

// Per-muscle weekly MEV / MAV / MRV (sets/week) — RP Strength / Dr. Mike Israetel
const LANDMARKS: Record<string, { mev: number; mav: number; mrv: number }> = {
  chest:       { mev: 8,  mav: 16, mrv: 22 },
  back:        { mev: 8,  mav: 16, mrv: 25 },
  shoulders:   { mev: 8,  mav: 16, mrv: 26 },
  biceps:      { mev: 6,  mav: 14, mrv: 20 },
  triceps:     { mev: 6,  mav: 14, mrv: 20 },
  quads:       { mev: 8,  mav: 16, mrv: 20 },
  hamstrings:  { mev: 6,  mav: 12, mrv: 16 },
  glutes:      { mev: 4,  mav: 12, mrv: 16 },
  calves:      { mev: 8,  mav: 16, mrv: 20 },
  core:        { mev: 6,  mav: 16, mrv: 20 },
};

// Map exercise primary muscles → landmark keys
const MUSCLE_MAP: Record<string, string> = {
  "pectoralis-major":  "chest",
  "pectoralis-minor":  "chest",
  "chest":             "chest",
  "latissimus-dorsi":  "back",
  "rhomboids":         "back",
  "traps":             "back",
  "trapezius":         "back",
  "back":              "back",
  "lats":              "back",
  "rear-delts":        "shoulders",
  "anterior-deltoid":  "shoulders",
  "lateral-deltoid":   "shoulders",
  "deltoids":          "shoulders",
  "shoulders":         "shoulders",
  "biceps":            "biceps",
  "brachialis":        "biceps",
  "triceps":           "triceps",
  "quads":             "quads",
  "quadriceps":        "quads",
  "hamstrings":        "hamstrings",
  "glutes":            "glutes",
  "gluteus-maximus":   "glutes",
  "calves":            "calves",
  "gastrocnemius":     "calves",
  "soleus":            "calves",
  "abs":               "core",
  "core":              "core",
  "obliques":          "core",
};

const MUSCLE_LABELS: Record<string, string> = {
  chest: "Chest", back: "Back", shoulders: "Shoulders",
  biceps: "Biceps", triceps: "Triceps", quads: "Quads",
  hamstrings: "Hamstrings", glutes: "Glutes", calves: "Calves", core: "Core",
};

type Zone = "below" | "mev" | "mav" | "mrv";

function getZone(sets: number, mev: number, mav: number, mrv: number): Zone {
  if (sets >= mrv) return "mrv";
  if (sets >= mav) return "mav";
  if (sets >= mev) return "mev";
  return "below";
}

const ZONE_STYLE: Record<Zone, { label: string; bar: string; text: string }> = {
  below: { label: "Below MEV", bar: "bg-white/15",           text: "text-white/30" },
  mev:   { label: "MEV range", bar: "bg-trainer-success",    text: "text-trainer-success" },
  mav:   { label: "MAV range", bar: "bg-trainer-warning",    text: "text-trainer-warning" },
  mrv:   { label: "At MRV",    bar: "bg-red-400",            text: "text-red-400" },
};

function getWeekStart(): Date {
  const d = new Date();
  const day = d.getDay(); // 0 = Sun
  const diff = day === 0 ? -6 : 1 - day; // Mon=0
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function WeeklyVolumeCard() {
  const { recentSessions, allExerciseLogs } = useSessionStore();
  const [expanded, setExpanded] = useState(false);
  const [showLegend, setShowLegend] = useState(false);

  const rows = useMemo(() => {
    const weekStart = getWeekStart();
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 7);

    // Sessions this week
    const thisWeekIds = new Set(
      recentSessions
        .filter((s) => {
          const d = new Date(s.date);
          return d >= weekStart && d < weekEnd;
        })
        .map((s) => s.id)
    );

    // Aggregate sets per landmark muscle
    const setsMap: Record<string, number> = {};
    for (const log of allExerciseLogs) {
      if (!thisWeekIds.has(log.sessionId)) continue;
      const ex = exerciseMap[log.exerciseId];
      if (!ex) continue;
      for (const m of ex.primaryMuscles) {
        const key = MUSCLE_MAP[m.toLowerCase()];
        if (!key) continue;
        setsMap[key] = (setsMap[key] ?? 0) + log.sets.length;
      }
    }

    return Object.entries(LANDMARKS).map(([muscle, lm]) => {
      const sets = setsMap[muscle] ?? 0;
      const zone = getZone(sets, lm.mev, lm.mav, lm.mrv);
      const pct = Math.min(sets / lm.mrv, 1);
      return { muscle, sets, ...lm, zone, pct };
    }).sort((a, b) => b.pct - a.pct);
  }, [recentSessions, allExerciseLogs]);

  const totalSets = rows.reduce((s, r) => s + r.sets, 0);
  const inZoneCount = rows.filter((r) => r.zone !== "below").length;
  const mrvCount = rows.filter((r) => r.zone === "mrv").length;

  return (
    <div className="bg-trainer-surface border border-white/8 rounded-[16px] overflow-hidden">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center gap-3 p-4 text-left"
      >
        <div className="w-9 h-9 rounded-[10px] bg-trainer-indigo/12 flex items-center justify-center shrink-0">
          <BarChart2 size={16} className="text-trainer-indigo" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-white">Weekly Volume</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <p className="text-[11px] text-white/35">
              {totalSets > 0
                ? `${totalSets} sets · ${inZoneCount}/${rows.length} on track`
                : "No sessions logged this week"}
            </p>
            {mrvCount > 0 && (
              <span className="shrink-0 text-[9px] font-bold text-red-400/80 bg-red-400/8 border border-red-400/20 px-1.5 py-0.5 rounded-full">
                {mrvCount} at MRV
              </span>
            )}
          </div>
        </div>
        {expanded
          ? <ChevronUp size={14} className="text-white/30 shrink-0" />
          : <ChevronDown size={14} className="text-white/30 shrink-0" />}
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="overflow-hidden border-t border-white/6"
          >
            <div className="p-4 flex flex-col gap-3">

              {/* Legend toggle */}
              <div className="flex items-center justify-between">
                <p className="text-[10px] text-white/25 uppercase tracking-widest font-semibold">
                  This week — Sets vs Target Range
                </p>
                <button
                  onClick={() => setShowLegend((v) => !v)}
                  className="flex items-center gap-1 text-[10px] text-white/25 hover:text-white/50 transition-colors"
                >
                  <Info size={10} />
                  Legend
                </button>
              </div>

              <AnimatePresence>
                {showLegend && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="bg-trainer-elevated rounded-[10px] p-3 flex flex-col gap-1.5 mb-1">
                      {(["below", "mev", "mav", "mrv"] as Zone[]).map((z) => (
                        <div key={z} className="flex items-center gap-2">
                          <div className={cn("w-2 h-2 rounded-full shrink-0", ZONE_STYLE[z].bar.replace("bg-", "bg-"))} />
                          <span className={cn("text-[11px] font-semibold", ZONE_STYLE[z].text)}>
                            {ZONE_STYLE[z].label}
                          </span>
                          <span className="text-[10px] text-white/25 ml-auto">
                            {z === "below" && "< MEV: not enough stimulus"}
                            {z === "mev"   && "MEV–MAV: effective training"}
                            {z === "mav"   && "MAV–MRV: peak growth zone"}
                            {z === "mrv"   && "≥ MRV: near recovery limit"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Muscle rows */}
              <div className="flex flex-col gap-2.5">
                {rows.map(({ muscle, sets, mev, mav, mrv, zone, pct }, i) => {
                  const style = ZONE_STYLE[zone];
                  return (
                    <motion.div
                      key={muscle}
                      initial={{ opacity: 0, x: -6 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.03 }}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-semibold text-white/65">
                          {MUSCLE_LABELS[muscle]}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className={cn("text-[10px] font-semibold", style.text)}>
                            {style.label}
                          </span>
                          <span className="text-xs font-bold text-white/70 tabular-nums">
                            {sets}
                            <span className="text-white/25 font-normal text-[10px]">
                              /{mev}–{mav} sets
                            </span>
                          </span>
                        </div>
                      </div>

                      {/* Stacked progress bar */}
                      <div className="relative h-2 bg-white/6 rounded-full overflow-hidden">
                        {/* MEV marker */}
                        <div
                          className="absolute top-0 bottom-0 w-px bg-white/20 z-10"
                          style={{ left: `${(mev / mrv) * 100}%` }}
                        />
                        {/* MAV marker */}
                        <div
                          className="absolute top-0 bottom-0 w-px bg-white/20 z-10"
                          style={{ left: `${(mav / mrv) * 100}%` }}
                        />
                        {/* Fill */}
                        <motion.div
                          className={cn("absolute left-0 top-0 bottom-0 rounded-full", style.bar)}
                          initial={{ width: 0 }}
                          animate={{ width: `${pct * 100}%` }}
                          transition={{ duration: 0.5, delay: i * 0.03 + 0.1, ease: "easeOut" }}
                        />
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              <p className="text-[9px] text-white/15 mt-1">
                MEV / MAV / MRV guidelines — RP Strength · resets every Monday
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
