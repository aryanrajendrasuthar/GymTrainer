import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export function formatRelativeDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 14) return "1 week ago";
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 60) return "1 month ago";
  return `${Math.floor(diffDays / 30)} months ago`;
}

export function formatVolume(volumeKg: number, unit: "kg" | "lb"): string {
  const value = unit === "lb" ? volumeKg * 2.20462 : volumeKg;
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}k${unit}`;
  }
  return `${value.toFixed(1)}${unit}`;
}

export function calculateBMI(weightKg: number, heightCm: number): number {
  const heightM = heightCm / 100;
  return weightKg / (heightM * heightM);
}

export function getBMICategory(bmi: number): { label: string; color: string } {
  if (bmi < 18.5) return { label: "Underweight", color: "text-trainer-warning" };
  if (bmi < 25) return { label: "Normal", color: "text-trainer-success" };
  if (bmi < 30) return { label: "Overweight", color: "text-trainer-warning" };
  return { label: "Obese", color: "text-trainer-danger" };
}

export function calculateEpleyOneRepMax(weight: number, reps: number): number {
  if (reps === 1) return weight;
  return Math.round(weight * (1 + reps / 30));
}

export function kgToLb(kg: number): number {
  return Math.round(kg * 2.20462 * 4) / 4;
}

export function lbToKg(lb: number): number {
  return Math.round(lb / 2.20462 * 4) / 4;
}

export function convertWeight(value: number, from: "kg" | "lb", to: "kg" | "lb"): number {
  if (from === to) return value;
  return from === "kg" ? kgToLb(value) : lbToKg(value);
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
