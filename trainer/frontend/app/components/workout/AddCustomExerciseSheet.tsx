"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check, Plus } from "lucide-react";
import {
  useCustomExerciseStore,
  buildCustomExercise,
} from "@/app/store/customExerciseStore";
import type { ExerciseCategory, Equipment, MuscleGroup } from "@/app/types";
import { cn } from "@/app/lib/utils";

// ─── Config ──────────────────────────────────────────────────────────────────

const CATEGORIES: { value: ExerciseCategory; label: string }[] = [
  { value: "chest",      label: "Chest"     },
  { value: "back",       label: "Back"      },
  { value: "shoulders",  label: "Shoulders" },
  { value: "arms",       label: "Arms"      },
  { value: "legs",       label: "Legs"      },
  { value: "glutes",     label: "Glutes"    },
  { value: "core",       label: "Core"      },
  { value: "full-body",  label: "Full Body" },
  { value: "cardio",     label: "Cardio"    },
];

const MUSCLES: { value: MuscleGroup; label: string }[] = [
  { value: "pectoralis-major-upper",    label: "Upper Chest"   },
  { value: "pectoralis-major-lower",    label: "Lower Chest"   },
  { value: "latissimus-dorsi",          label: "Lats"          },
  { value: "rhomboids",                 label: "Rhomboids"     },
  { value: "upper-trapezius",           label: "Traps"         },
  { value: "anterior-deltoid",          label: "Front Delt"    },
  { value: "lateral-deltoid",           label: "Side Delt"     },
  { value: "posterior-deltoid",         label: "Rear Delt"     },
  { value: "biceps-brachii-long",       label: "Biceps"        },
  { value: "triceps-long",              label: "Triceps"       },
  { value: "quadriceps-rectus-femoris", label: "Quads"         },
  { value: "hamstrings-biceps-femoris", label: "Hamstrings"    },
  { value: "gluteus-maximus",           label: "Glutes"        },
  { value: "gastrocnemius",             label: "Calves"        },
  { value: "rectus-abdominis-upper",    label: "Abs"           },
  { value: "erector-spinae-lower",      label: "Lower Back"    },
];

const EQUIPMENT_OPTIONS: { value: Equipment; label: string }[] = [
  { value: "barbell",        label: "Barbell"    },
  { value: "dumbbell",       label: "Dumbbell"   },
  { value: "cable",          label: "Cable"      },
  { value: "machine",        label: "Machine"    },
  { value: "bodyweight",     label: "Bodyweight" },
  { value: "resistance-band",label: "Band"       },
  { value: "kettlebell",     label: "Kettlebell" },
  { value: "pull-up-bar",    label: "Pull-up Bar"},
  { value: "none",           label: "None"       },
];

const MOVEMENT_TYPES = [
  { value: "compound"  as const, label: "Compound"  },
  { value: "isolation" as const, label: "Isolation"  },
  { value: "cardio"    as const, label: "Cardio"     },
];

const DIFFICULTIES = [
  { value: "beginner"     as const, label: "Beginner"     },
  { value: "intermediate" as const, label: "Intermediate" },
  { value: "advanced"     as const, label: "Advanced"     },
];

// ─── Helper ───────────────────────────────────────────────────────────────────

function ChipGroup<T extends string>({
  label,
  options,
  selected,
  multi = false,
  onChange,
}: {
  label: string;
  options: { value: T; label: string }[];
  selected: T | T[] | null;
  multi?: boolean;
  onChange: (v: T | T[]) => void;
}) {
  function toggle(val: T) {
    if (multi) {
      const arr = (selected as T[]) ?? [];
      if (arr.includes(val)) onChange(arr.filter((x) => x !== val));
      else onChange([...arr, val]);
    } else {
      onChange(val === selected ? (null as unknown as T) : val);
    }
  }

  return (
    <div>
      <p className="text-[10px] text-white/30 uppercase tracking-widest font-semibold mb-2">{label}</p>
      <div className="flex flex-wrap gap-1.5">
        {options.map((opt) => {
          const active = multi
            ? ((selected as T[]) ?? []).includes(opt.value)
            : selected === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => toggle(opt.value)}
              className={cn(
                "px-2.5 py-1 rounded-full text-xs font-semibold border transition-all",
                active
                  ? "bg-trainer-indigo/15 border-trainer-indigo/40 text-white"
                  : "bg-white/4 border-white/8 text-white/40 hover:text-white/65"
              )}
            >
              {opt.label}
              {active && <Check size={9} className="inline ml-1 text-trainer-indigo" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Sheet ────────────────────────────────────────────────────────────────────

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated?: (id: string) => void;
}

export function AddCustomExerciseSheet({ open, onClose, onCreated }: Props) {
  const { addCustomExercise } = useCustomExerciseStore();

  const [name,       setName]       = useState("");
  const [category,   setCategory]   = useState<ExerciseCategory | null>(null);
  const [muscles,    setMuscles]    = useState<MuscleGroup[]>([]);
  const [equipment,  setEquipment]  = useState<Equipment[]>([]);
  const [difficulty, setDifficulty] = useState<"beginner" | "intermediate" | "advanced">("intermediate");
  const [movement,   setMovement]   = useState<"compound" | "isolation" | "cardio">("compound");
  const [saved,      setSaved]      = useState(false);

  const canSave = name.trim().length >= 2 && category !== null && muscles.length > 0 && equipment.length > 0;

  function handleSave() {
    if (!canSave || !category) return;
    const ex = buildCustomExercise(name, category, muscles, equipment, difficulty, movement);
    addCustomExercise(ex);
    setSaved(true);
    setTimeout(() => {
      onCreated?.(ex.id);
      handleClose();
    }, 800);
  }

  function handleClose() {
    setName(""); setCategory(null); setMuscles([]); setEquipment([]);
    setDifficulty("intermediate"); setMovement("compound"); setSaved(false);
    onClose();
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/65 z-40"
          />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 360, damping: 38 }}
            className="fixed inset-x-0 bottom-0 z-50 bg-trainer-elevated border-t border-white/10 rounded-t-[24px]"
            style={{ maxHeight: "90vh" }}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1 shrink-0">
              <div className="w-9 h-1 rounded-full bg-white/15" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-4 pb-3">
              <p className="text-base font-bold text-white">New Custom Exercise</p>
              <button
                onClick={handleClose}
                className="w-7 h-7 rounded-full bg-white/8 flex items-center justify-center text-white/40 hover:text-white transition-colors"
              >
                <X size={14} />
              </button>
            </div>

            {/* Scrollable form */}
            <div className="overflow-y-auto px-4 pb-8 flex flex-col gap-4" style={{ maxHeight: "calc(90vh - 100px)" }}>

              {/* Name */}
              <div>
                <p className="text-[10px] text-white/30 uppercase tracking-widest font-semibold mb-2">Exercise Name</p>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Cable Fly Crossover"
                  className="w-full bg-trainer-surface border border-white/10 rounded-[10px] px-3 py-2.5 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-trainer-indigo/40"
                  style={{ fontSize: "16px" }}
                  maxLength={60}
                />
              </div>

              {/* Category */}
              <ChipGroup
                label="Category"
                options={CATEGORIES}
                selected={category}
                onChange={(v) => setCategory(v as ExerciseCategory)}
              />

              {/* Primary Muscles */}
              <ChipGroup
                label="Primary Muscles (select all that apply)"
                options={MUSCLES}
                selected={muscles}
                multi
                onChange={(v) => setMuscles(v as MuscleGroup[])}
              />

              {/* Equipment */}
              <ChipGroup
                label="Equipment"
                options={EQUIPMENT_OPTIONS}
                selected={equipment}
                multi
                onChange={(v) => setEquipment(v as Equipment[])}
              />

              {/* Movement Type */}
              <ChipGroup
                label="Movement Type"
                options={MOVEMENT_TYPES}
                selected={movement}
                onChange={(v) => setMovement(v as typeof movement)}
              />

              {/* Difficulty */}
              <ChipGroup
                label="Difficulty"
                options={DIFFICULTIES}
                selected={difficulty}
                onChange={(v) => setDifficulty(v as typeof difficulty)}
              />

              {/* Save */}
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleSave}
                disabled={!canSave}
                className={cn(
                  "w-full py-3.5 rounded-[14px] text-sm font-bold flex items-center justify-center gap-2 transition-all mt-2",
                  saved
                    ? "bg-trainer-success text-white"
                    : canSave
                    ? "bg-trainer-indigo text-white shadow-lg shadow-trainer-indigo/30"
                    : "bg-white/6 text-white/25 cursor-not-allowed"
                )}
              >
                {saved ? (
                  <><Check size={15} /> Saved!</>
                ) : (
                  <><Plus size={15} /> Create Exercise</>
                )}
              </motion.button>

              {!canSave && (
                <p className="text-[11px] text-white/20 text-center -mt-2">
                  Fill in name, category, muscles, and equipment to continue
                </p>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
