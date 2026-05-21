"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Bookmark, Play } from "lucide-react";
import { useWorkoutTemplateStore } from "@/app/store/workoutTemplateStore";
import { useCustomExerciseStore } from "@/app/store/customExerciseStore";
import { exerciseMap } from "@/app/data/exercises";
import { cn } from "@/app/lib/utils";

function relativeDate(iso: string): string {
  const diffDays = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  return `${Math.floor(diffDays / 30)}mo ago`;
}

export function WorkoutTemplatesCard() {
  const { templates, touchTemplate } = useWorkoutTemplateStore();
  const { customExercises } = useCustomExerciseStore();
  const router = useRouter();

  const mergedMap = useMemo(
    () => ({ ...exerciseMap, ...Object.fromEntries(customExercises.map((e) => [e.id, e])) }),
    [customExercises]
  );

  const sorted = useMemo(
    () =>
      [...templates]
        .sort((a, b) => (b.lastUsedAt ?? b.createdAt).localeCompare(a.lastUsedAt ?? a.createdAt))
        .slice(0, 4),
    [templates]
  );

  if (templates.length === 0) return null;

  function startTemplate(tpl: (typeof templates)[0]) {
    touchTemplate(tpl.id);
    const params = new URLSearchParams({
      exercises: tpl.exerciseIds.join(","),
      name: tpl.name,
    });
    router.push(`/workout?${params.toString()}`);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.08 }}
      className="bg-trainer-surface border border-white/8 rounded-[18px] overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-4 pt-4 pb-3">
        <div className="w-7 h-7 rounded-[8px] bg-trainer-indigo/12 flex items-center justify-center shrink-0">
          <Bookmark size={13} className="text-trainer-indigo" />
        </div>
        <p className="text-sm font-bold text-white">Saved Routines</p>
        <span className="ml-auto text-[10px] text-white/25 tabular-nums">{templates.length} saved</span>
      </div>

      {/* Template rows */}
      <div className="px-4 pb-4 flex flex-col gap-2">
        {sorted.map((tpl, i) => {
          const names = tpl.exerciseIds
            .slice(0, 3)
            .map((id) => mergedMap[id]?.name ?? id.replace(/-/g, " "));
          const extra = tpl.exerciseIds.length - 3;
          const preview = names.join(" · ") + (extra > 0 ? ` +${extra}` : "");

          return (
            <motion.div
              key={tpl.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.05 + i * 0.04 }}
              className="flex items-center gap-3 bg-trainer-elevated rounded-[12px] px-3 py-3"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">{tpl.name}</p>
                <p className="text-[10px] text-white/30 truncate mt-0.5">{preview}</p>
              </div>
              <div className="flex items-center gap-2.5 shrink-0">
                <div className="flex flex-col items-end gap-0.5">
                  <span className="text-[10px] text-white/25 tabular-nums">
                    {tpl.exerciseIds.length} ex · ~{Math.round(tpl.exerciseIds.length * 10)}min
                  </span>
                  <span className="text-[9px] text-white/18">
                    {tpl.lastUsedAt ? relativeDate(tpl.lastUsedAt) : "Never used"}
                  </span>
                </div>
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => startTemplate(tpl)}
                  className="w-8 h-8 rounded-full bg-trainer-indigo flex items-center justify-center shadow-lg shadow-trainer-indigo/30 hover:bg-trainer-indigo-hover transition-colors"
                  aria-label={`Start ${tpl.name}`}
                >
                  <Play size={12} className="text-white translate-x-[1px]" />
                </motion.button>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
