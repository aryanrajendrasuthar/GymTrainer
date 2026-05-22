"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "@/app/lib/utils";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
  showClose?: boolean;
}

export function Modal({ isOpen, onClose, title, children, className, showClose = true }: ModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  if (typeof window === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ type: "spring", stiffness: 380, damping: 42 }}
          className={cn("fixed inset-0 z-50 bg-trainer-black flex flex-col", className)}
        >
          {(title || showClose) && (
            <div className="flex items-center gap-3 px-4 pt-14 pb-4 border-b border-white/8 shrink-0">
              {showClose && (
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-full bg-white/8 flex items-center justify-center text-white/50 shrink-0"
                  aria-label="Close"
                >
                  <X size={18} />
                </button>
              )}
              {title && <h2 className="text-lg font-semibold text-white">{title}</h2>}
            </div>
          )}
          <div className="overflow-y-auto flex-1 px-4 py-5 pb-16">{children}</div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
