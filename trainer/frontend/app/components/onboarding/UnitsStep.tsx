"use client";

import { motion } from "framer-motion";
import { Scale, Ruler } from "lucide-react";
import { cn } from "@/app/lib/utils";

interface UnitsStepProps {
  value: "kg" | "lb" | null;
  onChange: (unit: "kg" | "lb") => void;
}

const OPTIONS = [
  {
    id: "kg" as const,
    label: "Kilograms",
    sublabel: "kg — used in most countries",
    icon: Scale,
    example: "Bench press: 80 kg",
  },
  {
    id: "lb" as const,
    label: "Pounds",
    sublabel: "lb — used in the US & UK",
    icon: Ruler,
    example: "Bench press: 176 lb",
  },
];

export function UnitsStep({ value, onChange }: UnitsStepProps) {
  return (
    <div className="flex flex-col gap-3">
      {OPTIONS.map((opt, i) => {
        const Icon = opt.icon;
        const selected = value === opt.id;
        return (
          <motion.button
            key={opt.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => onChange(opt.id)}
            className={cn(
              "flex items-center gap-4 p-5 rounded-[16px] border text-left transition-all",
              selected
                ? "border-trainer-indigo/60 bg-trainer-indigo/8"
                : "border-white/10 bg-trainer-elevated hover:border-white/20"
            )}
          >
            <div className={cn(
              "w-12 h-12 rounded-[13px] flex items-center justify-center shrink-0",
              selected ? "bg-trainer-indigo/20" : "bg-white/6"
            )}>
              <Icon size={22} className={selected ? "text-trainer-indigo" : "text-white/35"} />
            </div>
            <div className="flex-1">
              <p className={cn("text-base font-bold", selected ? "text-white" : "text-white/70")}>
                {opt.label}
              </p>
              <p className="text-sm text-white/40 mt-0.5">{opt.sublabel}</p>
              <p className={cn(
                "text-xs mt-2 font-mono px-2 py-0.5 rounded-[6px] inline-block",
                selected ? "text-trainer-indigo bg-trainer-indigo/10" : "text-white/25 bg-white/4"
              )}>
                {opt.example}
              </p>
            </div>
            <div className={cn(
              "w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center",
              selected ? "border-trainer-indigo bg-trainer-indigo" : "border-white/20"
            )}>
              {selected && <div className="w-2 h-2 rounded-full bg-white" />}
            </div>
          </motion.button>
        );
      })}
    </div>
  );
}
