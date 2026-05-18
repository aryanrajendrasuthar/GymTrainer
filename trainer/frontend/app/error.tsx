"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log to monitoring if available — no-op here
    console.error("[Trainer] Unhandled error:", error);
  }, [error]);

  return (
    <div className="min-h-screen gym-bg flex flex-col items-center justify-center px-5 text-center gap-6">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 24 }}
        className="w-16 h-16 rounded-full bg-trainer-danger/12 flex items-center justify-center"
      >
        <AlertTriangle size={28} className="text-trainer-danger/80" />
      </motion.div>

      <motion.div
        initial={{ y: 12, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        <h1 className="text-xl font-bold text-white mb-2">Something went wrong</h1>
        <p className="text-sm text-white/45 leading-relaxed max-w-xs">
          An unexpected error occurred. Your data is safe — try refreshing the page.
        </p>
      </motion.div>

      <motion.button
        initial={{ y: 12, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        onClick={reset}
        className="flex items-center gap-2 px-6 py-3 bg-trainer-indigo rounded-[14px] text-sm font-bold text-white hover:bg-trainer-indigo-hover transition-colors"
      >
        <RefreshCw size={15} />
        Try Again
      </motion.button>
    </div>
  );
}
