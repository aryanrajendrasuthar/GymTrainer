"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check } from "lucide-react";
import { useUserStore } from "@/app/store/userStore";
import { useSettingsStore } from "@/app/store/settingsStore";
import { calculateNutritionTargets } from "@/app/lib/nutrition";
import { authApi } from "@/app/lib/api";
import { cn } from "@/app/lib/utils";
import type { ActivityLevel } from "@/app/types";

interface ProfileEditSheetProps {
  open: boolean;
  onClose: () => void;
}

const ACTIVITY_OPTIONS: { value: ActivityLevel; label: string; sub: string }[] = [
  { value: "sedentary",    label: "Sedentary",    sub: "Desk job, little exercise" },
  { value: "light",        label: "Light",        sub: "1–3 workouts/week" },
  { value: "moderate",     label: "Moderate",     sub: "3–5 workouts/week" },
  { value: "active",       label: "Active",       sub: "6–7 workouts/week" },
  { value: "very-active",  label: "Very Active",  sub: "2× daily or physical job" },
];

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-xs text-white/40 mb-1.5 font-medium uppercase tracking-wide">{children}</p>;
}

function NumericField({
  label,
  value,
  unit,
  min,
  max,
  step = 1,
  onChange,
}: {
  label: string;
  value: number;
  unit: string;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
}) {
  const [raw, setRaw] = useState(() => (value ? String(value) : ""));

  useEffect(() => {
    setRaw(value ? String(value) : "");
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const s = e.target.value;
    setRaw(s);
    const v = parseFloat(s);
    if (!isNaN(v) && v >= min && v <= max) onChange(v);
  };

  const handleBlur = () => {
    const v = parseFloat(raw);
    if (isNaN(v) || raw === "") {
      setRaw(value ? String(value) : "");
    } else {
      const clamped = Math.min(max, Math.max(min, v));
      setRaw(String(clamped));
      if (clamped !== value) onChange(clamped);
    }
  };

  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <div className="flex items-center gap-3">
        <input
          type="number"
          value={raw}
          onChange={handleChange}
          onBlur={handleBlur}
          min={min}
          max={max}
          step={step}
          className="flex-1 bg-trainer-elevated border border-white/10 rounded-[10px] px-3 py-2.5 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-trainer-indigo/50 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
          style={{ fontSize: "16px" }}
        />
        <span className="text-sm text-white/35 w-8 shrink-0">{unit}</span>
      </div>
    </div>
  );
}

export function ProfileEditSheet({ open, onClose }: ProfileEditSheetProps) {
  const { profile, updateProfile, accessToken } = useUserStore();
  const { settings } = useSettingsStore();
  const unit = (settings.weightUnit ?? profile?.units ?? "kg") as "kg" | "lb";

  const [name,        setName]        = useState(profile?.name ?? "");
  const [age,         setAge]         = useState(profile?.age ?? 25);
  const [gender,      setGender]      = useState<"male" | "female" | "other">(profile?.gender ?? "male");
  const [heightCm,    setHeightCm]    = useState(profile?.heightCm ?? 170);
  const [weightKg,    setWeightKg]    = useState(
    unit === "lb"
      ? Math.round((profile?.weightKg ?? 70) * 2.20462 * 10) / 10
      : (profile?.weightKg ?? 70)
  );
  const [bodyFat,     setBodyFat]     = useState(profile?.bodyFatPercent ?? 0);
  const [activity,    setActivity]    = useState<ActivityLevel>(profile?.activityLevel ?? "moderate");
  const [saving,      setSaving]      = useState(false);
  const [saved,       setSaved]       = useState(false);

  function handleSave() {
    setSaving(true);
    const weightKgNorm = unit === "lb" ? weightKg / 2.20462 : weightKg;
    const rounded = Math.round(weightKgNorm * 10) / 10;

    const nutritionTargets = profile?.goal
      ? calculateNutritionTargets(rounded, heightCm, age, gender, activity, profile.goal)
      : profile?.nutritionTargets;

    updateProfile({
      name,
      age,
      gender,
      heightCm,
      weightKg: rounded,
      ...(bodyFat > 0 ? { bodyFatPercent: bodyFat } : {}),
      activityLevel: activity,
      ...(nutritionTargets ? { nutritionTargets } : {}),
    });

    if (accessToken) {
      authApi.updateProfile(accessToken, {
        age,
        gender,
        height_cm: heightCm,
        weight_kg: rounded,
        activity_level: activity,
      }).catch(() => {});
    }

    setSaving(false);
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 900);
  }

  const hasChanges =
    name !== (profile?.name ?? "") ||
    age !== (profile?.age ?? 25) ||
    gender !== (profile?.gender ?? "male") ||
    heightCm !== (profile?.heightCm ?? 170) ||
    activity !== (profile?.activityLevel ?? "moderate") ||
    weightKg !== (unit === "lb"
      ? Math.round((profile?.weightKg ?? 70) * 2.20462 * 10) / 10
      : (profile?.weightKg ?? 70)
    );

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ type: "spring", stiffness: 380, damping: 42 }}
          className="fixed inset-0 z-50 bg-trainer-elevated flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 pt-12 pb-4 border-b border-white/8 shrink-0">
            <div className="flex items-center gap-2">
              <p className="text-base font-bold text-white">Edit Profile</p>
              {hasChanges && (
                <span className="text-[10px] font-bold text-amber-400/70 bg-amber-400/8 border border-amber-400/20 px-1.5 py-0.5 rounded-full">
                  unsaved
                </span>
              )}
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/8 flex items-center justify-center text-white/50 hover:text-white"
            >
              <X size={15} />
            </button>
          </div>

          {/* Scrollable content */}
          <div className="overflow-y-auto flex-1 px-5 py-5 flex flex-col gap-5 pb-cta">
            {/* Name */}
            <div>
              <FieldLabel>Name</FieldLabel>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-trainer-elevated border border-white/10 rounded-[10px] px-3 py-2.5 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-trainer-indigo/50"
                style={{ fontSize: "16px" }}
                placeholder="Your name"
              />
            </div>

            {/* Gender */}
            <div>
              <FieldLabel>Biological Sex</FieldLabel>
              <div className="flex gap-2">
                {(["male", "female", "other"] as const).map((g) => (
                  <button
                    key={g}
                    onClick={() => setGender(g)}
                    className={cn(
                      "flex-1 py-2.5 rounded-[10px] text-sm font-semibold capitalize transition-all",
                      gender === g
                        ? "bg-trainer-indigo text-white"
                        : "bg-trainer-surface border border-white/10 text-white/40 hover:text-white"
                    )}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>

            {/* Age + Height */}
            <div className="grid grid-cols-2 gap-4">
              <NumericField label="Age" value={age} unit="yrs" min={13} max={100} onChange={setAge} />
              <NumericField label="Height" value={heightCm} unit="cm" min={100} max={250} onChange={setHeightCm} />
            </div>

            {/* Weight */}
            <NumericField
              label={`Body Weight`}
              value={weightKg}
              unit={unit}
              min={unit === "lb" ? 44 : 20}
              max={unit === "lb" ? 880 : 400}
              step={unit === "lb" ? 0.5 : 0.1}
              onChange={setWeightKg}
            />

            {/* Live BMI */}
            {(() => {
              const kgNorm = unit === "lb" ? weightKg / 2.20462 : weightKg;
              const bmi = heightCm > 0 ? Math.round((kgNorm / ((heightCm / 100) ** 2)) * 10) / 10 : 0;
              if (bmi <= 0) return null;
              const label = bmi < 18.5 ? "Underweight" : bmi < 25 ? "Normal" : bmi < 30 ? "Overweight" : "Obese";
              const color = bmi < 18.5 ? "text-sky-400 bg-sky-400/8 border-sky-400/20"
                : bmi < 25 ? "text-trainer-success bg-trainer-success/8 border-trainer-success/20"
                : bmi < 30 ? "text-amber-400 bg-amber-400/8 border-amber-400/20"
                : "text-red-400 bg-red-400/8 border-red-400/20";
              return (
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-white/25">BMI:</span>
                  <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border tabular-nums", color)}>
                    {bmi} — {label}
                  </span>
                </div>
              );
            })()}

            {/* Body fat */}
            <NumericField
              label="Body Fat % (optional)"
              value={bodyFat}
              unit="%"
              min={0}
              max={60}
              step={0.5}
              onChange={setBodyFat}
            />

            {/* Activity level */}
            <div>
              <FieldLabel>Activity Level</FieldLabel>
              <div className="flex flex-col gap-1.5">
                {ACTIVITY_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setActivity(opt.value)}
                    className={cn(
                      "flex items-center gap-3 px-3 py-3 rounded-[12px] text-left transition-all",
                      activity === opt.value
                        ? "bg-trainer-indigo/15 border border-trainer-indigo/30"
                        : "bg-trainer-surface border border-white/8"
                    )}
                  >
                    <div className={cn(
                      "w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center",
                      activity === opt.value ? "border-trainer-indigo" : "border-white/20"
                    )}>
                      {activity === opt.value && (
                        <div className="w-2 h-2 rounded-full bg-trainer-indigo" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white/85">{opt.label}</p>
                      <p className="text-[11px] text-white/35">{opt.sub}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <p className="text-[11px] text-white/25 text-center leading-relaxed">
              Saving recalculates your calorie and macro targets.
            </p>

            <button
              onClick={handleSave}
              disabled={saving || !hasChanges}
              className={cn(
                "w-full py-3.5 rounded-[14px] text-sm font-bold flex items-center justify-center gap-2 transition-all",
                saved
                  ? "bg-trainer-success text-white"
                  : hasChanges
                  ? "bg-trainer-indigo text-white active:bg-trainer-indigo/80"
                  : "bg-white/8 text-white/25 cursor-not-allowed"
              )}
            >
              {saved ? (
                <><Check size={16} /> Saved</>
              ) : (
                "Save Changes"
              )}
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
