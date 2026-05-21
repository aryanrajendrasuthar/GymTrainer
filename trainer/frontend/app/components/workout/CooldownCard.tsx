"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Wind, ChevronDown, ChevronUp } from "lucide-react";
import type { MuscleGroup } from "@/app/types";

interface Stretch {
  name: string;
  cue: string;
  duration: string;
  icon: string;
}

const STRETCH_MAP: Record<string, Stretch[]> = {
  chest: [
    { name: "Doorframe Pec Stretch", cue: "Place forearm on doorframe at 90°, lean gently forward. Keep shoulder blades back.", duration: "30s each side", icon: "🚪" },
    { name: "Cross-Body Shoulder Stretch", cue: "Pull arm across chest with opposite hand, hold at shoulder height.", duration: "20s each side", icon: "🤝" },
  ],
  back: [
    { name: "Child's Pose", cue: "Kneel, sit back on heels, reach arms forward on the floor. Breathe into your lower back.", duration: "45s", icon: "🧎" },
    { name: "Cat-Cow Stretch", cue: "On hands and knees, alternate arching (cow) and rounding (cat) your back.", duration: "10 reps", icon: "🐱" },
  ],
  shoulders: [
    { name: "Sleeper Stretch", cue: "Lie on trained side, push forearm toward floor until you feel rear shoulder stretch.", duration: "30s each side", icon: "😴" },
    { name: "Overhead Band Stretch", cue: "Reach one arm overhead, bend elbow, use other hand to gently push elbow back.", duration: "30s each side", icon: "🙆" },
  ],
  biceps: [
    { name: "Wall Bicep Stretch", cue: "Place palm flat on wall with fingers pointing back, turn body away slowly.", duration: "20s each side", icon: "🧱" },
  ],
  triceps: [
    { name: "Overhead Tricep Stretch", cue: "Reach one arm overhead, bend elbow, use other hand to push elbow gently behind head.", duration: "25s each side", icon: "💪" },
  ],
  quads: [
    { name: "Standing Quad Stretch", cue: "Stand on one leg, pull opposite ankle to glute. Keep knees together.", duration: "30s each side", icon: "🦵" },
    { name: "Couch Stretch", cue: "Kneel with rear foot elevated on wall or bench, drive hips forward.", duration: "45s each side", icon: "🛋️" },
  ],
  hamstrings: [
    { name: "Standing Hamstring Stretch", cue: "Hinge at hips, reach toward toes with soft knees. Feel the pull behind the thigh.", duration: "45s", icon: "🙇" },
    { name: "Supine Hamstring Stretch", cue: "Lie on back, pull one straight leg toward chest with both hands.", duration: "30s each side", icon: "🛌" },
  ],
  glutes: [
    { name: "Figure-Four Stretch", cue: "Lie on back, cross ankle over opposite knee, pull both legs toward chest.", duration: "45s each side", icon: "4️⃣" },
    { name: "Pigeon Pose", cue: "Place one shin horizontal on the floor, extend the other leg back. Hold tall.", duration: "60s each side", icon: "🕊️" },
  ],
  core: [
    { name: "Cobra Stretch", cue: "Lie face-down, push chest up with hands, keep hips on floor.", duration: "30s × 2", icon: "🐍" },
    { name: "Side Bend Stretch", cue: "Stand tall, reach one arm overhead and lean to the opposite side.", duration: "20s each side", icon: "🌊" },
  ],
  calves: [
    { name: "Calf Wall Stretch", cue: "Stand arms-length from wall, press heel flat to floor with straight leg behind you.", duration: "30s each side", icon: "🧱" },
  ],
  lats: [
    { name: "Doorway Lat Stretch", cue: "Grip a doorframe at arm height, lean away from the door, letting lats lengthen.", duration: "30s each side", icon: "🚪" },
  ],
};

const ALIAS_MAP: Record<string, string> = {
  "pectoralis-major-upper": "chest",
  "pectoralis-major-lower": "chest",
  "pectoralis-minor": "chest",
  "latissimus-dorsi": "lats",
  "rhomboids": "back",
  "teres-major": "back",
  "anterior-deltoid": "shoulders",
  "lateral-deltoid": "shoulders",
  "posterior-deltoid": "shoulders",
  "biceps-brachii-long": "biceps",
  "biceps-brachii-short": "biceps",
  "brachialis": "biceps",
  "triceps-long": "triceps",
  "triceps-lateral": "triceps",
  "triceps-medial": "triceps",
  "quadriceps-rectus-femoris": "quads",
  "quadriceps-vastus-lateralis": "quads",
  "quadriceps-vastus-medialis": "quads",
  "hamstrings-biceps-femoris": "hamstrings",
  "hamstrings-semimembranosus": "hamstrings",
  "gluteus-maximus": "glutes",
  "gluteus-medius": "glutes",
  "rectus-abdominis-upper": "core",
  "rectus-abdominis-lower": "core",
  "obliques": "core",
  "abs": "core",
  "gastrocnemius": "calves",
  "soleus": "calves",
};

function resolveKey(muscle: string): string {
  return ALIAS_MAP[muscle] ?? muscle;
}

function buildCooldown(musclesTrained: MuscleGroup[]): Stretch[] {
  const seen = new Set<string>();
  const result: Stretch[] = [];

  for (const m of musclesTrained) {
    const key = resolveKey(m as string);
    if (seen.has(key)) continue;
    seen.add(key);
    const options = STRETCH_MAP[key];
    if (options?.length) {
      result.push(options[0]!);
      if (result.length >= 5) break;
    }
  }

  // Always add Child's Pose if back wasn't in the session but we have room
  if (!seen.has("back") && !seen.has("lats") && result.length < 5) {
    result.push(STRETCH_MAP.back![0]!);
  }

  return result;
}

interface CooldownCardProps {
  musclesTrained: MuscleGroup[];
}

export function CooldownCard({ musclesTrained }: CooldownCardProps) {
  const [open, setOpen] = useState(false);
  const stretches = buildCooldown(musclesTrained);

  if (!stretches.length) return null;

  const totalMins = Math.ceil(
    stretches.reduce((sum, s) => {
      const secs = s.duration.includes("60") ? 120 : s.duration.includes("45") ? 90 : 60;
      return sum + secs;
    }, 0) / 60
  );
  const uniqueMuscleCount = new Set(
    (musclesTrained as string[]).map((m) => resolveKey(m)).filter((k) => STRETCH_MAP[k])
  ).size;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.42 }}
      className="bg-trainer-surface border border-white/8 rounded-[16px] overflow-hidden"
    >
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3.5"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-[9px] bg-sky-500/12 flex items-center justify-center">
            <Wind size={14} className="text-sky-400" />
          </div>
          <div className="text-left">
            <p className="text-sm font-bold text-white">Cooldown Stretches</p>
            <p className="text-[11px] text-white/35 mt-0.5">
              {stretches.length} stretches · ~{totalMins} min
              {uniqueMuscleCount > 0 && (
                <span className="text-white/20"> · {uniqueMuscleCount} muscles</span>
              )}
            </p>
          </div>
        </div>
        {open
          ? <ChevronUp size={14} className="text-white/30" />
          : <ChevronDown size={14} className="text-white/30" />}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 flex flex-col gap-2.5 border-t border-white/5 pt-3">
              {stretches.map((stretch, i) => (
                <motion.div
                  key={stretch.name}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-start gap-3 p-3 rounded-[12px] bg-trainer-elevated border border-white/6"
                >
                  <span className="text-xl leading-none shrink-0 mt-0.5">{stretch.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white/85">{stretch.name}</p>
                    <p className="text-xs text-white/40 leading-relaxed mt-0.5">{stretch.cue}</p>
                  </div>
                  <span className="text-[10px] font-semibold text-sky-400/70 shrink-0 mt-0.5 bg-sky-500/10 px-2 py-0.5 rounded-full whitespace-nowrap">
                    {stretch.duration}
                  </span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
