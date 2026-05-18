"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Smartphone, X } from "lucide-react";
import { useInstallPrompt } from "@/app/hooks/useInstallPrompt";

const DISMISS_KEY = "trainer-install-dismissed";

export function InstallBanner() {
  const { canInstall, triggerInstall } = useInstallPrompt();
  const [dismissed, setDismissed] = useState(true); // start hidden to avoid SSR flash

  useEffect(() => {
    const ts = localStorage.getItem(DISMISS_KEY);
    if (!ts) {
      setDismissed(false);
      return;
    }
    // Re-show after 14 days
    const age = Date.now() - parseInt(ts, 10);
    if (age > 14 * 86400000) {
      localStorage.removeItem(DISMISS_KEY);
      setDismissed(false);
    }
  }, []);

  function handleDismiss() {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setDismissed(true);
  }

  async function handleInstall() {
    await triggerInstall();
    setDismissed(true);
  }

  const show = canInstall && !dismissed;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 12, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8, scale: 0.97 }}
          transition={{ type: "spring", stiffness: 350, damping: 28 }}
          className="mx-5 mb-1 flex items-center gap-3 px-4 py-3.5 rounded-[16px] bg-trainer-indigo/10 border border-trainer-indigo/25"
        >
          <div className="w-9 h-9 rounded-[10px] bg-trainer-indigo/15 flex items-center justify-center shrink-0">
            <Smartphone size={16} className="text-trainer-indigo" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white">Add to Home Screen</p>
            <p className="text-xs text-white/40 mt-0.5">Install for the full app experience</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleInstall}
              className="px-3 py-1.5 rounded-[8px] bg-trainer-indigo text-xs font-bold text-white hover:bg-trainer-indigo-hover transition-colors"
            >
              Install
            </button>
            <button
              onClick={handleDismiss}
              className="w-7 h-7 rounded-full bg-white/8 flex items-center justify-center text-white/40 hover:text-white transition-colors"
              aria-label="Dismiss"
            >
              <X size={13} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
