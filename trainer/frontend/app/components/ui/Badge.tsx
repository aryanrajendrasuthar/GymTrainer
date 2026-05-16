"use client";

import { cn } from "@/app/lib/utils";

type BadgeColor =
  | "indigo"
  | "gold"
  | "success"
  | "warning"
  | "danger"
  | "muted"
  | "white";

interface BadgeProps {
  children: React.ReactNode;
  color?: BadgeColor;
  size?: "sm" | "md";
  className?: string;
}

const colorClasses: Record<BadgeColor, string> = {
  indigo: "bg-trainer-indigo/15 text-trainer-indigo border border-trainer-indigo/30",
  gold: "bg-trainer-gold/15 text-trainer-gold border border-trainer-gold/30",
  success: "bg-trainer-success/15 text-trainer-success border border-trainer-success/30",
  warning: "bg-trainer-warning/15 text-trainer-warning border border-trainer-warning/30",
  danger: "bg-trainer-danger/15 text-trainer-danger border border-trainer-danger/30",
  muted: "bg-white/5 text-white/50 border border-white/10",
  white: "bg-white/10 text-white border border-white/20",
};

export function Badge({ children, color = "indigo", size = "sm", className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center font-medium rounded-full",
        size === "sm" ? "px-2.5 py-0.5 text-xs" : "px-3 py-1 text-sm",
        colorClasses[color],
        className
      )}
    >
      {children}
    </span>
  );
}
