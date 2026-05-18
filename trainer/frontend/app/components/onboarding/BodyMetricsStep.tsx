"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Minus, Plus } from "lucide-react";
import { type ActivityLevel } from "@/app/types";
import { ftInToCm, cmToFtIn, lbsToKg, kgToLbs } from "@/app/lib/nutrition";
import { cn } from "@/app/lib/utils";

// ─── Data ─────────────────────────────────────────────────────────────────────

const ACTIVITY_OPTIONS: {
  value: ActivityLevel;
  label: string;
  desc: string;
}[] = [
  {
    value: "sedentary",
    label: "Sedentary",
    desc: "Desk job, little to no exercise",
  },
  {
    value: "light",
    label: "Lightly Active",
    desc: "Light exercise 1–3 days/week",
  },
  {
    value: "moderate",
    label: "Moderately Active",
    desc: "Exercise 3–5 days/week",
  },
  {
    value: "active",
    label: "Active",
    desc: "Hard exercise 6–7 days/week",
  },
  {
    value: "very-active",
    label: "Very Active",
    desc: "Physical job + daily training",
  },
];

// ─── Sub-components ────────────────────────────────────────────────────────────

function Stepper({
  label,
  value,
  unit,
  onDecrement,
  onIncrement,
  onChange,
  min = 0,
  max = 999,
  step = 1,
  rightSlot,
}: {
  label: string;
  value: number;
  unit: string;
  onDecrement: () => void;
  onIncrement: () => void;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  rightSlot?: React.ReactNode;
}) {
  return (
    <div className="bg-trainer-elevated border border-white/8 rounded-[14px] p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold text-white/40 uppercase tracking-widest">
          {label}
        </p>
        {rightSlot}
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onDecrement}
          className="w-11 h-11 rounded-[10px] bg-trainer-surface border border-white/10 flex items-center justify-center hover:border-white/25 active:scale-95 transition-all"
        >
          <Minus size={16} className="text-white/60" />
        </button>
        <div className="flex-1 text-center">
          <input
            type="number"
            value={value || ""}
            onChange={(e) => {
              const v = parseFloat(e.target.value);
              if (!isNaN(v) && v >= min && v <= max) onChange(v);
            }}
            className="bg-transparent text-white text-2xl font-bold text-center w-full outline-none tabular-nums"
            style={{ fontSize: "clamp(18px, 6vw, 28px)" }}
            min={min}
            max={max}
            step={step}
          />
          <p className="text-xs text-white/30 mt-0.5">{unit}</p>
        </div>
        <button
          type="button"
          onClick={onIncrement}
          className="w-11 h-11 rounded-[10px] bg-trainer-surface border border-white/10 flex items-center justify-center hover:border-white/25 active:scale-95 transition-all"
        >
          <Plus size={16} className="text-white/60" />
        </button>
      </div>
    </div>
  );
}

function UnitToggle({
  options,
  value,
  onChange,
}: {
  options: [string, string];
  value: 0 | 1;
  onChange: (v: 0 | 1) => void;
}) {
  return (
    <div className="flex gap-1 p-0.5 bg-trainer-surface rounded-[8px]">
      {options.map((opt, i) => (
        <button
          key={opt}
          type="button"
          onClick={() => onChange(i as 0 | 1)}
          className={cn(
            "px-2.5 py-1 rounded-[6px] text-[11px] font-bold transition-all duration-200",
            value === i
              ? "bg-trainer-indigo text-white"
              : "text-white/35 hover:text-white/60"
          )}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

// ─── Props ─────────────────────────────────────────────────────────────────────

export interface BodyMetrics {
  gender: "male" | "female" | "other";
  age: number;
  heightCm: number;
  weightKg: number;
  activityLevel: ActivityLevel;
}

interface BodyMetricsStepProps {
  value: Partial<BodyMetrics>;
  onChange: (metrics: Partial<BodyMetrics>) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function BodyMetricsStep({ value, onChange }: BodyMetricsStepProps) {
  const [heightUnit, setHeightUnit] = useState<0 | 1>(0); // 0=cm, 1=ft
  const [weightUnit, setWeightUnit] = useState<0 | 1>(0); // 0=kg, 1=lb

  const { feet, inches } = cmToFtIn(value.heightCm ?? 170);
  const [ftVal, setFtVal] = useState(feet);
  const [inVal, setInVal] = useState(inches);

  const displayWeightLb = Math.round(kgToLbs(value.weightKg ?? 70));

  const patch = (patch: Partial<BodyMetrics>) =>
    onChange({ ...value, ...patch });

  function handleHeightCm(cm: number) {
    const { feet: f, inches: i } = cmToFtIn(cm);
    setFtVal(f);
    setInVal(i);
    patch({ heightCm: cm });
  }

  function handleFtIn(ft: number, inches: number) {
    setFtVal(ft);
    setInVal(inches);
    patch({ heightCm: ftInToCm(ft, inches) });
  }

  function handleWeightKg(kg: number) {
    patch({ weightKg: kg });
  }

  function handleWeightLb(lb: number) {
    patch({ weightKg: lbsToKg(lb) });
  }

  const GENDERS: { value: "male" | "female" | "other"; label: string }[] = [
    { value: "male", label: "Male" },
    { value: "female", label: "Female" },
    { value: "other", label: "Other" },
  ];

  return (
    <div className="flex flex-col gap-4">
      {/* Gender */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0 }}
        className="bg-trainer-elevated border border-white/8 rounded-[14px] p-4"
      >
        <p className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-3">
          Biological Sex
        </p>
        <div className="flex gap-2">
          {GENDERS.map(({ value: gVal, label }) => (
            <button
              key={gVal}
              type="button"
              onClick={() => patch({ gender: gVal })}
              className={cn(
                "flex-1 py-2.5 rounded-[10px] text-sm font-semibold border transition-all duration-200",
                value.gender === gVal
                  ? "bg-trainer-indigo/15 border-trainer-indigo/40 text-white"
                  : "bg-trainer-surface border-white/8 text-white/45 hover:border-white/20"
              )}
            >
              {label}
            </button>
          ))}
        </div>
        <p className="text-[11px] text-white/25 mt-2 leading-relaxed">
          Used only for accurate metabolic calculations
        </p>
      </motion.div>

      {/* Age */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
      >
        <Stepper
          label="Age"
          value={value.age ?? 25}
          unit="years"
          min={13}
          max={99}
          onDecrement={() => patch({ age: Math.max(13, (value.age ?? 25) - 1) })}
          onIncrement={() => patch({ age: Math.min(99, (value.age ?? 25) + 1) })}
          onChange={(v) => patch({ age: v })}
        />
      </motion.div>

      {/* Height */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        {heightUnit === 0 ? (
          <Stepper
            label="Height"
            value={value.heightCm ?? 170}
            unit="cm"
            min={100}
            max={250}
            onDecrement={() => handleHeightCm(Math.max(100, (value.heightCm ?? 170) - 1))}
            onIncrement={() => handleHeightCm(Math.min(250, (value.heightCm ?? 170) + 1))}
            onChange={handleHeightCm}
            rightSlot={
              <UnitToggle
                options={["cm", "ft"]}
                value={heightUnit}
                onChange={setHeightUnit}
              />
            }
          />
        ) : (
          <div className="bg-trainer-elevated border border-white/8 rounded-[14px] p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-white/40 uppercase tracking-widest">
                Height
              </p>
              <UnitToggle
                options={["cm", "ft"]}
                value={heightUnit}
                onChange={setHeightUnit}
              />
            </div>
            <div className="flex gap-3">
              <div className="flex-1">
                <Stepper
                  label=""
                  value={ftVal}
                  unit="ft"
                  min={3}
                  max={8}
                  onDecrement={() => handleFtIn(Math.max(3, ftVal - 1), inVal)}
                  onIncrement={() => handleFtIn(Math.min(8, ftVal + 1), inVal)}
                  onChange={(v) => handleFtIn(v, inVal)}
                />
              </div>
              <div className="flex-1">
                <Stepper
                  label=""
                  value={inVal}
                  unit="in"
                  min={0}
                  max={11}
                  onDecrement={() => handleFtIn(ftVal, Math.max(0, inVal - 1))}
                  onIncrement={() => handleFtIn(ftVal, Math.min(11, inVal + 1))}
                  onChange={(v) => handleFtIn(ftVal, v)}
                />
              </div>
            </div>
          </div>
        )}
      </motion.div>

      {/* Weight */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        {weightUnit === 0 ? (
          <Stepper
            label="Weight"
            value={value.weightKg ?? 70}
            unit="kg"
            min={30}
            max={300}
            step={0.5}
            onDecrement={() => handleWeightKg(Math.max(30, (value.weightKg ?? 70) - 0.5))}
            onIncrement={() => handleWeightKg(Math.min(300, (value.weightKg ?? 70) + 0.5))}
            onChange={handleWeightKg}
            rightSlot={
              <UnitToggle
                options={["kg", "lb"]}
                value={weightUnit}
                onChange={setWeightUnit}
              />
            }
          />
        ) : (
          <Stepper
            label="Weight"
            value={displayWeightLb}
            unit="lb"
            min={66}
            max={660}
            onDecrement={() => handleWeightLb(Math.max(66, displayWeightLb - 1))}
            onIncrement={() => handleWeightLb(Math.min(660, displayWeightLb + 1))}
            onChange={handleWeightLb}
            rightSlot={
              <UnitToggle
                options={["kg", "lb"]}
                value={weightUnit}
                onChange={setWeightUnit}
              />
            }
          />
        )}
      </motion.div>

      {/* Activity Level */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-trainer-elevated border border-white/8 rounded-[14px] p-4"
      >
        <p className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-3">
          Activity Level
        </p>
        <div className="flex flex-col gap-1.5">
          {ACTIVITY_OPTIONS.map(({ value: aVal, label, desc }) => {
            const isSelected = value.activityLevel === aVal;
            return (
              <button
                key={aVal}
                type="button"
                onClick={() => patch({ activityLevel: aVal })}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-[10px] border text-left transition-all duration-150",
                  isSelected
                    ? "bg-trainer-indigo/12 border-trainer-indigo/35"
                    : "bg-trainer-surface border-white/8 hover:border-white/20"
                )}
              >
                <div
                  className={cn(
                    "w-3.5 h-3.5 rounded-full border-2 shrink-0 transition-all duration-200",
                    isSelected
                      ? "bg-trainer-indigo border-trainer-indigo"
                      : "border-white/25"
                  )}
                />
                <div className="flex-1 min-w-0">
                  <p
                    className={cn(
                      "text-sm font-semibold transition-colors",
                      isSelected ? "text-white" : "text-white/70"
                    )}
                  >
                    {label}
                  </p>
                  <p className="text-[11px] text-white/35 mt-0.5">{desc}</p>
                </div>
              </button>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}
