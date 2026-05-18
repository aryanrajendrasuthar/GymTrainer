// ─── Exercise Types ────────────────────────────────────────────────────────

export type ExerciseCategory =
  | "chest"
  | "back"
  | "shoulders"
  | "arms"
  | "legs"
  | "glutes"
  | "core"
  | "cardio"
  | "full-body"
  | "mobility"
  | "warmup-cooldown";

export type Equipment =
  | "barbell"
  | "dumbbell"
  | "cable"
  | "machine"
  | "bodyweight"
  | "resistance-band"
  | "kettlebell"
  | "pull-up-bar"
  | "bench"
  | "foam-roller"
  | "trx"
  | "ez-bar"
  | "dip-bars"
  | "none";

export type MuscleGroup =
  | "neck"
  | "upper-trapezius"
  | "lower-trapezius"
  | "anterior-deltoid"
  | "lateral-deltoid"
  | "posterior-deltoid"
  | "pectoralis-major-upper"
  | "pectoralis-major-lower"
  | "pectoralis-minor"
  | "biceps-brachii-long"
  | "biceps-brachii-short"
  | "brachialis"
  | "brachioradialis"
  | "forearm-flexors"
  | "forearm-extensors"
  | "rectus-abdominis-upper"
  | "rectus-abdominis-lower"
  | "obliques"
  | "serratus-anterior"
  | "latissimus-dorsi"
  | "rhomboids"
  | "teres-major"
  | "teres-minor"
  | "infraspinatus"
  | "supraspinatus"
  | "triceps-long"
  | "triceps-lateral"
  | "triceps-medial"
  | "erector-spinae-upper"
  | "erector-spinae-lower"
  | "gluteus-maximus"
  | "gluteus-medius"
  | "gluteus-minimus"
  | "piriformis"
  | "hamstrings-biceps-femoris"
  | "hamstrings-semimembranosus"
  | "hamstrings-semitendinosus"
  | "quadriceps-rectus-femoris"
  | "quadriceps-vastus-lateralis"
  | "quadriceps-vastus-medialis"
  | "quadriceps-vastus-intermedius"
  | "adductors"
  | "hip-flexors"
  | "tibialis-anterior"
  | "gastrocnemius"
  | "soleus"
  | "peroneals";

export interface RepRange {
  sets: number;
  repsMin: number;
  repsMax: number;
  restSuggestion: string;
}

export interface Exercise {
  id: string;
  name: string;
  alternativeNames: string[];
  category: ExerciseCategory;
  subcategory: string;
  equipment: Equipment[];
  location: ("gym" | "home" | "both")[];
  difficulty: "beginner" | "intermediate" | "advanced";
  primaryMuscles: MuscleGroup[];
  secondaryMuscles: MuscleGroup[];
  gripVariations: string[];
  movementType: "compound" | "isolation" | "cardio" | "stretch" | "warmup";
  forceType: "push" | "pull" | "static" | "hinge" | "squat" | "carry";
  mechanic: "bilateral" | "unilateral" | "isometric";
  instructions: string[];
  formCues: string[];
  commonMistakes: string[];
  breathingPattern: string;
  youtubeId: string;
  wgerExerciseId?: number;
  repRanges: {
    muscleGain: RepRange;
    fatLoss: RepRange;
    strength: RepRange;
    recomp: RepRange;
    greekGod: RepRange;
    endurance: RepRange;
  };
  suggestedWeightIncreaseKg: { upper: number; lower: number; isolation: number };
  contraindications: string[];
  progressionExercise?: string;
  regressionExercise?: string;
  alternateExerciseId?: string;
  tags: string[];
}

// ─── Physio Types ──────────────────────────────────────────────────────────

export type PhysioCondition =
  | "adhesive-capsulitis"
  | "cervical-strain"
  | "cervical-radiculopathy"
  | "thoracic-kyphosis"
  | "scapular-winging"
  | "scapular-dyskinesia"
  | "l4-l5-disc-herniation"
  | "l5-s1-disc-herniation"
  | "coccydynia"
  | "patellofemoral-pain-syndrome"
  | "knee-effusion"
  | "it-band-syndrome"
  | "achilles-tendinopathy"
  | "plantar-fasciitis"
  | "peroneal-tendon-injury"
  | "rotator-cuff-strain"
  | "shoulder-impingement"
  | "piriformis-syndrome"
  | "si-joint-dysfunction"
  | "proximal-hamstring-tendinopathy"
  | "thoracic-outlet-syndrome"
  | "cervicogenic-headache"
  | "whiplash"
  | "tendinopathy-swelling";

export type PhysioPhase = "acute" | "subacute" | "chronic" | "maintenance";

export interface PhysioExercise {
  id: string;
  name: string;
  condition: PhysioCondition;
  phase: PhysioPhase[];
  sessionType: "morning" | "evening" | "both";
  instructions: string[];
  duration?: string;
  reps?: number;
  sets?: number;
  holdTime?: number;
  breathingCues: string[];
  dos: string[];
  donts: string[];
  painLevelMax: number;
  redFlags: string[];
  primaryMuscles: MuscleGroup[];
  rehabilitationMuscles: MuscleGroup[];
  affectedArea: MuscleGroup[];
  youtubeId: string;
  progressionExercise?: string;
}

// ─── User Types ────────────────────────────────────────────────────────────

export type FitnessGoal =
  | "muscle-gain"
  | "fat-loss"
  | "recomp"
  | "strength"
  | "greek-god"
  | "calisthenics"
  | "general-fitness";

export type FitnessLevel = "beginner" | "intermediate" | "advanced";

export type ActivityLevel =
  | "sedentary"
  | "light"
  | "moderate"
  | "active"
  | "very-active";

export interface NutritionTargets {
  tdee: number;
  maintenanceCalories: number;
  dailyCalories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  deficitOrSurplus: number;
}

export interface UserInjury {
  condition: PhysioCondition;
  bodyRegion: string;
  severity: "mild" | "moderate" | "severe";
  onsetDate: string;
  phase: PhysioPhase;
  backendId?: string;
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  age: number;
  gender: "male" | "female" | "other";
  heightCm: number;
  weightKg: number;
  bodyFatPercent?: number;
  fitnessLevel: FitnessLevel;
  goal: FitnessGoal;
  splitId: string;
  equipment: Equipment[];
  injuries: UserInjury[];
  units: "kg" | "lb";
  activityLevel?: ActivityLevel;
  nutritionTargets?: NutritionTargets;
  createdAt: string;
  updatedAt: string;
}

// ─── Settings Types ────────────────────────────────────────────────────────

export type OverloadAmount = "conservative" | "standard" | "aggressive";
export type RestSuggestion = "short" | "standard" | "long" | "goal-based";

export interface NotificationSettings {
  workoutReminders: boolean;
  workoutReminderTime: string;
  workoutReminderDays: number[];
  physioMorning: boolean;
  physioMorningTime: string;
  physioEvening: boolean;
  physioEveningTime: string;
  streakWarning: boolean;
  progressiveOverloadMilestone: boolean;
}

export interface UserSettings {
  id: string;
  userId: string;
  progressiveOverloadEnabled: boolean;
  overloadAmount: OverloadAmount;
  deloadReminder: boolean;
  weightUnit: "kg" | "lb";
  rotationEnabled: boolean;
  showPreviousPerformance: boolean;
  showRpe: boolean;
  defaultRest: RestSuggestion;
  physioReminder: boolean;
  painTracking: boolean;
  autoAdvancePhase: boolean;
  reduceMotion: boolean;
  compactMode: boolean;
  notifications: NotificationSettings;
}

// ─── Session Types ─────────────────────────────────────────────────────────

export interface SetLog {
  setNumber: number;
  repsCompleted: number;
  weightUsed: number;
  weightUnit: "kg" | "lb";
  rpe?: number;
  notes?: string;
  loggedAt: string;
}

export interface ExerciseLog {
  id: string;
  userId: string;
  sessionId: string;
  exerciseId: string;
  sets: SetLog[];
  loggedAt: string;
}

export interface WorkoutSession {
  id: string;
  userId: string;
  date: string;
  splitDay: string;
  exercisesCompleted: ExerciseLog[];
  totalVolumeKg: number;
  durationMinutes: number;
  sessionNotes?: string;
  completedAt?: string;
  isPartial: boolean;
}

export interface PhysioSessionLog {
  id: string;
  userId: string;
  condition: PhysioCondition;
  phase: PhysioPhase;
  exercisesCompleted: string[];
  painBefore: Record<string, number>;
  painAfter: Record<string, number>;
  completedAt: string;
}

// ─── Progress Types ────────────────────────────────────────────────────────

export interface PersonalRecord {
  id: string;
  userId: string;
  exerciseId: string;
  weightUsed: number;
  repsAtWeight: number;
  estimatedOneRepMax: number;
  achievedAt: string;
}

export interface BodyWeightLog {
  id: string;
  userId: string;
  weightKg: number;
  loggedAt: string;
}

// ─── Split Types ───────────────────────────────────────────────────────────

export interface SplitDay {
  dayName: string;
  muscleGroups: string[];
  isRestDay: boolean;
  exercises?: string[];
  exercisesAlt?: string[];
}

export interface WorkoutSplit {
  id: string;
  name: string;
  description: string;
  daysPerWeek: number;
  days: SplitDay[];
  targetGoals: FitnessGoal[];
  difficulty: FitnessLevel;
}

// ─── Glossary Types ────────────────────────────────────────────────────────

export interface GlossaryEntry {
  term: string;
  alsoCalledTerms: string[];
  plainEnglishDefinition: string;
  affectedMuscles?: MuscleGroup[];
  hasConditionPage?: boolean;
  conditionId?: PhysioCondition;
  category: "condition" | "anatomy" | "physio-exercise" | "gym-term";
}

// ─── Progression Types ─────────────────────────────────────────────────────

export interface ProgressionFlag {
  exerciseId: string;
  userId: string;
  sessionId: string;
  currentWeightKg: number;
  suggestedWeightKg: number;
  status: "pending" | "accepted" | "ignored" | "custom";
  createdAt: string;
}

export interface ProgressionSuggestion {
  exerciseId: string;
  currentWeight: number;
  suggestedWeight: number;
  reason: string;
  increaseAmountKg: number;
}

// ─── Protocol Types ────────────────────────────────────────────────────────

export interface WarmupExercise {
  name: string;
  duration: string;
  instructions: string;
  muscleGroups: string[];
}

export interface MuscleGroupProtocol {
  muscleGroup: string;
  warmup: WarmupExercise[];
  cooldown: WarmupExercise[];
}
