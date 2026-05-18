"use client";

import { useState } from "react";
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
  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <div className="flex items-center gap-3">
        <input
          type="number"
          value={value || ""}
          onChange={(e) => {
            const v = parseFloat(e.target.value);
            if (!isNaN(v) && v >= min && v <= max) onChange(v);
          }}
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
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 z-40"
          />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 340, damping: 38 }}
            className="fixed bottom-0 inset-x-0 z-50 bg-trainer-elevated border-t border-white/10 rounded-t-[28px] flex flex-col max-h-[92vh]"
          >
            {/* Handle */}
            <div className="flex-shrink-0 flex flex-col items-center pt-4 pb-2">
              <div className="w-10 h-1 bg-white/15 rounded-full" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-white/8 shrink-0">
              <p className="text-base font-bold text-white">Edit Profile</p>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-white/8 flex items-center justify-center text-white/50 hover:text-white"
              >
                <X size={15} />
              </button>
            </div>

            {/* Scrollable content */}
            <div className="overflow-y-auto flex-1 px-5 py-5 flex flex-col gap-5">
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
            </div>

            {/* Save button */}
            <div className="shrink-0 px-5 pb-10 pt-3 border-t border-white/8">
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
        </>
      )}
    </AnimatePresence>
  );
}
