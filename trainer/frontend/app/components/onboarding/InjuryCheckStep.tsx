"use client";

import { motion } from "framer-motion";
import { CheckCircle2, Circle, ShieldCheck } from "lucide-react";
import { type UserInjury, type PhysioCondition } from "@/app/types";
import { cn } from "@/app/lib/utils";

interface InjuryOption {
  condition: PhysioCondition;
  label: string;
  region: string;
  icon: string;
}

const INJURY_OPTIONS: InjuryOption[] = [
  { condition: "rotator-cuff-strain",         label: "Shoulder pain / rotator cuff", region: "Shoulder", icon: "🫱" },
  { condition: "shoulder-impingement",         label: "Shoulder impingement",         region: "Shoulder", icon: "🫱" },
  { condition: "adhesive-capsulitis",          label: "Frozen shoulder",              region: "Shoulder", icon: "🫱" },
  { condition: "cervical-strain",              label: "Neck pain / strain",           region: "Neck",     icon: "🦮" },
  { condition: "l4-l5-disc-herniation",        label: "Lower back pain (L4/L5)",      region: "Back",     icon: "🦴" },
  { condition: "l5-s1-disc-herniation",        label: "Lower back pain (L5/S1)",      region: "Back",     icon: "🦴" },
  { condition: "patellofemoral-pain-syndrome", label: "Knee pain (runner's knee)",    region: "Knee",     icon: "🦵" },
  { condition: "it-band-syndrome",             label: "IT band syndrome",             region: "Knee",     icon: "🦵" },
  { condition: "proximal-hamstring-tendinopathy", label: "Hamstring tendinopathy",    region: "Hip",      icon: "🦵" },
  { condition: "achilles-tendinopathy",        label: "Achilles tendinopathy",        region: "Ankle",    icon: "🦶" },
  { condition: "plantar-fasciitis",            label: "Plantar fasciitis",            region: "Foot",     icon: "🦶" },
  { condition: "piriformis-syndrome",          label: "Hip / piriformis pain",        region: "Hip",      icon: "🍑" },
];

interface InjuryCheckStepProps {
  value: UserInjury[];
  onChange: (injuries: UserInjury[]) => void;
}

export function InjuryCheckStep({ value, onChange }: InjuryCheckStepProps) {
  const noInjuries = value.length === 0;

  function toggleCondition(opt: InjuryOption) {
    const exists = value.some((v) => v.condition === opt.condition);
    if (exists) {
      onChange(value.filter((v) => v.condition !== opt.condition));
    } else {
      const injury: UserInjury = {
        condition: opt.condition,
        bodyRegion: opt.region,
        severity: "mild",
        onsetDate: new Date().toISOString().split("T")[0],
        phase: "subacute",
      };
      onChange([...value, injury]);
    }
  }

  function handleNoInjuries() {
    onChange([]);
  }

  return (
    <div className="flex flex-col gap-3">
      {/* None option */}
      <motion.button
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        onClick={handleNoInjuries}
        className={cn(
          "flex items-center gap-3 p-4 rounded-[14px] border text-left transition-all",
          noInjuries
            ? "border-trainer-success/50 bg-trainer-success/8"
            : "border-white/10 bg-trainer-elevated hover:border-white/20"
        )}
      >
        <div className={cn(
          "w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0",
          noInjuries ? "bg-trainer-success/20" : "bg-white/6"
        )}>
          <ShieldCheck size={18} className={noInjuries ? "text-trainer-success" : "text-white/30"} />
        </div>
        <div className="flex-1">
          <p className={cn("text-sm font-semibold", noInjuries ? "text-trainer-success" : "text-white/80")}>
            No injuries — I&apos;m fully healthy
          </p>
          <p className="text-xs text-white/35 mt-0.5">Skip the physio module for now</p>
        </div>
        {noInjuries
          ? <CheckCircle2 size={18} className="text-trainer-success shrink-0" />
          : <Circle size={18} className="text-white/20 shrink-0" />
        }
      </motion.button>

      {/* Divider */}
      <div className="flex items-center gap-3 my-1">
        <div className="flex-1 h-px bg-white/8" />
        <span className="text-[11px] text-white/30 font-medium">or select conditions</span>
        <div className="flex-1 h-px bg-white/8" />
      </div>

      {/* Injury options */}
      <div className="flex flex-col gap-2">
        {INJURY_OPTIONS.map((opt, i) => {
          const selected = value.some((v) => v.condition === opt.condition);
          return (
            <motion.button
              key={opt.condition}
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.05 + i * 0.03 }}
              onClick={() => toggleCondition(opt)}
              className={cn(
                "flex items-center gap-3 p-3.5 rounded-[12px] border text-left transition-all",
                selected
                  ? "border-trainer-warning/50 bg-trainer-warning/8"
                  : "border-white/8 bg-trainer-elevated hover:border-white/18"
              )}
            >
              <span className="text-base leading-none shrink-0">{opt.icon}</span>
              <div className="flex-1 min-w-0">
                <p className={cn("text-sm font-medium truncate", selected ? "text-white" : "text-white/70")}>
                  {opt.label}
                </p>
                <p className="text-[10px] text-white/30 mt-0.5">{opt.region}</p>
              </div>
              {selected
                ? <CheckCircle2 size={16} className="text-trainer-warning shrink-0" />
                : <Circle size={16} className="text-white/15 shrink-0" />
              }
            </motion.button>
          );
        })}
      </div>

      {value.length > 0 && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-xs text-white/40 text-center mt-1"
        >
          {value.length} condition{value.length !== 1 ? "s" : ""} selected · we&apos;ll build a rehab protocol for each
        </motion.p>
      )}
    </div>
  );
}
