"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Scale, X, ChevronRight } from "lucide-react";
import Link from "next/link";

interface WeightNudgeBannerProps {
  trackedKg: number;
  profileKg: number;
  unit: "kg" | "lb";
}

function fmt(kg: number, unit: "kg" | "lb"): string {
  if (unit === "lb") return `${Math.round(kg * 2.20462)} lb`;
  return `${kg.toFixed(1)} kg`;
}

export function WeightNudgeBanner({ trackedKg, profileKg, unit }: WeightNudgeBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  const diffKg = Math.abs(trackedKg - profileKg);
  const direction = trackedKg < profileKg ? "lost" : "gained";

  if (dismissed || diffKg < 2) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -6 }}
        className="flex items-center gap-3 p-4 rounded-[14px] bg-amber-400/8 border border-amber-400/20"
      >
        <div className="w-9 h-9 rounded-[10px] bg-amber-400/15 flex items-center justify-center shrink-0">
          <Scale size={16} className="text-amber-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white leading-tight">
            You&apos;ve {direction}{" "}
            {fmt(diffKg, unit)}
            <span className="text-amber-400/60 font-normal text-xs ml-1">
              ({profileKg > 0 ? `${((diffKg / profileKg) * 100).toFixed(1)}%` : ""})
            </span>
            {" "}since your profile
          </p>
          <p className="text-xs text-white/40 mt-0.5">
            {fmt(trackedKg, unit)} tracked vs {fmt(profileKg, unit)} on profile — update to recalibrate targets
          </p>
        </div>
        <Link
          href="/settings"
          className="shrink-0 text-xs font-bold text-amber-400 px-2.5 py-1.5 rounded-[8px] bg-amber-400/12 hover:bg-amber-400/20 transition-colors"
        >
          Update
        </Link>
        <button
          onClick={() => setDismissed(true)}
          className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center text-white/25 hover:text-white/50 transition-colors shrink-0"
        >
          <X size={11} />
        </button>
      </motion.div>
    </AnimatePresence>
  );
}
