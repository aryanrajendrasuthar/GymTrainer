"use client";

import { motion } from "framer-motion";
import {
  Target,
  Dumbbell,
  Flame,
  Beef,
  Wheat,
  Droplets,
  Calendar,
  TrendingUp,
  CheckCircle2,
} from "lucide-react";
import { type FitnessGoal, type NutritionTargets, type WorkoutSplit } from "@/app/types";
import { cn } from "@/app/lib/utils";

interface PlanSummaryStepProps {
  goal: FitnessGoal;
  split: WorkoutSplit | null;
  nutritionTargets: NutritionTargets | null;
  unit: "kg" | "lb";
  name?: string;
}

const GOAL_META: Record<
  FitnessGoal,
  { label: string; color: string; bg: string; border: string; timeline: string; milestones: string[] }
> = {
  "muscle-gain": {
    label: "Build Muscle & Size",
    color: "text-trainer-indigo",
    bg: "bg-trainer-indigo/10",
    border: "border-trainer-indigo/25",
    timeline: "0.5–1 kg of lean muscle per month",
    milestones: [
      "Week 2 — Strength baseline established",
      "Week 4 — Noticeable pump and endurance gains",
      "Week 8 — Visible size increase in key muscle groups",
      "Week 12 — Reassess: increase volume or switch to advanced programme",
    ],
  },
  "fat-loss": {
    label: "Lose Fat",
    color: "text-orange-400",
    bg: "bg-orange-400/10",
    border: "border-orange-400/25",
    timeline: "0.5–1 kg of fat per week",
    milestones: [
      "Week 2 — Metabolism adapting, energy improving",
      "Week 4 — Visible waist reduction (2–4 cm)",
      "Week 8 — Significant body composition change",
      "Week 12 — Reassess: transition to recomp or maintenance",
    ],
  },
  recomp: {
    label: "Body Recomposition",
    color: "text-emerald-400",
    bg: "bg-emerald-400/10",
    border: "border-emerald-400/25",
    timeline: "Gradual fat loss + muscle gain simultaneously",
    milestones: [
      "Week 2 — Strength and energy adapting",
      "Week 4 — Body composition shifts starting",
      "Week 8 — Definition noticeably improving",
      "Week 12 — Reassess measurements and adjust macros",
    ],
  },
  strength: {
    label: "Get Stronger",
    color: "text-red-400",
    bg: "bg-red-400/10",
    border: "border-red-400/25",
    timeline: "20–30% increase in main lifts",
    milestones: [
      "Week 2 — Neural adaptation phase (strength surges)",
      "Week 4 — PR on at least one main lift",
      "Week 8 — Consistent progressive overload achieved",
      "Week 12 — Reassess maxes and programme to next phase",
    ],
  },
  "greek-god": {
    label: "Greek God Physique",
    color: "text-trainer-gold",
    bg: "bg-trainer-gold/10",
    border: "border-trainer-gold/25",
    timeline: "Aesthetic muscle + low body fat in 12+ weeks",
    milestones: [
      "Week 2 — Posture and shoulder width improving",
      "Week 4 — V-taper becoming visible",
      "Week 8 — Definition in shoulders, chest, arms",
      "Week 12 — Reassess body fat and switch to cut or maintain",
    ],
  },
  calisthenics: {
    label: "Calisthenics & Skills",
    color: "text-cyan-400",
    bg: "bg-cyan-400/10",
    border: "border-cyan-400/25",
    timeline: "Master foundational skills in 8–12 weeks",
    milestones: [
      "Week 2 — Core and scapular stability established",
      "Week 4 — First muscle-up or L-sit hold",
      "Week 8 — Consistent skill reps achieved",
      "Week 12 — Progress to advanced skill work",
    ],
  },
  "general-fitness": {
    label: "General Fitness",
    color: "text-sky-400",
    bg: "bg-sky-400/10",
    border: "border-sky-400/25",
    timeline: "Major fitness improvement in 6–8 weeks",
    milestones: [
      "Week 2 — Soreness reducing, routine forming",
      "Week 4 — Energy and sleep noticeably better",
      "Week 8 — Full-body strength and conditioning improved",
      "Week 12 — Reassess goals and choose a specialisation",
    ],
  },
};

const DAY_ABBR = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function reassessDate(): string {
  const d = new Date();
  d.setDate(d.getDate() + 28);
  return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

export function PlanSummaryStep({
  goal,
  split,
  nutritionTargets,
  unit,
  name,
}: PlanSummaryStepProps) {
  const meta = GOAL_META[goal];

  return (
    <div className="flex flex-col gap-5">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className={cn("rounded-[16px] border p-4", meta.bg, meta.border)}
      >
        <div className="flex items-center gap-2.5 mb-1">
          <Target size={16} className={meta.color} />
          <p className="text-xs font-semibold text-white/50 uppercase tracking-widest">Your Goal</p>
        </div>
        <p className={cn("text-lg font-bold", meta.color)}>{meta.label}</p>
        <p className="text-xs text-white/45 mt-1">Expected progress: {meta.timeline}</p>
      </motion.div>

      {/* Split schedule */}
      {split && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-trainer-surface border border-white/8 rounded-[16px] p-4"
        >
          <div className="flex items-center gap-2 mb-3">
            <Dumbbell size={14} className="text-trainer-indigo" />
            <p className="text-xs font-semibold text-white/50 uppercase tracking-widest">
              Your Split
            </p>
          </div>
          <p className="text-sm font-bold text-white mb-3">{split.name}</p>
          <div className="grid grid-cols-7 gap-1">
            {split.days.map((day, i) => (
              <div key={i} className="flex flex-col items-center gap-1">
                <p className="text-[9px] text-white/30 font-medium">{DAY_ABBR[i] ?? `D${i + 1}`}</p>
                <div
                  className={cn(
                    "w-8 h-8 rounded-[8px] flex items-center justify-center",
                    day.isRestDay
                      ? "bg-white/4 border border-white/8"
                      : "bg-trainer-indigo/20 border border-trainer-indigo/35"
                  )}
                >
                  {day.isRestDay ? (
                    <span className="text-[8px] text-white/20 font-bold">REST</span>
                  ) : (
                    <Dumbbell size={10} className="text-trainer-indigo" />
                  )}
                </div>
                <p className="text-[7px] text-white/25 text-center leading-tight line-clamp-2 max-w-[32px]">
                  {day.isRestDay ? "" : day.dayName.split(" ")[0]}
                </p>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Nutrition */}
      {nutritionTargets && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-trainer-surface border border-white/8 rounded-[16px] p-4"
        >
          <div className="flex items-center gap-2 mb-3">
            <Flame size={14} className="text-orange-400" />
            <p className="text-xs font-semibold text-white/50 uppercase tracking-widest">
              Daily Nutrition Targets
            </p>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {[
              { icon: Flame, label: "Calories", value: `${nutritionTargets.dailyCalories}`, unit: "kcal", color: "text-orange-400" },
              { icon: Beef, label: "Protein", value: `${nutritionTargets.proteinG}g`, unit: "", color: "text-red-400" },
              { icon: Wheat, label: "Carbs", value: `${nutritionTargets.carbsG}g`, unit: "", color: "text-amber-400" },
              { icon: Droplets, label: "Fat", value: `${nutritionTargets.fatG}g`, unit: "", color: "text-blue-400" },
            ].map(({ icon: Icon, label, value, color }) => (
              <div key={label} className="bg-white/4 rounded-[10px] p-2.5 text-center">
                <Icon size={12} className={cn("mx-auto mb-1", color)} />
                <p className="text-sm font-bold text-white">{value}</p>
                <p className="text-[9px] text-white/35 mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* 12-week timeline */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-trainer-surface border border-white/8 rounded-[16px] p-4"
      >
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp size={14} className="text-trainer-indigo" />
          <p className="text-xs font-semibold text-white/50 uppercase tracking-widest">
            12-Week Roadmap
          </p>
        </div>
        <div className="space-y-2.5">
          {meta.milestones.map((m, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.25 + i * 0.06 }}
              className="flex items-start gap-2.5"
            >
              <CheckCircle2 size={13} className="text-trainer-indigo/60 mt-0.5 shrink-0" />
              <p className="text-xs text-white/55 leading-relaxed">{m}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Reassessment date */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="flex items-center gap-3 bg-white/4 border border-white/8 rounded-[14px] px-4 py-3"
      >
        <Calendar size={14} className="text-white/40 shrink-0" />
        <div>
          <p className="text-xs text-white/35">First check-in scheduled</p>
          <p className="text-sm font-semibold text-white">{reassessDate()}</p>
        </div>
      </motion.div>
    </div>
  );
}
