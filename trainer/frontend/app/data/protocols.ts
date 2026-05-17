import { type MuscleGroup } from "@/app/types";

// ─── Types ────────────────────────────────────────────────────────────────────

export type ProtocolType = "warmup" | "cooldown";

export type SessionTag =
  | "push"
  | "pull"
  | "legs"
  | "upper"
  | "lower"
  | "chest"
  | "back"
  | "shoulders"
  | "arms"
  | "core"
  | "full-body"
  | "cardio"
  | "hiit";

export interface ProtocolStep {
  exerciseId?: string;
  name: string;
  durationSeconds?: number;
  reps?: number;
  sets?: number;
  holdSeconds?: number;
  eachSide?: boolean;
  notes?: string;
}

export interface Protocol {
  id: string;
  name: string;
  type: ProtocolType;
  sessionTags: SessionTag[];
  targetMuscleGroups: MuscleGroup[];
  totalDurationMinutes: number;
  steps: ProtocolStep[];
  coachingNote: string;
}

// ─── Warmup Protocols ─────────────────────────────────────────────────────────

export const protocols: Protocol[] = [
  {
    id: "warmup-push",
    name: "Push Day Warm-Up",
    type: "warmup",
    sessionTags: ["push", "chest", "shoulders"],
    targetMuscleGroups: [
      "anterior-deltoid",
      "lateral-deltoid",
      "pectoralis-major-upper",
      "pectoralis-major-lower",
      "serratus-anterior",
      "triceps-long",
    ],
    totalDurationMinutes: 8,
    steps: [
      {
        name: "Cardio Elevation (Rowing Machine / Bike)",
        durationSeconds: 180,
        notes: "Light pace — elevate heart rate and increase thoracic tissue temperature.",
      },
      {
        exerciseId: "cat-cow",
        name: "Cat-Cow Thoracic Mobilisation",
        reps: 10,
        sets: 1,
        notes: "Focus on thoracic extension — let the chest drop toward the floor on extension.",
      },
      {
        name: "Arm Circle Progression",
        reps: 10,
        sets: 1,
        eachSide: false,
        notes: "Small to large circles forward, then reverse. Lubricates glenohumeral joint.",
      },
      {
        name: "Band Pull-Apart",
        reps: 15,
        sets: 2,
        notes: "Light resistance band. Activates posterior deltoid and lower trapezius to balance push mechanics.",
      },
      {
        name: "Wall Pec Stretch (Dynamic)",
        reps: 10,
        sets: 1,
        eachSide: true,
        durationSeconds: 20,
        notes:
          "Stand facing a wall, place forearm on the wall at 90 degrees and rotate torso away — dynamic (not held). Mobilises pectoralis minor.",
      },
      {
        name: "Shoulder External Rotation with Band",
        reps: 12,
        sets: 2,
        eachSide: true,
        notes: "Elbow tucked at 90 degrees, rotate outward against light band. Pre-activates rotator cuff before pressing.",
      },
      {
        name: "Push-Up Ramp Set (Bodyweight)",
        reps: 10,
        sets: 1,
        notes: "Controlled push-ups — prime the pressing pattern and confirm shoulder range is pain-free before loading.",
      },
    ],
    coachingNote:
      "The band pull-apart and ER rotation are the most important steps — neglecting them is the primary cause of shoulder impingement during bench pressing. Never skip them.",
  },

  {
    id: "warmup-pull",
    name: "Pull Day Warm-Up",
    type: "warmup",
    sessionTags: ["pull", "back"],
    targetMuscleGroups: [
      "latissimus-dorsi",
      "rhomboids",
      "lower-trapezius",
      "posterior-deltoid",
      "biceps-brachii-long",
      "teres-major",
    ],
    totalDurationMinutes: 8,
    steps: [
      {
        name: "Cardio Elevation (Rowing Machine Preferred)",
        durationSeconds: 180,
        notes: "Rowing directly rehearses the pulling pattern and increases latissimus dorsi temperature.",
      },
      {
        name: "Thoracic Extension over Foam Roller",
        reps: 10,
        sets: 1,
        notes: "Place roller perpendicular to the spine at mid-thoracic level. Extend over it 3–4 segments. Restores thoracic extension for overhead pulling.",
      },
      {
        exerciseId: "scapular-retraction-wall",
        name: "Scapular Retraction (Wall Slide)",
        reps: 12,
        sets: 2,
        notes: "Activates lower trapezius and rhomboids — the primary scapular depressors needed for lat pull-downs and rows.",
      },
      {
        name: "Dead Hang (Dead-Hang Shoulder Distraction)",
        durationSeconds: 30,
        sets: 2,
        notes: "Hang passively from a pull-up bar. Decompresses the shoulder joint and stretches the lats under load. Rest 30 seconds between hangs.",
      },
      {
        name: "Band Face Pull",
        reps: 15,
        sets: 2,
        notes: "Light resistance. External rotation at 90 degrees abduction — activates posterior deltoid and external rotators before loading.",
      },
      {
        name: "Lat Prayer Stretch",
        durationSeconds: 30,
        sets: 2,
        notes: "Kneel in front of a bench, place forearms on the bench, and sit hips back to stretch the lats and thoracolumbar fascia.",
      },
      {
        name: "Bodyweight Scapular Pull-Up",
        reps: 8,
        sets: 2,
        notes: "Hang from bar, arms straight — retract and depress scapulae without bending elbows. Activates serratus anterior and lower trapezius.",
      },
    ],
    coachingNote:
      "Thoracic extension is the single most limiting factor for overhead pull range of motion in desk workers. If the foam roller feels painful, that segment needs the most attention.",
  },

  {
    id: "warmup-legs",
    name: "Leg Day Warm-Up",
    type: "warmup",
    sessionTags: ["legs", "lower"],
    targetMuscleGroups: [
      "quadriceps-rectus-femoris",
      "gluteus-maximus",
      "gluteus-medius",
      "hamstrings-biceps-femoris",
      "hip-flexors",
      "adductors",
      "erector-spinae-lower",
    ],
    totalDurationMinutes: 10,
    steps: [
      {
        name: "Stationary Bike or Treadmill Walk",
        durationSeconds: 240,
        notes: "Low intensity — elevate core temperature and increase joint fluid viscosity in the hips, knees, and ankles.",
      },
      {
        exerciseId: "world-greatest-stretch",
        name: "World's Greatest Stretch",
        reps: 5,
        sets: 1,
        eachSide: true,
        notes:
          "Step forward into a lunge, rotate same-side arm to ceiling, then drop elbow to the floor. 3 positions per rep. The single best full lower-body mobility drill.",
      },
      {
        exerciseId: "cat-cow",
        name: "Cat-Cow + Hip Circle Combo",
        reps: 10,
        sets: 1,
        notes: "Cat-cow for lumbopelvic mobilisation, then 10 hip circles each direction on hands and knees.",
      },
      {
        name: "Bodyweight Lateral Lunge",
        reps: 10,
        sets: 2,
        eachSide: true,
        notes: "Wide stance, shift weight to one side, keep the opposite leg straight. Opens adductors and hip capsule. Hold 1 second at bottom.",
      },
      {
        exerciseId: "glute-bridge",
        name: "Glute Bridge Activation",
        reps: 15,
        sets: 2,
        notes: "Drive through heels, squeeze glutes hard at the top. Activates gluteus maximus before squats/deadlifts — prevents lumbar dominance.",
      },
      {
        name: "Clamshell (Band)",
        reps: 12,
        sets: 2,
        eachSide: true,
        notes: "Light band above knees. Activates gluteus medius — prevents knee valgus collapse during squats.",
      },
      {
        name: "Goblet Squat (Light, Bodyweight or 5–10 kg)",
        reps: 10,
        sets: 2,
        notes: "Slow descent, 3-second hold at the bottom. Assesses and improves ankle dorsiflexion, hip flexibility, and thoracic extension simultaneously.",
      },
    ],
    coachingNote:
      "The glute bridge and clamshell are non-negotiable before any squat or deadlift session — they are the two exercises most consistently skipped by lifters who develop chronic knee and lower back pain.",
  },

  {
    id: "warmup-shoulders",
    name: "Shoulder Day Warm-Up",
    type: "warmup",
    sessionTags: ["shoulders", "push"],
    targetMuscleGroups: [
      "anterior-deltoid",
      "lateral-deltoid",
      "posterior-deltoid",
      "supraspinatus",
      "infraspinatus",
      "serratus-anterior",
      "lower-trapezius",
    ],
    totalDurationMinutes: 9,
    steps: [
      {
        name: "Cardio Elevation",
        durationSeconds: 180,
        notes: "3 minutes bike or rowing to increase shoulder girdle tissue temperature.",
      },
      {
        name: "Thoracic Foam Roll",
        durationSeconds: 60,
        notes: "Mid and upper thoracic spine — 5 extensions per segment across 4 levels. Unlocks thoracic extension for overhead pressing.",
      },
      {
        name: "Doorway Pec Stretch (Dynamic)",
        reps: 10,
        sets: 1,
        durationSeconds: 20,
        notes: "Stand in a doorway, forearm on frame at 90 degrees, rotate trunk away. Do not hold — oscillate in and out over a 2-second tempo.",
      },
      {
        name: "Band Pull-Apart",
        reps: 20,
        sets: 2,
        notes: "Arms straight, pull band across chest. Activates posterior deltoid, lower trapezius, and rhomboids. The inverse pattern of the pressing exercises to follow.",
      },
      {
        name: "Cuban Press (Light Dumbbell)",
        reps: 10,
        sets: 2,
        notes: "From hanging position: shrug, externally rotate to 90 degrees, press overhead. A complete rotator cuff activation sequence. Use 2–4 kg only.",
      },
      {
        name: "Band Face Pull (High Anchor)",
        reps: 15,
        sets: 2,
        notes: "Pull toward forehead, elbows above hands, externally rotate at end range. Activates all three rotator cuff external rotators before overhead loading.",
      },
      {
        name: "Overhead Reach Thoracic Extension (Wall)",
        reps: 10,
        sets: 1,
        notes: "Stand facing a wall. Reach both arms overhead sliding hands up the wall. Combines shoulder flexion with thoracic extension. Identify any overhead pain arcs.",
      },
    ],
    coachingNote:
      "The Cuban press is the most efficient shoulder warm-up drill — it sequences the exact muscular pattern of a healthy overhead movement in reverse. If this exercise reveals pain, investigate rotator cuff pathology before loading.",
  },

  {
    id: "warmup-arms",
    name: "Arms Day Warm-Up",
    type: "warmup",
    sessionTags: ["arms"],
    targetMuscleGroups: [
      "biceps-brachii-long",
      "biceps-brachii-short",
      "brachialis",
      "brachioradialis",
      "triceps-long",
      "triceps-lateral",
      "forearm-flexors",
      "forearm-extensors",
    ],
    totalDurationMinutes: 7,
    steps: [
      {
        name: "Cardio Elevation",
        durationSeconds: 180,
        notes: "3 minutes light bike or rowing to increase arm tissue temperature.",
      },
      {
        name: "Wrist Circle Mobilisation",
        reps: 10,
        sets: 1,
        notes: "10 clockwise and 10 counter-clockwise circles, both wrists together. Essential for elbow health during curl and extension work.",
      },
      {
        name: "Forearm Extensor Stretch",
        durationSeconds: 30,
        sets: 2,
        eachSide: true,
        notes: "Arm extended, wrist in flexion, fingers pointing down — gentle pull with opposite hand. Addresses lateral epicondyle tightness.",
      },
      {
        name: "Forearm Flexor Stretch",
        durationSeconds: 30,
        sets: 2,
        eachSide: true,
        notes: "Arm extended, wrist in extension, fingers pointing down — gentle pull with opposite hand. Addresses medial epicondyle tightness.",
      },
      {
        name: "Band Biceps Curl (Light)",
        reps: 15,
        sets: 2,
        notes: "Light band, full range. Increases blood flow to the biceps before loading.",
      },
      {
        name: "Band Tricep Pushdown (Light)",
        reps: 15,
        sets: 2,
        notes: "Light band, full range. Warms triceps long head through full elongation (raise hands above head for long head emphasis).",
      },
    ],
    coachingNote:
      "Elbow tendinopathy is the most common overuse injury from arm training — the wrist circles and forearm stretches are not optional if you train arms more than twice per week.",
  },

  {
    id: "warmup-full-body",
    name: "Full-Body / Compound Day Warm-Up",
    type: "warmup",
    sessionTags: ["full-body", "hiit"],
    targetMuscleGroups: [
      "gluteus-maximus",
      "gluteus-medius",
      "quadriceps-rectus-femoris",
      "hamstrings-biceps-femoris",
      "erector-spinae-lower",
      "anterior-deltoid",
      "serratus-anterior",
    ],
    totalDurationMinutes: 10,
    steps: [
      {
        name: "Jump Rope or Jogging",
        durationSeconds: 180,
        notes: "Light pace to elevate heart rate and increase core temperature systemically.",
      },
      {
        exerciseId: "world-greatest-stretch",
        name: "World's Greatest Stretch",
        reps: 5,
        sets: 1,
        eachSide: true,
        notes: "The most comprehensive single mobility drill for full-body warm-up.",
      },
      {
        name: "Inchworm",
        reps: 6,
        sets: 2,
        notes: "Walk hands out to push-up, push-up, walk hands back, stand. Mobilises hamstrings, thoracic spine, and shoulders in one movement.",
      },
      {
        exerciseId: "glute-bridge",
        name: "Glute Bridge",
        reps: 15,
        sets: 2,
        notes: "Activates gluteus maximus before compound hip hinge and squat patterns.",
      },
      {
        name: "Bodyweight Squat to Stand",
        reps: 10,
        sets: 2,
        notes: "Hold bottom of squat for 2 seconds. Addresses ankle dorsiflexion and hip flexion simultaneously.",
      },
      {
        name: "Arm Swing + Hip Circle Combo",
        reps: 10,
        sets: 1,
        notes: "Alternate large front-to-back arm swings with hip circles. Activates shoulder and hip synovial fluid simultaneously.",
      },
      {
        name: "Band Pull-Apart",
        reps: 15,
        sets: 2,
        notes: "Activates posterior deltoid and mid-traps. Counteracts the dominant pushing pattern.",
      },
    ],
    coachingNote:
      "The inchworm is the highest time-return mobility drill for full-body sessions — it mobilises the posterior chain, upper extremity, and thoracic spine simultaneously in under 60 seconds.",
  },

  {
    id: "warmup-cardio",
    name: "Cardio / HIIT Warm-Up",
    type: "warmup",
    sessionTags: ["cardio", "hiit"],
    targetMuscleGroups: [
      "gluteus-maximus",
      "gluteus-medius",
      "quadriceps-rectus-femoris",
      "hamstrings-biceps-femoris",
      "hip-flexors",
      "gastrocnemius",
      "soleus",
    ],
    totalDurationMinutes: 8,
    steps: [
      {
        name: "Walk → Jog Progression",
        durationSeconds: 180,
        notes: "3 minutes: 60 seconds brisk walk, 60 seconds easy jog, 60 seconds moderate jog. Progressive speed elevation.",
      },
      {
        name: "Leg Swing (Forward-Back)",
        reps: 12,
        sets: 1,
        eachSide: true,
        notes: "Hold a wall. Swing the leg freely forward and back through full hip range. Activates hip flexors and glutes dynamically.",
      },
      {
        name: "Leg Swing (Side-to-Side)",
        reps: 12,
        sets: 1,
        eachSide: true,
        notes: "Cross-body and lateral swing. Mobilises hip internal/external rotation and adductors.",
      },
      {
        name: "Hip Circle (Standing)",
        reps: 10,
        sets: 1,
        notes: "Large clockwise and counter-clockwise hip circles. Full hip joint mobilisation before running loading.",
      },
      {
        name: "Knee-to-Chest Walk",
        reps: 10,
        sets: 1,
        eachSide: true,
        notes: "Walk forward, pulling each knee to chest with both hands and rising onto the toe of the standing leg. Hip flexor and calf activation.",
      },
      {
        name: "Ankle Circle and Calf Raise (Dynamic)",
        reps: 10,
        sets: 1,
        notes: "10 ankle circles each direction, then 10 slow bilateral calf raises. Prepares Achilles and plantar fascia for impact loading.",
      },
      {
        name: "High Knee March → Skip",
        durationSeconds: 30,
        sets: 2,
        notes: "March in place with exaggerated knee lift, then progress to skip. Activates hip flexors and primes the stretch-shortening cycle.",
      },
    ],
    coachingNote:
      "The dynamic leg swings and ankle circles are critically important for runners — failure to warm up the Achilles and plantar fascia before impact loading is the leading cause of acute insertional Achilles pain.",
  },

  // ─── Cooldown Protocols ────────────────────────────────────────────────────

  {
    id: "cooldown-upper",
    name: "Upper Body Cooldown",
    type: "cooldown",
    sessionTags: ["push", "pull", "chest", "back", "shoulders", "arms", "upper"],
    targetMuscleGroups: [
      "pectoralis-major-upper",
      "pectoralis-major-lower",
      "latissimus-dorsi",
      "posterior-deltoid",
      "triceps-long",
      "biceps-brachii-long",
      "upper-trapezius",
      "rhomboids",
    ],
    totalDurationMinutes: 8,
    steps: [
      {
        name: "Child's Pose with Lat Reach",
        durationSeconds: 45,
        sets: 2,
        eachSide: true,
        notes: "Kneel, sit back toward heels, walk hands out to one side. Hold 45 seconds per side. Stretches lats, teres major, and thoracolumbar fascia.",
      },
      {
        name: "Doorway Pec Stretch (Static)",
        durationSeconds: 45,
        sets: 2,
        eachSide: true,
        notes: "Forearm on doorframe at 90 degrees, rotate trunk away. Hold 45 seconds. Stretches pectoralis major and minor.",
      },
      {
        name: "Cross-Body Shoulder Stretch",
        durationSeconds: 30,
        sets: 2,
        eachSide: true,
        notes: "Pull arm across chest with opposite hand. Stretches posterior deltoid and rhomboids. Apply pressure above the elbow, not the joint.",
      },
      {
        name: "Overhead Tricep Stretch",
        durationSeconds: 30,
        sets: 2,
        eachSide: true,
        notes: "Raise arm overhead, bend at elbow, use opposite hand to gently press elbow back. Stretches triceps long head.",
      },
      {
        name: "Upper Trapezius Stretch",
        durationSeconds: 30,
        sets: 2,
        eachSide: true,
        notes: "Sit upright, laterally flex neck away from the side being stretched, add gentle hand pressure on top of head. Stretches upper trapezius and levator scapulae.",
      },
      {
        name: "Thoracic Foam Roll (Extension)",
        durationSeconds: 60,
        notes: "Work from mid to upper thoracic — 5 extensions per segment. Restores thoracic extension range lost during pressing.",
      },
    ],
    coachingNote:
      "The pec stretch is most important after chest and push sessions — chronic pec tightness is the number one structural contributor to shoulder impingement and forward head posture.",
  },

  {
    id: "cooldown-lower",
    name: "Lower Body Cooldown",
    type: "cooldown",
    sessionTags: ["legs", "lower"],
    targetMuscleGroups: [
      "gluteus-maximus",
      "gluteus-medius",
      "hamstrings-biceps-femoris",
      "quadriceps-rectus-femoris",
      "hip-flexors",
      "adductors",
      "gastrocnemius",
      "soleus",
      "piriformis",
    ],
    totalDurationMinutes: 10,
    steps: [
      {
        name: "Supine Piriformis Stretch (Figure-Four)",
        durationSeconds: 45,
        sets: 2,
        eachSide: true,
        notes: "Cross ankle over opposite knee. Pull thigh toward chest. Stretches piriformis, gluteus maximus, and external hip rotators.",
      },
      {
        name: "Supine Hip Flexor Stretch (Lunge Position)",
        durationSeconds: 45,
        sets: 2,
        eachSide: true,
        notes: "Low lunge on one knee. Push hips forward until stretch felt in anterior hip of rear leg. Stretches iliopsoas and rectus femoris.",
      },
      {
        name: "Standing Quad Stretch",
        durationSeconds: 30,
        sets: 2,
        eachSide: true,
        notes: "Pull heel to gluteals, hips squared. If balance is challenging, hold a wall. Stretches rectus femoris — critical after squats and lunges.",
      },
      {
        exerciseId: "hamstring-stretch",
        name: "Supine Hamstring Stretch (Strap or Towel)",
        durationSeconds: 45,
        sets: 2,
        eachSide: true,
        notes: "Loop a towel around the foot and straighten the leg until a deep hamstring stretch is felt. Avoid posterior pelvic tilt — keep lower back flat.",
      },
      {
        name: "Seated Adductor Stretch (Butterfly)",
        durationSeconds: 45,
        sets: 2,
        notes: "Sit with soles of feet together, gently press knees toward the floor with elbows. Stretches adductors and hip external rotators.",
      },
      {
        name: "Standing Calf Stretch (Gastroc + Soleus)",
        durationSeconds: 30,
        sets: 2,
        eachSide: true,
        notes: "Straight knee (gastrocnemius) then bent knee (soleus) — 30 seconds each. Essential after any loaded lower body session.",
      },
      {
        exerciseId: "pigeon-pose",
        name: "Pigeon Pose",
        durationSeconds: 60,
        sets: 1,
        eachSide: true,
        notes: "Front leg bent, rear leg extended. Excellent combined hip flexor, piriformis, and glute stretch for post-squat and deadlift recovery.",
      },
    ],
    coachingNote:
      "The hip flexor stretch is the most frequently neglected cooldown movement in leg training, yet tight hip flexors are the primary cause of anterior pelvic tilt and the associated lumbar extension pain that develops over months of training.",
  },

  {
    id: "cooldown-full-body",
    name: "Full-Body Cooldown",
    type: "cooldown",
    sessionTags: ["full-body", "hiit", "cardio"],
    targetMuscleGroups: [
      "gluteus-maximus",
      "hamstrings-biceps-femoris",
      "hip-flexors",
      "pectoralis-major-upper",
      "latissimus-dorsi",
      "gastrocnemius",
      "soleus",
      "upper-trapezius",
    ],
    totalDurationMinutes: 10,
    steps: [
      {
        name: "Easy Walk or March",
        durationSeconds: 120,
        notes: "2 minutes to gradually reduce heart rate from training intensity before static stretching.",
      },
      {
        exerciseId: "cat-cow",
        name: "Cat-Cow Spinal Mobilisation",
        reps: 10,
        sets: 1,
        notes: "Slow, full-range spinal flexion and extension. Restores spinal neutral after loaded movements.",
      },
      {
        exerciseId: "childs-pose-coccyx-traction",
        name: "Child's Pose",
        durationSeconds: 60,
        sets: 2,
        notes: "Full decompression of the thoracic and lumbar spine. Hold 60 seconds. Breathe into the lower back.",
      },
      {
        name: "Supine Hip Flexor Stretch",
        durationSeconds: 45,
        sets: 2,
        eachSide: true,
        notes: "Low lunge. Push hips forward to stretch iliopsoas.",
      },
      {
        name: "Doorway Pec Stretch",
        durationSeconds: 45,
        sets: 1,
        eachSide: true,
        notes: "Static hold to restore anterior chest extensibility.",
      },
      {
        name: "Standing Calf Stretch",
        durationSeconds: 30,
        sets: 2,
        eachSide: true,
        notes: "Straight knee 30 seconds, bent knee 30 seconds. Always performed post-HIIT and cardio.",
      },
      {
        name: "Supine Spinal Twist",
        durationSeconds: 45,
        sets: 2,
        eachSide: true,
        notes: "Lie on back, bring one knee across the body to the opposite side, extend same-side arm. Thoracic rotation and lumbar mobility restoration.",
      },
      {
        name: "Diaphragmatic Breathing",
        durationSeconds: 120,
        sets: 1,
        notes: "Lie on back with knees bent. 5-second inhale into the belly, 6-second exhale. Activates parasympathetic recovery and reduces cortisol. The single most important and most neglected recovery tool.",
      },
    ],
    coachingNote:
      "The diaphragmatic breathing at the end is not optional — it is a physiological intervention that accelerates recovery by downregulating sympathetic activation. Even 2 minutes is measurably effective.",
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

export const protocolMap: Record<string, Protocol> = Object.fromEntries(
  protocols.map((p) => [p.id, p])
);

export function getProtocolById(id: string): Protocol | undefined {
  return protocolMap[id];
}

export function getProtocolsBySession(tag: SessionTag): Protocol[] {
  return protocols.filter((p) => p.sessionTags.includes(tag));
}

export function getWarmupForSession(tag: SessionTag): Protocol | undefined {
  return protocols.find(
    (p) => p.type === "warmup" && p.sessionTags.includes(tag)
  );
}

export function getCooldownForSession(tag: SessionTag): Protocol | undefined {
  return protocols.find(
    (p) => p.type === "cooldown" && p.sessionTags.includes(tag)
  );
}

export function getProtocolsByType(type: ProtocolType): Protocol[] {
  return protocols.filter((p) => p.type === type);
}
