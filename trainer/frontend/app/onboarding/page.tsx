"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ChevronRight, Sparkles } from "lucide-react";
import { useUserStore } from "@/app/store/userStore";
import { authApi } from "@/app/lib/api";
import { calculateNutritionTargets } from "@/app/lib/nutrition";
import { Button } from "@/app/components/ui/Button";
import { GoalStep } from "@/app/components/onboarding/GoalStep";
import { BodyMetricsStep, type BodyMetrics } from "@/app/components/onboarding/BodyMetricsStep";
import { FitnessLevelStep } from "@/app/components/onboarding/FitnessLevelStep";
import { EquipmentStep } from "@/app/components/onboarding/EquipmentStep";
import { SplitStep } from "@/app/components/onboarding/SplitStep";
import { InjuryCheckStep } from "@/app/components/onboarding/InjuryCheckStep";
import { UnitsStep } from "@/app/components/onboarding/UnitsStep";
import { NotificationsStep, type NotificationPrefs } from "@/app/components/onboarding/NotificationsStep";
import { PlanSummaryStep } from "@/app/components/onboarding/PlanSummaryStep";
import { type Equipment, type FitnessGoal, type FitnessLevel, type UserInjury } from "@/app/types";
import { getSplitById } from "@/app/data/splits";
import { usePhysioStore } from "@/app/store/physioStore";
import { useSettingsStore } from "@/app/store/settingsStore";
import { cn } from "@/app/lib/utils";
import { GymBackground } from "@/app/components/ui/GymBackground";

const STEPS = [
  {
    id: "goal",
    title: "What's your main goal?",
    subtitle: "Your training will be tailored around this.",
  },
  {
    id: "metrics",
    title: "Your body stats",
    subtitle: "Used to calculate your personalised calorie and macro targets.",
  },
  {
    id: "level",
    title: "How experienced are you?",
    subtitle: "This shapes your exercise selection and progressions.",
  },
  {
    id: "equipment",
    title: "What equipment do you have?",
    subtitle: "Select everything you have regular access to.",
  },
  {
    id: "split",
    title: "Choose your training split",
    subtitle: "You can always change this later in Settings.",
  },
  {
    id: "injuries",
    title: "Any injuries or conditions?",
    subtitle: "We'll build a personalised rehab protocol for each one.",
  },
  {
    id: "units",
    title: "Which weight unit do you prefer?",
    subtitle: "You can change this anytime in Settings.",
  },
  {
    id: "notifications",
    title: "Stay on track",
    subtitle: "Choose which reminders to enable.",
  },
  {
    id: "summary",
    title: "Your plan is ready",
    subtitle: "Here's everything set up for you.",
  },
];

const slideVariants = {
  enter: (dir: number) => ({
    x: dir > 0 ? 48 : -48,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
    transition: { duration: 0.3, ease: "easeOut" as const },
  },
  exit: (dir: number) => ({
    x: dir > 0 ? -48 : 48,
    opacity: 0,
    transition: { duration: 0.2, ease: "easeOut" as const },
  }),
};

const METRICS_DEFAULTS: Partial<BodyMetrics> = {
  gender: undefined,
  age: 25,
  heightCm: 170,
  weightKg: 70,
  activityLevel: undefined,
};

function metricsComplete(m: Partial<BodyMetrics>): m is BodyMetrics {
  return (
    !!m.gender &&
    !!m.activityLevel &&
    (m.age ?? 0) > 0 &&
    (m.heightCm ?? 0) > 0 &&
    (m.weightKg ?? 0) > 0
  );
}

export default function OnboardingPage() {
  const router = useRouter();
  const { isAuthenticated, onboardingComplete, updateProfile, setOnboardingComplete, accessToken } =
    useUserStore();
  const { setInjuries } = usePhysioStore();
  const { updateSettings } = useSettingsStore();

  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const direction = useRef(1);

  const [goal, setGoal] = useState<FitnessGoal | null>(null);
  const [metrics, setMetrics] = useState<Partial<BodyMetrics>>(METRICS_DEFAULTS);
  const [fitnessLevel, setFitnessLevel] = useState<FitnessLevel | null>(null);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [splitId, setSplitId] = useState<string | null>(null);
  const [injuries, setInjuriesState] = useState<UserInjury[]>([]);
  const [weightUnit, setWeightUnit] = useState<"kg" | "lb" | null>(null);
  const [notifPrefs, setNotifPrefs] = useState<NotificationPrefs>({
    workoutReminders: true,
    physioReminders: true,
    streakWarning: true,
  });

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace("/signin");
    } else if (onboardingComplete) {
      router.replace("/dashboard");
    }
  }, [isAuthenticated, onboardingComplete, router]);

  const canProceed = () => {
    if (step === 0) return goal !== null;
    if (step === 1) return metricsComplete(metrics);
    if (step === 2) return fitnessLevel !== null;
    if (step === 3) return equipment.length > 0;
    if (step === 4) return splitId !== null;
    if (step === 5) return true; // injuries — optional
    if (step === 6) return weightUnit !== null;
    if (step === 7) return true; // notifications — always proceed
    if (step === 8) return true; // summary — always proceed
    return false;
  };

  const handleNext = () => {
    if (!canProceed()) return;
    if (step < STEPS.length - 1) {
      direction.current = 1;
      setStep((s) => s + 1);
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    if (step === 0) return;
    direction.current = -1;
    setStep((s) => s - 1);
  };

  const handleComplete = async () => {
    if (!goal || !fitnessLevel || !splitId || saving) return;
    const m = metricsComplete(metrics) ? metrics : null;

    const nutritionTargets = m
      ? calculateNutritionTargets(
          m.weightKg,
          m.heightCm,
          m.age,
          m.gender,
          m.activityLevel,
          goal
        )
      : undefined;

    // Persist split_id to the database FIRST — this is what the re-login check
    // uses to decide whether onboarding is complete. Only proceed after it confirms.
    // If the token is missing the session is broken; bail rather than marking
    // onboarding complete without the DB write.
    if (!accessToken) return;

    setSaving(true);
    try {
      await authApi.updateProfile(accessToken, {
        goal,
        fitness_level: fitnessLevel,
        equipment,
        split_id: splitId,
        ...(m
          ? {
              gender: m.gender,
              age: m.age,
              height_cm: m.heightCm,
              weight_kg: m.weightKg,
              activity_level: m.activityLevel,
            }
          : {}),
      });
    } catch {
      setSaving(false);
      return;
    }

    updateProfile({
      goal,
      fitnessLevel,
      equipment,
      splitId,
      injuries,
      ...(m
        ? {
            gender: m.gender,
            age: m.age,
            heightCm: m.heightCm,
            weightKg: m.weightKg,
            activityLevel: m.activityLevel,
          }
        : {}),
      ...(nutritionTargets ? { nutritionTargets } : {}),
      ...(weightUnit ? { units: weightUnit } : {}),
    });
    updateSettings({
      ...(weightUnit ? { weightUnit } : {}),
      notifications: {
        workoutReminders: notifPrefs.workoutReminders,
        workoutReminderTime: "07:00",
        workoutReminderDays: [1, 2, 3, 4, 5],
        physioMorning: notifPrefs.physioReminders,
        physioMorningTime: "08:00",
        physioEvening: notifPrefs.physioReminders,
        physioEveningTime: "20:00",
        streakWarning: notifPrefs.streakWarning,
        progressiveOverloadMilestone: true,
      },
    });
    if (injuries.length > 0) setInjuries(injuries);
    setOnboardingComplete(true);
    router.push("/dashboard");
  };

  if (!isAuthenticated || onboardingComplete) return null;

  const currentStep = STEPS[step];
  const isLast = step === STEPS.length - 1;

  return (
    <div className="min-h-screen gym-bg-auth flex flex-col">
      <GymBackground variant="auth" />
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-safe pt-12 pb-4">
        <motion.button
          whileTap={{ scale: 0.92 }}
          onClick={handleBack}
          className={cn(
            "w-9 h-9 rounded-full flex items-center justify-center transition-colors duration-200",
            step === 0
              ? "opacity-0 pointer-events-none"
              : "bg-white/8 hover:bg-white/15 text-white/70"
          )}
        >
          <ArrowLeft className="w-4 h-4" />
        </motion.button>

        {/* Step dots */}
        <div className="flex items-center gap-2">
          {STEPS.map((_, i) => (
            <motion.div
              key={i}
              animate={{
                width: i === step ? 20 : 6,
                backgroundColor:
                  i < step
                    ? "rgba(108, 99, 255, 0.6)"
                    : i === step
                    ? "#6C63FF"
                    : "rgba(255,255,255,0.15)",
              }}
              transition={{ duration: 0.3 }}
              className="h-1.5 rounded-full"
            />
          ))}
        </div>

        <span className="text-xs text-white/35 font-medium tabular-nums w-9 text-right">
          {step + 1}/{STEPS.length}
        </span>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col px-5 pb-8 overflow-y-auto">
        {/* Step heading */}
        <AnimatePresence mode="wait" custom={direction.current}>
          <motion.div
            key={`heading-${step}`}
            custom={direction.current}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            className="pt-6 pb-8"
          >
            <h1 className="text-2xl font-bold text-white leading-tight">
              {currentStep.title}
            </h1>
            <p className="text-sm text-white/45 mt-1.5">{currentStep.subtitle}</p>
          </motion.div>
        </AnimatePresence>

        {/* Step content */}
        <AnimatePresence mode="wait" custom={direction.current}>
          <motion.div
            key={`step-${step}`}
            custom={direction.current}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            className="flex-1"
          >
            {step === 0 && <GoalStep value={goal} onChange={setGoal} />}
            {step === 1 && (
              <BodyMetricsStep value={metrics} onChange={setMetrics} />
            )}
            {step === 2 && (
              <FitnessLevelStep value={fitnessLevel} onChange={setFitnessLevel} />
            )}
            {step === 3 && (
              <EquipmentStep value={equipment} onChange={setEquipment} />
            )}
            {step === 4 && goal && fitnessLevel && (
              <SplitStep
                value={splitId}
                goal={goal}
                fitnessLevel={fitnessLevel}
                onChange={setSplitId}
              />
            )}
            {step === 5 && (
              <InjuryCheckStep value={injuries} onChange={setInjuriesState} />
            )}
            {step === 6 && (
              <UnitsStep value={weightUnit} onChange={setWeightUnit} />
            )}
            {step === 7 && (
              <NotificationsStep value={notifPrefs} onChange={setNotifPrefs} />
            )}
            {step === 8 && goal && (
              <PlanSummaryStep
                goal={goal}
                split={splitId ? (getSplitById(splitId) ?? null) : null}
                nutritionTargets={
                  metricsComplete(metrics)
                    ? calculateNutritionTargets(
                        metrics.weightKg,
                        metrics.heightCm,
                        metrics.age,
                        metrics.gender,
                        metrics.activityLevel,
                        goal
                      )
                    : null
                }
                unit={weightUnit ?? "kg"}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* CTA */}
      <div className="px-5 pb-safe pb-10 pt-4 border-t border-white/6">
        <Button
          fullWidth
          size="lg"
          onClick={handleNext}
          disabled={!canProceed() || saving}
          className="gap-2"
        >
          {isLast ? (
            saving ? (
              <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Start Training
              </>
            )
          ) : (
            <>
              Continue
              <ChevronRight className="w-4 h-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
