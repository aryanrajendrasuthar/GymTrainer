"use client";

import { motion } from "framer-motion";
import { Bell, Dumbbell, Heart, Flame, CheckCircle2, Circle } from "lucide-react";
import { cn } from "@/app/lib/utils";

export interface NotificationPrefs {
  workoutReminders: boolean;
  physioReminders: boolean;
  streakWarning: boolean;
}

interface NotificationsStepProps {
  value: NotificationPrefs;
  onChange: (prefs: NotificationPrefs) => void;
}

const OPTIONS = [
  {
    key: "workoutReminders" as const,
    label: "Workout reminders",
    sublabel: "Daily reminder at your scheduled workout time",
    icon: Dumbbell,
    color: "text-trainer-indigo",
    bg: "bg-trainer-indigo/15",
  },
  {
    key: "physioReminders" as const,
    label: "Physio reminders",
    sublabel: "Morning & evening rehab session nudges",
    icon: Heart,
    color: "text-trainer-danger",
    bg: "bg-trainer-danger/15",
  },
  {
    key: "streakWarning" as const,
    label: "Streak warnings",
    sublabel: "Alert after 8pm if your streak is at risk",
    icon: Flame,
    color: "text-trainer-warning",
    bg: "bg-trainer-warning/15",
  },
];

export function NotificationsStep({ value, onChange }: NotificationsStepProps) {
  function toggle(key: keyof NotificationPrefs) {
    onChange({ ...value, [key]: !value[key] });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3 p-4 rounded-[14px] bg-trainer-indigo/8 border border-trainer-indigo/20 mb-1">
        <Bell size={16} className="text-trainer-indigo shrink-0" />
        <p className="text-sm text-white/60 leading-snug">
          You can update these anytime in <span className="text-white font-semibold">Settings → Notifications</span>.
        </p>
      </div>

      {OPTIONS.map((opt, i) => {
        const Icon = opt.icon;
        const checked = value[opt.key];
        return (
          <motion.button
            key={opt.key}
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.08 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => toggle(opt.key)}
            className={cn(
              "flex items-center gap-4 p-4 rounded-[16px] border text-left transition-all",
              checked
                ? "border-white/15 bg-trainer-elevated"
                : "border-white/8 bg-trainer-elevated/50 opacity-60"
            )}
          >
            <div className={cn("w-10 h-10 rounded-[12px] flex items-center justify-center shrink-0", opt.bg)}>
              <Icon size={18} className={opt.color} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-white">{opt.label}</p>
              <p className="text-xs text-white/40 mt-0.5 leading-snug">{opt.sublabel}</p>
            </div>
            {checked
              ? <CheckCircle2 size={20} className="text-trainer-success shrink-0" />
              : <Circle size={20} className="text-white/20 shrink-0" />
            }
          </motion.button>
        );
      })}
    </div>
  );
}
