"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { X, CheckCircle, Info, AlertTriangle, AlertCircle } from "lucide-react";
import { useNotificationStore, type AppNotification } from "@/app/store/notificationStore";
import { cn } from "@/app/lib/utils";

const AUTO_DISMISS_MS = 4500;

const TYPE_STYLES: Record<AppNotification["type"], { bar: string; icon: React.ElementType; iconClass: string }> = {
  success: { bar: "bg-trainer-success",  icon: CheckCircle,   iconClass: "text-trainer-success" },
  info:    { bar: "bg-trainer-indigo",   icon: Info,          iconClass: "text-trainer-indigo" },
  warning: { bar: "bg-trainer-warning",  icon: AlertTriangle, iconClass: "text-trainer-warning" },
  danger:  { bar: "bg-trainer-danger",   icon: AlertCircle,   iconClass: "text-trainer-danger" },
};

function Toast({ n }: { n: AppNotification }) {
  const dismiss = useNotificationStore((s) => s.dismiss);
  const { bar, icon: Icon, iconClass } = TYPE_STYLES[n.type];

  useEffect(() => {
    const t = setTimeout(() => dismiss(n.id), AUTO_DISMISS_MS);
    return () => clearTimeout(t);
  }, [n.id, dismiss]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -20, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -12, scale: 0.96 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      className="flex items-start gap-3 bg-trainer-elevated border border-white/10 rounded-[14px] px-4 py-3 shadow-xl shadow-black/40 min-w-[280px] max-w-[340px]"
    >
      {/* Left color bar */}
      <div className={cn("w-0.5 self-stretch rounded-full shrink-0", bar)} />

      <Icon size={16} className={cn("shrink-0 mt-0.5", iconClass)} />

      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-white leading-tight">{n.title}</p>
        {n.body && <p className="text-xs text-white/50 mt-0.5 leading-relaxed">{n.body}</p>}
        {n.action && (
          <Link
            href={n.action.href}
            onClick={() => dismiss(n.id)}
            className="mt-1.5 inline-block text-xs font-bold text-trainer-indigo hover:text-trainer-indigo-hover"
          >
            {n.action.label} →
          </Link>
        )}
      </div>

      <button
        onClick={() => dismiss(n.id)}
        className="shrink-0 text-white/25 hover:text-white/60 transition-colors mt-0.5"
        aria-label="Dismiss"
      >
        <X size={14} />
      </button>
    </motion.div>
  );
}

export function NotificationToast() {
  const notifications = useNotificationStore((s) => s.notifications);

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 items-center pointer-events-none">
      <AnimatePresence mode="sync">
        {notifications.map((n) => (
          <div key={n.id} className="pointer-events-auto">
            <Toast n={n} />
          </div>
        ))}
      </AnimatePresence>
    </div>
  );
}
