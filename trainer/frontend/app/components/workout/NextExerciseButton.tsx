"use client";

import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import { cn } from "@/app/lib/utils";

interface NextExerciseButtonProps {
  onClick: () => void;
  label?: string;
  isLast?: boolean;
  className?: string;
}

export function NextExerciseButton({
  onClick,
  label,
  isLast = false,
  className,
}: NextExerciseButtonProps) {
  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{
        opacity: 1,
        scale: 1,
        boxShadow: [
          "0 0 0px rgba(108,99,255,0)",
          "0 0 20px rgba(108,99,255,0.4)",
          "0 0 0px rgba(108,99,255,0)",
        ],
      }}
      transition={{
        opacity: { duration: 0.3 },
        scale: { duration: 0.3 },
        boxShadow: { duration: 2, repeat: Infinity, ease: "easeInOut" },
      }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className={cn(
        "w-full flex items-center justify-center gap-3 py-4 px-6 rounded-[14px]",
        isLast
          ? "bg-trainer-success text-trainer-black font-bold text-base"
          : "bg-trainer-indigo text-white font-bold text-base",
        "transition-colors duration-200",
        className
      )}
      aria-label={isLast ? "Complete workout" : label ?? "Next exercise"}
    >
      <div className="flex flex-col items-center gap-0.5">
        {!isLast && label && (
          <span className="text-[9px] uppercase tracking-widest opacity-50 font-normal">up next</span>
        )}
        <span>{isLast ? "Complete Workout" : (label ?? "Next Exercise")}</span>
      </div>
      <ChevronRight size={20} />
    </motion.button>
  );
}
