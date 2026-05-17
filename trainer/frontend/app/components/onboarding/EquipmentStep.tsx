"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { type Equipment } from "@/app/types";
import { cn } from "@/app/lib/utils";

const EQUIPMENT_GROUPS: { label: string; items: { value: Equipment; label: string }[] }[] = [
  {
    label: "Gym Equipment",
    items: [
      { value: "barbell", label: "Barbell" },
      { value: "dumbbell", label: "Dumbbells" },
      { value: "cable", label: "Cable Machine" },
      { value: "machine", label: "Machines" },
      { value: "bench", label: "Bench" },
      { value: "ez-bar", label: "EZ Bar" },
    ],
  },
  {
    label: "Bodyweight & Bars",
    items: [
      { value: "bodyweight", label: "Bodyweight" },
      { value: "pull-up-bar", label: "Pull-up Bar" },
      { value: "dip-bars", label: "Dip Bars" },
    ],
  },
  {
    label: "Home & Accessories",
    items: [
      { value: "resistance-band", label: "Resistance Bands" },
      { value: "kettlebell", label: "Kettlebell" },
      { value: "foam-roller", label: "Foam Roller" },
      { value: "trx", label: "TRX / Suspension" },
    ],
  },
];

interface EquipmentStepProps {
  value: Equipment[];
  onChange: (equipment: Equipment[]) => void;
}

export function EquipmentStep({ value, onChange }: EquipmentStepProps) {
  const toggle = (eq: Equipment) => {
    if (value.includes(eq)) {
      onChange(value.filter((e) => e !== eq));
    } else {
      onChange([...value, eq]);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {EQUIPMENT_GROUPS.map((group, gi) => (
        <div key={group.label}>
          <p className="text-[11px] font-semibold text-white/35 uppercase tracking-widest mb-3">
            {group.label}
          </p>
          <div className="grid grid-cols-2 gap-2">
            {group.items.map(({ value: eqValue, label }, i) => {
              const isSelected = value.includes(eqValue);
              return (
                <motion.button
                  key={eqValue}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: (gi * 4 + i) * 0.04, duration: 0.25 }}
                  onClick={() => toggle(eqValue)}
                  className={cn(
                    "flex items-center gap-2.5 p-3 rounded-[10px] border text-left",
                    "transition-all duration-200",
                    isSelected
                      ? "bg-trainer-indigo/15 border-trainer-indigo/70 text-white"
                      : "bg-trainer-elevated border-white/10 text-white/60 hover:border-white/25 hover:text-white"
                  )}
                >
                  <div
                    className={cn(
                      "w-4 h-4 rounded-[4px] border-2 flex items-center justify-center shrink-0 transition-all duration-200",
                      isSelected
                        ? "bg-trainer-indigo border-trainer-indigo"
                        : "border-white/25"
                    )}
                  >
                    {isSelected && <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />}
                  </div>
                  <span className="text-sm font-medium leading-tight">{label}</span>
                </motion.button>
              );
            })}
          </div>
        </div>
      ))}
      {value.length === 0 && (
        <p className="text-xs text-white/35 text-center pt-1">
          Select all equipment you have access to
        </p>
      )}
      {value.length > 0 && (
        <p className="text-xs text-trainer-indigo/80 text-center pt-1">
          {value.length} item{value.length !== 1 ? "s" : ""} selected
        </p>
      )}
    </div>
  );
}
