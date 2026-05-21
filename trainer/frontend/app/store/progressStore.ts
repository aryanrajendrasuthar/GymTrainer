"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface BodyWeightEntry {
  date: string; // YYYY-MM-DD
  weightKg: number;
}

export interface BodyMeasurements {
  waistCm?: number;
  chestCm?: number;
  hipsCm?: number;
  neckCm?: number;
  leftArmCm?: number;
  rightArmCm?: number;
  leftThighCm?: number;
}

export interface BodyMeasurementEntry {
  date: string; // YYYY-MM-DD
  measurements: BodyMeasurements;
}

interface ProgressState {
  bodyWeightLogs: BodyWeightEntry[];
  bodyMeasurementLogs: BodyMeasurementEntry[];
  addWeightLog: (weightKg: number) => void;
  setWeightLogs: (logs: BodyWeightEntry[]) => void;
  addMeasurementLog: (measurements: BodyMeasurements) => void;
}

export const useProgressStore = create<ProgressState>()(
  persist(
    (set) => ({
      bodyWeightLogs: [],
      bodyMeasurementLogs: [],

      addWeightLog: (weightKg) => {
        const today = new Date().toISOString().split("T")[0];
        set((state) => {
          const filtered = state.bodyWeightLogs.filter((l) => l.date !== today);
          return {
            bodyWeightLogs: [{ date: today, weightKg }, ...filtered].slice(0, 365),
          };
        });
      },

      setWeightLogs: (logs) =>
        set((state) => {
          const remoteByDate = new Map(logs.map((l) => [l.date, l.weightKg]));
          const localOnly = state.bodyWeightLogs.filter((l) => !remoteByDate.has(l.date));
          const merged = [
            ...logs,
            ...localOnly,
          ].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 365);
          return { bodyWeightLogs: merged };
        }),

      addMeasurementLog: (measurements) => {
        const today = new Date().toISOString().split("T")[0];
        set((state) => {
          const filtered = state.bodyMeasurementLogs.filter((l) => l.date !== today);
          return {
            bodyMeasurementLogs: [
              { date: today, measurements },
              ...filtered,
            ].slice(0, 365),
          };
        });
      },
    }),
    { name: "trainer-progress" }
  )
);
