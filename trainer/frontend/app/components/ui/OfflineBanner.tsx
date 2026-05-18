"use client";

import { motion, AnimatePresence } from "framer-motion";
import { WifiOff } from "lucide-react";
import { useOnlineStatus } from "@/app/hooks/useOnlineStatus";

export function OfflineBanner() {
  const online = useOnlineStatus();

  return (
    <AnimatePresence>
      {!online && (
        <motion.div
          initial={{ y: -48, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -48, opacity: 0 }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
          className="fixed top-0 inset-x-0 z-50 flex items-center justify-center gap-2 py-2.5 px-4 bg-trainer-warning/15 border-b border-trainer-warning/30 backdrop-blur-md"
          role="status"
          aria-live="polite"
        >
          <WifiOff size={13} className="text-trainer-warning shrink-0" />
          <p className="text-xs font-semibold text-trainer-warning">
            You&apos;re offline — changes will sync when you reconnect.
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
