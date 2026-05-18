import {
  type FitnessGoal,
  type ActivityLevel,
  type NutritionTargets,
} from "@/app/types";

// ─── BMR (Mifflin-St Jeor) ────────────────────────────────────────────────────

export function calculateBMR(
  weightKg: number,
  heightCm: number,
  age: number,
  gender: "male" | "female" | "other"
): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  if (gender === "male") return base + 5;
  if (gender === "female") return base - 161;
  return base - 78; // other: midpoint between male and female
}

// ─── TDEE ─────────────────────────────────────────────────────────────────────

const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  "very-active": 1.9,
};

export function calculateTDEE(bmr: number, activityLevel: ActivityLevel): number {
  return Math.round(bmr * ACTIVITY_MULTIPLIERS[activityLevel]);
}

// ─── Goal adjustments (kcal relative to TDEE) ─────────────────────────────────

const GOAL_CALORIE_DELTA: Record<FitnessGoal, number> = {
  "fat-loss": -400,
  "muscle-gain": 250,
  recomp: 0,
  strength: 200,
  "greek-god": 200,
  calisthenics: 100,
  "general-fitness": 0,
};

// Protein targets in grams per kg body weight
const GOAL_PROTEIN_PER_KG: Record<FitnessGoal, number> = {
  "muscle-gain": 2.2,
  "greek-god": 2.2,
  strength: 2.0,
  "fat-loss": 2.2,
  recomp: 2.0,
  calisthenics: 1.8,
  "general-fitness": 1.6,
};

// ─── Full calculation ──────────────────────────────────────────────────────────

export function calculateNutritionTargets(
  weightKg: number,
  heightCm: number,
  age: number,
  gender: "male" | "female" | "other",
  activityLevel: ActivityLevel,
  goal: FitnessGoal
): NutritionTargets {
  const bmr = calculateBMR(weightKg, heightCm, age, gender);
  const tdee = calculateTDEE(bmr, activityLevel);
  const delta = GOAL_CALORIE_DELTA[goal];
  const dailyCalories = Math.max(1200, tdee + delta);

  const proteinG = Math.round(weightKg * GOAL_PROTEIN_PER_KG[goal]);
  const proteinCalories = proteinG * 4;

  // Fat: 28% of daily calories (floored to reasonable minimum)
  const fatCalories = Math.round(dailyCalories * 0.28);
  const fatG = Math.round(fatCalories / 9);

  // Carbs: remainder
  const carbCalories = Math.max(0, dailyCalories - proteinCalories - fatCalories);
  const carbsG = Math.round(carbCalories / 4);

  return {
    tdee,
    maintenanceCalories: tdee,
    dailyCalories,
    proteinG,
    carbsG,
    fatG,
    deficitOrSurplus: dailyCalories - tdee,
  };
}

// ─── Unit helpers ─────────────────────────────────────────────────────────────

export function lbsToKg(lbs: number): number {
  return Math.round((lbs / 2.2046) * 10) / 10;
}

export function kgToLbs(kg: number): number {
  return Math.round(kg * 2.2046 * 10) / 10;
}

export function ftInToCm(feet: number, inches: number): number {
  return Math.round((feet * 30.48 + inches * 2.54) * 10) / 10;
}

export function cmToFtIn(cm: number): { feet: number; inches: number } {
  const totalInches = cm / 2.54;
  const feet = Math.floor(totalInches / 12);
  const inches = Math.round(totalInches % 12);
  return { feet, inches };
}

// ─── Calorie range labels ──────────────────────────────────────────────────────

export function getCalorieRangeLabel(
  goal: FitnessGoal
): { label: string; color: string } {
  if (goal === "fat-loss") return { label: "Calorie Deficit", color: "text-amber-400" };
  if (goal === "muscle-gain" || goal === "greek-god" || goal === "strength")
    return { label: "Calorie Surplus", color: "text-emerald-400" };
  return { label: "Maintenance Calories", color: "text-sky-400" };
}
