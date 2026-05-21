"use client";

import { motion } from "framer-motion";
import { Activity } from "lucide-react";
import { cn } from "@/app/lib/utils";

// Per-muscle MEV / MAV / MRV (sets per session) — Dr. Mike Israetel / RP Strength
// [MEV, MAV, MRV]
const LANDMARKS: Record<string, { mev: number; mav: number; mrv: number }> = {
  chest:           { mev: 4,  mav: 12, mrv: 22 },
  back:            { mev: 4,  mav: 14, mrv: 25 },
  shoulders:       { mev: 6,  mav: 16, mrv: 26 },
  biceps:          { mev: 4,  mav: 10, mrv: 20 },
  triceps:         { mev: 4,  mav: 10, mrv: 20 },
  quads:           { mev: 6,  mav: 12, mrv: 20 },
  hamstrings:      { mev: 4,  mav: 10, mrv: 16 },
  glutes:          { mev: 4,  mav: 10, mrv: 16 },
  calves:          { mev: 6,  mav: 14, mrv: 20 },
  core:            { mev: 4,  mav: 12, mrv: 20 },
  "lower-back":    { mev: 2,  mav: 6,  mrv: 10 },
  forearms:        { mev: 4,  mav: 8,  mrv: 16 },
};

interface VolumeLandmarkCardProps {
  // Map from muscle name to sets completed this session
  setsPerMuscle: Record<string, number>;
}

function getStatus(sets: number, mev: number, mav: number, mrv: number) {
  if (sets >= mrv) return { label: "At MRV", color: "text-red-400", barColor: "bg-red-400", pct: 100 };
  if (sets >= mav) return { label: "In MAV", color: "text-amber-400", barColor: "bg-amber-400", pct: Math.round((sets / mrv) * 100) };
  if (sets >= mev) return { label: "In MEV", color: "text-trainer-success", barColor: "bg-trainer-success", pct: Math.round((sets / mrv) * 100) };
  return { label: "Below MEV", color: "text-white/35", barColor: "bg-white/15", pct: Math.round((sets / mrv) * 100) };
}

export function VolumeLandmarkCard({ setsPerMuscle }: VolumeLandmarkCardProps) {
  const rows = Object.entries(setsPerMuscle)
    .filter(([muscle]) => LANDMARKS[muscle])
    .filter(([, sets]) => sets > 0)
    .map(([muscle, sets]) => {
      const lm = LANDMARKS[muscle];
      const status = getStatus(sets, lm.mev, lm.mav, lm.mrv);
      return { muscle, sets, ...lm, ...status };
    })
    .sort((a, b) => b.pct - a.pct);

  if (rows.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-trainer-surface border border-white/8 rounded-[16px] p-4"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Activity size={13} className="text-trainer-indigo" />
          <p className="text-xs text-white/35 uppercase tracking-widest font-semibold">
            Volume Landmarks
          </p>
        </div>
        <span className="text-[10px] text-white/25 tabular-nums">
          {rows.reduce((s, r) => s + r.sets, 0)} sets total
        </span>
      </div>

      <div className="flex flex-col gap-3">
        {rows.map((row, i) => (
          <motion.div
            key={row.muscle}
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs font-semibold text-white/70 capitalize">
                {row.muscle.replace(/-/g, " ")}
              </p>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-white/40 tabular-nums">{row.sets} sets</span>
                <span className={cn("text-[10px] font-bold", row.color)}>{row.label}</span>
              </div>
            </div>

            {/* Segmented bar: MEV | MAV | MRV */}
            <div className="flex h-1.5 gap-0.5 rounded-full overflow-hidden">
              {/* MEV zone */}
              <div
                className="rounded-full overflow-hidden bg-white/8"
                style={{ flex: row.mev }}
              >
                <div
                  className={cn("h-full", row.sets >= row.mev ? row.barColor : "")}
                  style={{ width: row.sets < row.mev ? `${(row.sets / row.mev) * 100}%` : "100%" }}
                />
              </div>
              {/* MAV zone */}
              <div
                className="rounded-full overflow-hidden bg-white/8"
                style={{ flex: row.mav - row.mev }}
              >
                <div
                  className={cn("h-full", row.sets > row.mev ? row.barColor : "")}
                  style={{
                    width: row.sets <= row.mev ? "0%" :
                           row.sets >= row.mav ? "100%" :
                           `${((row.sets - row.mev) / (row.mav - row.mev)) * 100}%`
                  }}
                />
              </div>
              {/* MRV zone */}
              <div
                className="rounded-full overflow-hidden bg-white/8"
                style={{ flex: row.mrv - row.mav }}
              >
                <div
                  className={cn("h-full", row.sets > row.mav ? row.barColor : "")}
                  style={{
                    width: row.sets <= row.mav ? "0%" :
                           row.sets >= row.mrv ? "100%" :
                           `${((row.sets - row.mav) / (row.mrv - row.mav)) * 100}%`
                  }}
                />
              </div>
            </div>

            <div className="flex justify-between mt-0.5">
              <span className="text-[9px] text-white/20">{row.mev} MEV</span>
              <span className="text-[9px] text-white/20">{row.mav} MAV</span>
              <span className="text-[9px] text-white/20">{row.mrv} MRV</span>
            </div>
          </motion.div>
        ))}
      </div>

      <p className="text-[9px] text-white/12 mt-3">MEV · MAV · MRV — RP Strength volume guidelines · per session</p>
    </motion.div>
  );
}
