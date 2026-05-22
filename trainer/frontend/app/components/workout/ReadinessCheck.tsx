"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Zap, Battery, AlertTriangle, X } from "lucide-react";
import { cn } from "@/app/lib/utils";

export type Readiness = "ready" | "tired" | "pain";

interface ReadinessOption {
  id: Readiness;
  label: string;
  subtitle: string;
  icon: typeof Zap;
  colorClass: string;
  bgClass: string;
  borderClass: string;
}

const OPTIONS: ReadinessOption[] = [
  {
    id: "ready",
    label: "Ready to train",
    subtitle: "Feeling strong — let's go",
    icon: Zap,
    colorClass: "text-trainer-success",
    bgClass: "bg-trainer-success/12",
    borderClass: "border-trainer-success/40",
  },
  {
    id: "tired",
    label: "Feeling tired",
    subtitle: "Lower intensity today",
    icon: Battery,
    colorClass: "text-trainer-warning",
    bgClass: "bg-trainer-warning/12",
    borderClass: "border-trainer-warning/40",
  },
  {
    id: "pain",
    label: "In pain / injured",
    subtitle: "Switch to physio rehab",
    icon: AlertTriangle,
    colorClass: "text-trainer-danger",
    bgClass: "bg-trainer-danger/12",
    borderClass: "border-trainer-danger/40",
  },
];

interface ReadinessCheckProps {
  open: boolean;
  dayName: string;
  onSelect: (r: Readiness) => void;
  onClose: () => void;
}

export function ReadinessCheck({ open, dayName, onSelect, onClose }: ReadinessCheckProps) {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          />
          <motion.div
            key="sheet"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 380, damping: 38 }}
            className="fixed bottom-0 inset-x-0 z-50 bg-trainer-elevated border-t border-white/10 rounded-t-[28px] pb-safe"
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-9 h-1 rounded-full bg-white/15" />
            </div>

            <div className="px-5 pt-3 pb-8">
              {/* Header */}
              <div className="flex items-start justify-between mb-6">
                <div>
                  <p className="text-xs text-white/40 font-semibold uppercase tracking-wider mb-1">
                    {greeting} · before you begin
                  </p>
                  <h2 className="text-lg font-bold text-white">How are you feeling?</h2>
                  <p className="text-sm text-white/40 mt-0.5">{dayName}</p>
                </div>
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-full bg-white/8 flex items-center justify-center text-white/40 hover:text-white transition-colors mt-1"
                >
                  <X size={15} />
                </button>
              </div>

              {/* Options */}
              <div className="flex flex-col gap-3">
                {OPTIONS.map((opt, i) => {
                  const Icon = opt.icon;
                  return (
                    <motion.button
                      key={opt.id}
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.07 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => onSelect(opt.id)}
                      className={cn(
                        "flex items-center gap-4 p-4 rounded-[16px] border text-left transition-all",
                        opt.bgClass,
                        opt.borderClass
                      )}
                    >
                      <div className={cn("w-10 h-10 rounded-[12px] flex items-center justify-center shrink-0", opt.bgClass)}>
                        <Icon size={20} className={opt.colorClass} />
                      </div>
                      <div className="flex-1">
                        <p className={cn("text-base font-bold", opt.colorClass)}>
                          {opt.label}
                        </p>
                        <p className="text-xs text-white/45 mt-0.5">{opt.subtitle}</p>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
