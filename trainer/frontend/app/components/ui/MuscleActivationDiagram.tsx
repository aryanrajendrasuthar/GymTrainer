"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { type MuscleGroup } from "@/app/types";
import { cn } from "@/app/lib/utils";

interface MuscleActivationDiagramProps {
  primaryMuscles: MuscleGroup[];
  secondaryMuscles: MuscleGroup[];
  size?: "sm" | "md" | "lg";
  mode?: "gym" | "physio";
  affectedArea?: MuscleGroup[];
  rehabilitationMuscles?: MuscleGroup[];
  className?: string;
}

const PRIMARY_COLOR = "#6C63FF";
const SECONDARY_COLOR = "rgba(108,99,255,0.35)";
const AFFECTED_COLOR = "#FF4757";
const REHAB_COLOR = "#00D4AA";
const RESTING_COLOR = "rgba(255,255,255,0.06)";

function getMuscleColor(
  muscle: string,
  primaryMuscles: MuscleGroup[],
  secondaryMuscles: MuscleGroup[],
  mode: "gym" | "physio",
  affectedArea: MuscleGroup[],
  rehabilitationMuscles: MuscleGroup[]
): string {
  if (mode === "physio") {
    if (affectedArea.includes(muscle as MuscleGroup)) return AFFECTED_COLOR;
    if (rehabilitationMuscles.includes(muscle as MuscleGroup)) return REHAB_COLOR;
  } else {
    if (primaryMuscles.includes(muscle as MuscleGroup)) return PRIMARY_COLOR;
    if (secondaryMuscles.includes(muscle as MuscleGroup)) return SECONDARY_COLOR;
  }
  return RESTING_COLOR;
}

function isActive(
  muscle: string,
  primaryMuscles: MuscleGroup[],
  secondaryMuscles: MuscleGroup[],
  mode: "gym" | "physio",
  affectedArea: MuscleGroup[],
  rehabilitationMuscles: MuscleGroup[]
): boolean {
  if (mode === "physio") {
    return affectedArea.includes(muscle as MuscleGroup) || rehabilitationMuscles.includes(muscle as MuscleGroup);
  }
  return primaryMuscles.includes(muscle as MuscleGroup) || secondaryMuscles.includes(muscle as MuscleGroup);
}

const MUSCLE_DISPLAY_NAMES: Record<string, string> = {
  "neck": "Neck",
  "upper-trapezius": "Upper Trapezius",
  "lower-trapezius": "Lower Trapezius",
  "anterior-deltoid": "Front Deltoid",
  "lateral-deltoid": "Side Deltoid",
  "posterior-deltoid": "Rear Deltoid",
  "pectoralis-major-upper": "Upper Chest",
  "pectoralis-major-lower": "Lower Chest",
  "pectoralis-minor": "Pectoralis Minor",
  "biceps-brachii-long": "Biceps (Long Head)",
  "biceps-brachii-short": "Biceps (Short Head)",
  "brachialis": "Brachialis",
  "brachioradialis": "Brachioradialis",
  "forearm-flexors": "Forearm Flexors",
  "forearm-extensors": "Forearm Extensors",
  "rectus-abdominis-upper": "Upper Abs",
  "rectus-abdominis-lower": "Lower Abs",
  "obliques": "Obliques",
  "serratus-anterior": "Serratus Anterior",
  "latissimus-dorsi": "Lats",
  "rhomboids": "Rhomboids",
  "teres-major": "Teres Major",
  "teres-minor": "Teres Minor",
  "infraspinatus": "Infraspinatus",
  "supraspinatus": "Supraspinatus",
  "triceps-long": "Triceps (Long Head)",
  "triceps-lateral": "Triceps (Lateral Head)",
  "triceps-medial": "Triceps (Medial Head)",
  "erector-spinae-upper": "Upper Erectors",
  "erector-spinae-lower": "Lower Erectors",
  "gluteus-maximus": "Glutes (Maximus)",
  "gluteus-medius": "Glutes (Medius)",
  "gluteus-minimus": "Glutes (Minimus)",
  "piriformis": "Piriformis",
  "hamstrings-biceps-femoris": "Hamstrings (Biceps Femoris)",
  "hamstrings-semimembranosus": "Hamstrings (Semimembranosus)",
  "hamstrings-semitendinosus": "Hamstrings (Semitendinosus)",
  "quadriceps-rectus-femoris": "Quads (Rectus Femoris)",
  "quadriceps-vastus-lateralis": "Quads (Vastus Lateralis)",
  "quadriceps-vastus-medialis": "Quads (VMO)",
  "quadriceps-vastus-intermedius": "Quads (Vastus Intermedius)",
  "adductors": "Adductors",
  "hip-flexors": "Hip Flexors",
  "tibialis-anterior": "Tibialis Anterior",
  "gastrocnemius": "Gastrocnemius",
  "soleus": "Soleus",
  "peroneals": "Peroneals",
};

export function MuscleActivationDiagram({
  primaryMuscles,
  secondaryMuscles,
  size = "md",
  mode = "gym",
  affectedArea = [],
  rehabilitationMuscles = [],
  className,
}: MuscleActivationDiagramProps) {
  const [tooltip, setTooltip] = useState<string | null>(null);

  const sizeMap = { sm: 120, md: 180, lg: 240 };
  const svgHeight = sizeMap[size];
  const svgWidth = svgHeight * 0.45;

  const getColor = (muscle: string) =>
    getMuscleColor(muscle, primaryMuscles, secondaryMuscles, mode, affectedArea, rehabilitationMuscles);
  const checkActive = (muscle: string) =>
    isActive(muscle, primaryMuscles, secondaryMuscles, mode, affectedArea, rehabilitationMuscles);

  const MuscleGroup = ({ id, d, style }: { id: string; d: string; style?: React.CSSProperties }) => {
    const active = checkActive(id);
    const color = getColor(id);

    return (
      <motion.path
        id={id}
        d={d}
        fill={color}
        stroke={active ? color : "rgba(255,255,255,0.04)"}
        strokeWidth={0.5}
        animate={{
          fill: color,
          opacity: active ? 1 : 0.6,
        }}
        whileHover={{ opacity: 1, filter: "brightness(1.3)" }}
        transition={{ duration: 0.3 }}
        onHoverStart={() => setTooltip(MUSCLE_DISPLAY_NAMES[id] || id)}
        onHoverEnd={() => setTooltip(null)}
        onTouchStart={() => setTooltip(tooltip === MUSCLE_DISPLAY_NAMES[id] ? null : MUSCLE_DISPLAY_NAMES[id] || id)}
        className="cursor-pointer"
        style={style}
      />
    );
  };

  return (
    <div className={cn("flex gap-4 items-center justify-center relative", className)}>
      {/* Anterior (front) view */}
      <div className="flex flex-col items-center gap-1">
        <span className="text-[9px] text-white/30 uppercase tracking-widest">Front</span>
        <svg
          viewBox="0 0 60 160"
          width={svgWidth}
          height={svgHeight}
          xmlns="http://www.w3.org/2000/svg"
          aria-label="Front body diagram"
        >
          {/* Head */}
          <ellipse cx="30" cy="8" rx="8" ry="9" fill={getColor("neck")} stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" />

          {/* Neck */}
          <MuscleGroup id="neck" d="M26 16 L34 16 L33 22 L27 22 Z" />

          {/* Shoulders */}
          <MuscleGroup id="anterior-deltoid" d="M12 25 C8 24 6 28 7 33 L13 30 Z" />
          <MuscleGroup id="anterior-deltoid" d="M48 25 C52 24 54 28 53 33 L47 30 Z" />
          <MuscleGroup id="lateral-deltoid" d="M10 28 C7 30 7 34 9 36 L14 32 Z" />
          <MuscleGroup id="lateral-deltoid" d="M50 28 C53 30 53 34 51 36 L46 32 Z" />

          {/* Upper chest */}
          <MuscleGroup id="pectoralis-major-upper" d="M14 22 L30 20 L30 30 C22 30 15 28 14 22 Z" />
          <MuscleGroup id="pectoralis-major-upper" d="M46 22 L30 20 L30 30 C38 30 45 28 46 22 Z" />

          {/* Lower chest */}
          <MuscleGroup id="pectoralis-major-lower" d="M15 30 L30 30 L30 37 C24 37 15 35 15 30 Z" />
          <MuscleGroup id="pectoralis-major-lower" d="M45 30 L30 30 L30 37 C36 37 45 35 45 30 Z" />

          {/* Serratus */}
          <MuscleGroup id="serratus-anterior" d="M13 30 L16 30 L15 42 L11 40 Z" />
          <MuscleGroup id="serratus-anterior" d="M47 30 L44 30 L45 42 L49 40 Z" />

          {/* Upper abs */}
          <MuscleGroup id="rectus-abdominis-upper" d="M22 37 L38 37 L38 48 L22 48 Z" />

          {/* Lower abs */}
          <MuscleGroup id="rectus-abdominis-lower" d="M22 48 L38 48 L37 60 L23 60 Z" />

          {/* Obliques */}
          <MuscleGroup id="obliques" d="M14 37 L22 37 L22 56 L16 56 Z" />
          <MuscleGroup id="obliques" d="M46 37 L38 37 L38 56 L44 56 Z" />

          {/* Biceps */}
          <MuscleGroup id="biceps-brachii-long" d="M8 34 C6 38 6 44 8 48 L12 44 L12 36 Z" />
          <MuscleGroup id="biceps-brachii-long" d="M52 34 C54 38 54 44 52 48 L48 44 L48 36 Z" />
          <MuscleGroup id="biceps-brachii-short" d="M11 36 L14 36 L14 44 L11 44 Z" />
          <MuscleGroup id="biceps-brachii-short" d="M49 36 L46 36 L46 44 L49 44 Z" />

          {/* Brachialis */}
          <MuscleGroup id="brachialis" d="M8 44 L12 44 L12 50 L8 50 Z" />
          <MuscleGroup id="brachialis" d="M52 44 L48 44 L48 50 L52 50 Z" />

          {/* Forearms */}
          <MuscleGroup id="forearm-flexors" d="M7 50 C5 54 5 60 7 62 L12 60 L12 50 Z" />
          <MuscleGroup id="forearm-flexors" d="M53 50 C55 54 55 60 53 62 L48 60 L48 50 Z" />

          {/* Hip flexors */}
          <MuscleGroup id="hip-flexors" d="M21 60 L30 60 L30 68 L21 68 Z" />
          <MuscleGroup id="hip-flexors" d="M39 60 L30 60 L30 68 L39 68 Z" />

          {/* Quadriceps */}
          <MuscleGroup id="quadriceps-rectus-femoris" d="M23 68 L30 68 L30 98 L23 98 Z" />
          <MuscleGroup id="quadriceps-rectus-femoris" d="M37 68 L30 68 L30 98 L37 98 Z" />
          <MuscleGroup id="quadriceps-vastus-lateralis" d="M19 70 L23 70 L23 100 L19 95 Z" />
          <MuscleGroup id="quadriceps-vastus-lateralis" d="M41 70 L37 70 L37 100 L41 95 Z" />
          <MuscleGroup id="quadriceps-vastus-medialis" d="M23 88 L28 88 L28 100 L23 100 Z" />
          <MuscleGroup id="quadriceps-vastus-medialis" d="M37 88 L32 88 L32 100 L37 100 Z" />

          {/* Adductors */}
          <MuscleGroup id="adductors" d="M21 68 L28 68 L27 96 L20 96 Z" />
          <MuscleGroup id="adductors" d="M39 68 L32 68 L33 96 L40 96 Z" />

          {/* Knee */}
          <rect x="19" y="98" width="10" height="8" rx="2" fill="rgba(255,255,255,0.04)" />
          <rect x="31" y="98" width="10" height="8" rx="2" fill="rgba(255,255,255,0.04)" />

          {/* Tibialis anterior */}
          <MuscleGroup id="tibialis-anterior" d="M20 106 L24 106 L23 130 L20 130 Z" />
          <MuscleGroup id="tibialis-anterior" d="M40 106 L36 106 L37 130 L40 130 Z" />

          {/* Peroneals */}
          <MuscleGroup id="peroneals" d="M17 108 L20 108 L20 128 L17 124 Z" />
          <MuscleGroup id="peroneals" d="M43 108 L40 108 L40 128 L43 124 Z" />

          {/* Gastrocnemius */}
          <MuscleGroup id="gastrocnemius" d="M20 130 L28 130 L27 148 L21 148 Z" />
          <MuscleGroup id="gastrocnemius" d="M40 130 L32 130 L33 148 L39 148 Z" />

          {/* Soleus */}
          <MuscleGroup id="soleus" d="M22 142 L28 142 L27 154 L22 154 Z" />
          <MuscleGroup id="soleus" d="M38 142 L32 142 L33 154 L38 154 Z" />

          {/* Feet outline */}
          <ellipse cx="24" cy="157" rx="6" ry="3" fill="rgba(255,255,255,0.04)" />
          <ellipse cx="36" cy="157" rx="6" ry="3" fill="rgba(255,255,255,0.04)" />
        </svg>
      </div>

      {/* Posterior (back) view */}
      <div className="flex flex-col items-center gap-1">
        <span className="text-[9px] text-white/30 uppercase tracking-widest">Back</span>
        <svg
          viewBox="0 0 60 160"
          width={svgWidth}
          height={svgHeight}
          xmlns="http://www.w3.org/2000/svg"
          aria-label="Back body diagram"
        >
          {/* Head */}
          <ellipse cx="30" cy="8" rx="8" ry="9" fill="rgba(255,255,255,0.06)" />

          {/* Upper trap */}
          <MuscleGroup id="upper-trapezius" d="M14 17 L30 16 L30 26 C22 26 14 23 14 17 Z" />
          <MuscleGroup id="upper-trapezius" d="M46 17 L30 16 L30 26 C38 26 46 23 46 17 Z" />

          {/* Lower trap */}
          <MuscleGroup id="lower-trapezius" d="M14 26 L30 26 L30 36 C22 38 14 34 14 26 Z" />
          <MuscleGroup id="lower-trapezius" d="M46 26 L30 26 L30 36 C38 38 46 34 46 26 Z" />

          {/* Rear deltoid */}
          <MuscleGroup id="posterior-deltoid" d="M10 24 C7 25 6 29 8 33 L13 29 Z" />
          <MuscleGroup id="posterior-deltoid" d="M50 24 C53 25 54 29 52 33 L47 29 Z" />

          {/* Rhomboids */}
          <MuscleGroup id="rhomboids" d="M18 26 L30 24 L30 36 L18 34 Z" />
          <MuscleGroup id="rhomboids" d="M42 26 L30 24 L30 36 L42 34 Z" />

          {/* Infraspinatus / teres */}
          <MuscleGroup id="infraspinatus" d="M14 30 L20 30 L20 40 L14 38 Z" />
          <MuscleGroup id="infraspinatus" d="M46 30 L40 30 L40 40 L46 38 Z" />
          <MuscleGroup id="teres-major" d="M14 38 L18 38 L18 44 L13 42 Z" />
          <MuscleGroup id="teres-major" d="M46 38 L42 38 L42 44 L47 42 Z" />
          <MuscleGroup id="teres-minor" d="M13 32 L16 32 L16 38 L13 36 Z" />
          <MuscleGroup id="teres-minor" d="M47 32 L44 32 L44 38 L47 36 Z" />

          {/* Lats */}
          <MuscleGroup id="latissimus-dorsi" d="M13 30 L20 30 L22 58 L14 56 Z" />
          <MuscleGroup id="latissimus-dorsi" d="M47 30 L40 30 L38 58 L46 56 Z" />

          {/* Triceps */}
          <MuscleGroup id="triceps-long" d="M8 32 L12 32 L12 50 L8 48 Z" />
          <MuscleGroup id="triceps-long" d="M52 32 L48 32 L48 50 L52 48 Z" />
          <MuscleGroup id="triceps-lateral" d="M11 34 L14 34 L14 48 L11 48 Z" />
          <MuscleGroup id="triceps-lateral" d="M49 34 L46 34 L46 48 L49 48 Z" />
          <MuscleGroup id="triceps-medial" d="M9 44 L12 44 L12 52 L9 52 Z" />
          <MuscleGroup id="triceps-medial" d="M51 44 L48 44 L48 52 L51 52 Z" />

          {/* Forearm extensors */}
          <MuscleGroup id="forearm-extensors" d="M7 50 C5 54 5 62 7 64 L12 62 L12 50 Z" />
          <MuscleGroup id="forearm-extensors" d="M53 50 C55 54 55 62 53 64 L48 62 L48 50 Z" />

          {/* Erector spinae */}
          <MuscleGroup id="erector-spinae-upper" d="M25 36 L29 36 L29 56 L25 56 Z" />
          <MuscleGroup id="erector-spinae-upper" d="M35 36 L31 36 L31 56 L35 56 Z" />
          <MuscleGroup id="erector-spinae-lower" d="M25 56 L29 56 L29 68 L25 68 Z" />
          <MuscleGroup id="erector-spinae-lower" d="M35 56 L31 56 L31 68 L35 68 Z" />

          {/* Glutes */}
          <MuscleGroup id="gluteus-maximus" d="M19 62 L30 62 L30 82 L18 80 Z" />
          <MuscleGroup id="gluteus-maximus" d="M41 62 L30 62 L30 82 L42 80 Z" />
          <MuscleGroup id="gluteus-medius" d="M14 56 L20 56 L20 68 L14 65 Z" />
          <MuscleGroup id="gluteus-medius" d="M46 56 L40 56 L40 68 L46 65 Z" />
          <MuscleGroup id="gluteus-minimus" d="M19 62 L24 62 L24 70 L19 68 Z" />
          <MuscleGroup id="gluteus-minimus" d="M41 62 L36 62 L36 70 L41 68 Z" />

          {/* Piriformis */}
          <MuscleGroup id="piriformis" d="M22 68 L30 68 L30 74 L22 72 Z" />
          <MuscleGroup id="piriformis" d="M38 68 L30 68 L30 74 L38 72 Z" />

          {/* Hamstrings */}
          <MuscleGroup id="hamstrings-biceps-femoris" d="M30 80 L38 80 L37 108 L30 108 Z" />
          <MuscleGroup id="hamstrings-biceps-femoris" d="M30 80 L22 80 L23 108 L30 108 Z" />
          <MuscleGroup id="hamstrings-semimembranosus" d="M26 80 L30 80 L30 106 L26 106 Z" />
          <MuscleGroup id="hamstrings-semitendinosus" d="M34 80 L30 80 L30 106 L34 106 Z" />

          {/* Calves */}
          <MuscleGroup id="gastrocnemius" d="M21 108 L29 108 L28 136 L21 134 Z" />
          <MuscleGroup id="gastrocnemius" d="M39 108 L31 108 L32 136 L39 134 Z" />
          <MuscleGroup id="soleus" d="M21 130 L28 130 L27 150 L21 148 Z" />
          <MuscleGroup id="soleus" d="M39 130 L32 130 L33 150 L39 148 Z" />

          {/* Peroneals back */}
          <MuscleGroup id="peroneals" d="M17 110 L20 110 L20 130 L17 128 Z" />
          <MuscleGroup id="peroneals" d="M43 110 L40 110 L40 130 L43 128 Z" />

          {/* Feet outline */}
          <ellipse cx="24" cy="153" rx="5" ry="3" fill="rgba(255,255,255,0.04)" />
          <ellipse cx="36" cy="153" rx="5" ry="3" fill="rgba(255,255,255,0.04)" />
        </svg>
      </div>

      {/* Tooltip */}
      <AnimatePresence>
        {tooltip && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.15 }}
            className="absolute -top-8 left-1/2 -translate-x-1/2 bg-trainer-elevated border border-white/15 rounded-[8px] px-3 py-1.5 text-xs text-white whitespace-nowrap z-10 pointer-events-none shadow-lg"
          >
            {tooltip}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
