"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Circle, ChevronDown, ChevronUp, FlaskConical } from "lucide-react";
import { useSupplementStore } from "@/app/store/supplementStore";
import { cn } from "@/app/lib/utils";

export function SupplementCard() {
  const { supplements, toggleSupplementEnabled, markTaken, markNotTaken, getTodayTaken } =
    useSupplementStore();
  const [expanded, setExpanded] = useState(false);

  const enabled = supplements.filter((s) => s.enabled);
  const todayTaken = getTodayTaken();
  const takenCount = enabled.filter((s) => todayTaken.includes(s.id)).length;
  const total = enabled.length;
  const allDone = total > 0 && takenCount === total;

  if (total === 0) return null;

  const R = 10;
  const circ = 2 * Math.PI * R;
  const pct = total > 0 ? takenCount / total : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.09 }}
      className="bg-trainer-surface border border-white/8 rounded-[18px] overflow-hidden"
    >
      {/* Header */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center gap-3 px-4 py-3.5 text-left"
      >
        {/* Ring */}
        <div className="relative w-9 h-9 shrink-0">
          <svg width="36" height="36" className="-rotate-90">
            <circle cx="18" cy="18" r={R} strokeWidth="2.5" stroke="rgba(255,255,255,0.07)" fill="none" />
            <motion.circle
              cx="18" cy="18" r={R}
              strokeWidth="2.5"
              stroke={allDone ? "#4ade80" : "#38bdf8"}
              fill="none"
              strokeLinecap="round"
              strokeDasharray={circ}
              animate={{ strokeDashoffset: circ * (1 - pct) }}
              transition={{ duration: 0.45, ease: "easeOut" }}
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-white/50">
            {takenCount}/{total}
          </span>
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-white">Supplements</p>
          <p className="text-[11px] text-white/35 mt-0.5">
            {allDone ? "All taken today ✓" : `${total - takenCount} remaining`}
          </p>
        </div>
        {expanded
          ? <ChevronUp size={14} className="text-white/30 shrink-0" />
          : <ChevronDown size={14} className="text-white/30 shrink-0" />}
      </button>

      {/* Supplement pills */}
      <div className="px-4 pb-3 flex flex-col gap-1.5">
        {enabled.map((supp) => {
          const taken = todayTaken.includes(supp.id);
          return (
            <motion.button
              key={supp.id}
              whileTap={{ scale: 0.98 }}
              onClick={() => (taken ? markNotTaken(supp.id) : markTaken(supp.id))}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-[12px] border transition-all w-full text-left",
                taken
                  ? "bg-trainer-success/10 border-trainer-success/25"
                  : "bg-white/4 border-white/8 hover:border-white/15"
              )}
            >
              <span className="text-lg leading-none shrink-0">{supp.emoji}</span>
              <div className="flex-1 min-w-0">
                <p className={cn("text-sm font-semibold leading-none", taken ? "text-trainer-success" : "text-white/80")}>
                  {supp.name}
                </p>
                <p className="text-[10px] text-white/30 mt-0.5">{supp.dose} · {supp.timing}</p>
              </div>
              {taken
                ? <CheckCircle2 size={15} className="text-trainer-success shrink-0" />
                : <Circle size={15} className="text-white/20 shrink-0" />}
            </motion.button>
          );
        })}
      </div>

      {/* Expanded: configure which supplements are on */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden border-t border-white/5"
          >
            <div className="px-4 pt-3 pb-4">
              <div className="flex items-center gap-1.5 mb-3">
                <FlaskConical size={11} className="text-white/30" />
                <p className="text-[10px] text-white/30 uppercase tracking-widest font-semibold">
                  Configure stack
                </p>
              </div>
              <div className="flex flex-col gap-2">
                {supplements.map((supp) => (
                  <button
                    key={supp.id}
                    onClick={() => toggleSupplementEnabled(supp.id)}
                    className="flex items-center gap-3 p-2.5 rounded-[10px] bg-trainer-elevated hover:bg-white/6 transition-colors"
                  >
                    <span className="text-base leading-none">{supp.emoji}</span>
                    <div className="flex-1 text-left">
                      <p className="text-sm text-white/75">{supp.name}</p>
                      <p className="text-[10px] text-white/30">{supp.dose} · {supp.timing}</p>
                    </div>
                    <div className={cn(
                      "w-8 h-4 rounded-full transition-all relative shrink-0",
                      supp.enabled ? "bg-sky-500" : "bg-white/12"
                    )}>
                      <motion.div
                        className="absolute top-0.5 w-3 h-3 rounded-full bg-white shadow"
                        animate={{ left: supp.enabled ? "calc(100% - 14px)" : "2px" }}
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
