"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TrendingUp, Check, X, Edit3 } from "lucide-react";
import { Input } from "@/app/components/ui/Input";
import { Button } from "@/app/components/ui/Button";
import { type ProgressionSuggestion } from "@/app/types";
import { cn } from "@/app/lib/utils";

interface ProgressiveOverloadSuggestionProps {
  suggestion: ProgressionSuggestion;
  unit?: "kg" | "lb";
  onAccept: (weight: number) => void;
  onIgnore: () => void;
  className?: string;
}

export function ProgressiveOverloadSuggestion({
  suggestion,
  unit = "kg",
  onAccept,
  onIgnore,
  className,
}: ProgressiveOverloadSuggestionProps) {
  const [mode, setMode] = useState<"default" | "custom">("default");
  const [customWeight, setCustomWeight] = useState(suggestion.suggestedWeight.toString());
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  const handleAccept = () => {
    setDismissed(true);
    onAccept(suggestion.suggestedWeight);
  };

  const handleCustomAccept = () => {
    const w = parseFloat(customWeight);
    if (!isNaN(w) && w > 0) {
      setDismissed(true);
      onAccept(w);
    }
  };

  const handleIgnore = () => {
    setDismissed(true);
    onIgnore();
  };

  return (
    <AnimatePresence>
      {!dismissed && (
        <motion.div
          initial={{ opacity: 0, y: -12, height: 0 }}
          animate={{ opacity: 1, y: 0, height: "auto" }}
          exit={{ opacity: 0, y: -12, height: 0 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className={cn(
            "bg-trainer-indigo/10 border border-trainer-indigo/30 rounded-[12px] p-3 overflow-hidden",
            className
          )}
        >
          <div className="flex items-start gap-2.5">
            <div className="w-7 h-7 rounded-full bg-trainer-indigo/20 flex items-center justify-center shrink-0 mt-0.5">
              <TrendingUp size={14} className="text-trainer-indigo" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white">You nailed it last time!</p>
              <p className="text-xs text-white/50 mt-0.5">
                Try <span className="text-trainer-indigo font-semibold">
                  +{suggestion.increaseAmountKg}{unit}
                </span>{" "}
                today → <span className="font-semibold text-white/80">
                  {suggestion.suggestedWeight}{unit}
                </span>
                {suggestion.suggestedWeight - suggestion.increaseAmountKg > 0 && (
                  <span className="text-white/30 ml-1">
                    ({Math.round((suggestion.increaseAmountKg / (suggestion.suggestedWeight - suggestion.increaseAmountKg)) * 100)}% heavier)
                  </span>
                )}
              </p>

              {mode === "custom" && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="mt-2.5 flex gap-2"
                >
                  <Input
                    type="number"
                    value={customWeight}
                    onChange={(e) => setCustomWeight(e.target.value)}
                    className="h-9 py-0 text-sm"
                    placeholder={`Weight in ${unit}`}
                    min="0"
                    step="0.5"
                  />
                  <Button
                    size="sm"
                    onClick={handleCustomAccept}
                    className="shrink-0"
                  >
                    Set
                  </Button>
                </motion.div>
              )}

              {mode === "default" && (
                <div className="flex items-center gap-2 mt-2.5">
                  <Button size="sm" onClick={handleAccept} className="h-8 px-3 text-xs">
                    <Check size={12} />
                    Accept
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setMode("custom")}
                    className="h-8 px-3 text-xs"
                  >
                    <Edit3 size={12} />
                    Custom
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleIgnore}
                    className="h-8 px-3 text-xs text-white/40"
                  >
                    <X size={12} />
                    Skip
                  </Button>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
