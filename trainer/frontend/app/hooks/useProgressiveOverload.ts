"use client";

import { useMemo, useCallback, useState } from "react";
import {
  type ExerciseLog,
  type FitnessGoal,
  type OverloadAmount,
  type ProgressionSuggestion,
} from "@/app/types";
import {
  analyseRoutine,
  getPendingSuggestions,
  detectDeloadSignal,
  type ProgressionAnalysis,
  type DeloadSignal,
} from "@/app/lib/progression-engine";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface OverloadDecision {
  exerciseId: string;
  accepted: boolean;
  customWeightKg?: number;
}

export interface UseProgressiveOverloadReturn {
  analyses: ProgressionAnalysis[];
  pendingSuggestions: ProgressionSuggestion[];
  deloadSignal: DeloadSignal;
  decisions: Record<string, OverloadDecision>;
  acceptSuggestion: (exerciseId: string) => void;
  ignoreSuggestion: (exerciseId: string) => void;
  setCustomWeight: (exerciseId: string, weightKg: number) => void;
  clearDecisions: () => void;
  hasPendingSuggestions: boolean;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useProgressiveOverload(
  exerciseIds: string[],
  allLogs: ExerciseLog[],
  goal: FitnessGoal,
  overloadAmount: OverloadAmount
): UseProgressiveOverloadReturn {
  const [decisions, setDecisions] = useState<Record<string, OverloadDecision>>({});

  const analyses = useMemo(
    () => analyseRoutine(exerciseIds, allLogs, goal, overloadAmount),
    [exerciseIds, allLogs, goal, overloadAmount]
  );

  const pendingSuggestions = useMemo(
    () =>
      getPendingSuggestions(analyses).filter(
        (s) => !decisions[s.exerciseId]
      ),
    [analyses, decisions]
  );

  const deloadSignal = useMemo(
    () => detectDeloadSignal(analyses),
    [analyses]
  );

  const acceptSuggestion = useCallback((exerciseId: string) => {
    setDecisions((prev) => ({
      ...prev,
      [exerciseId]: { exerciseId, accepted: true },
    }));
  }, []);

  const ignoreSuggestion = useCallback((exerciseId: string) => {
    setDecisions((prev) => ({
      ...prev,
      [exerciseId]: { exerciseId, accepted: false },
    }));
  }, []);

  const setCustomWeight = useCallback(
    (exerciseId: string, weightKg: number) => {
      setDecisions((prev) => ({
        ...prev,
        [exerciseId]: { exerciseId, accepted: true, customWeightKg: weightKg },
      }));
    },
    []
  );

  const clearDecisions = useCallback(() => {
    setDecisions({});
  }, []);

  return {
    analyses,
    pendingSuggestions,
    deloadSignal,
    decisions,
    acceptSuggestion,
    ignoreSuggestion,
    setCustomWeight,
    clearDecisions,
    hasPendingSuggestions: pendingSuggestions.length > 0,
  };
}

// ─── Suggested weight resolver (used when rendering sets) ────────────────────

export function useSuggestedWeight(
  exerciseId: string,
  decisions: Record<string, OverloadDecision>,
  suggestions: ProgressionSuggestion[],
  lastWeightKg: number
): number {
  const decision = decisions[exerciseId];
  if (decision?.customWeightKg != null) return decision.customWeightKg;
  if (decision?.accepted) {
    const suggestion = suggestions.find((s) => s.exerciseId === exerciseId);
    return suggestion?.suggestedWeight ?? lastWeightKg;
  }
  return lastWeightKg;
}
