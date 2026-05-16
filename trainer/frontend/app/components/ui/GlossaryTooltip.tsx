"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ExternalLink, X } from "lucide-react";
import { glossary } from "@/app/data/glossary";
import { type GlossaryEntry } from "@/app/types";
import { cn } from "@/app/lib/utils";

interface GlossaryTooltipProps {
  term: string;
  children: React.ReactNode;
  className?: string;
}

export function GlossaryTooltip({ term, children, className }: GlossaryTooltipProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);
  const triggerRef = useRef<HTMLSpanElement>(null);

  const entry = glossary.find(
    (g) => g.term.toLowerCase() === term.toLowerCase()
  ) as GlossaryEntry | undefined;

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  const handleOpen = () => {
    if (!entry) return;
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setPosition({
        top: rect.bottom + window.scrollY + 8,
        left: Math.min(
          rect.left + window.scrollX,
          window.innerWidth - 320
        ),
      });
    }
    setIsOpen(true);
  };

  if (!entry) {
    return <span className={className}>{children}</span>;
  }

  return (
    <>
      <span
        ref={triggerRef}
        className={cn(
          "cursor-pointer border-b border-dotted border-trainer-indigo/60 text-inherit",
          "hover:border-trainer-indigo transition-colors duration-150",
          className
        )}
        onClick={handleOpen}
        onMouseEnter={handleOpen}
        onMouseLeave={() => setIsOpen(false)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && handleOpen()}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
      >
        {children}
      </span>

      {isMounted &&
        createPortal(
          <AnimatePresence>
            {isOpen && (
              <>
                {/* Mobile overlay */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-50 bg-black/50 md:hidden"
                  onClick={() => setIsOpen(false)}
                />

                {/* Mobile bottom sheet */}
                <motion.div
                  initial={{ y: "100%" }}
                  animate={{ y: 0 }}
                  exit={{ y: "100%" }}
                  transition={{ type: "spring", damping: 30, stiffness: 300 }}
                  className="fixed bottom-0 left-0 right-0 z-50 bg-trainer-surface rounded-t-[24px] p-5 md:hidden max-h-[60vh] overflow-y-auto"
                  role="dialog"
                  aria-modal="true"
                  aria-label={entry.term}
                >
                  <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-4" />
                  <GlossaryContent entry={entry} onClose={() => setIsOpen(false)} />
                </motion.div>

                {/* Desktop tooltip */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -4 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="fixed z-50 hidden md:block w-80 bg-trainer-elevated border border-white/15 rounded-[16px] shadow-2xl p-4"
                  style={position ? { top: position.top, left: position.left } : undefined}
                  onMouseEnter={() => setIsOpen(true)}
                  onMouseLeave={() => setIsOpen(false)}
                  role="tooltip"
                >
                  <GlossaryContent entry={entry} onClose={() => setIsOpen(false)} compact />
                </motion.div>
              </>
            )}
          </AnimatePresence>,
          document.body
        )}
    </>
  );
}

function GlossaryContent({
  entry,
  onClose,
  compact = false,
}: {
  entry: GlossaryEntry;
  onClose: () => void;
  compact?: boolean;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="font-semibold text-white text-base">{entry.term}</h3>
          {entry.alsoCalledTerms.length > 0 && (
            <p className="text-xs text-white/40 mt-0.5">
              Also called:{" "}
              <span className="text-white/60">{entry.alsoCalledTerms.join(", ")}</span>
            </p>
          )}
        </div>
        {!compact && (
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/10 text-white/40 hover:text-white transition-colors shrink-0"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        )}
      </div>

      <p className="text-sm text-white/70 leading-relaxed">{entry.plainEnglishDefinition}</p>

      {entry.hasConditionPage && entry.conditionId && (
        <a
          href={`/physio/conditions/${entry.conditionId}`}
          className="inline-flex items-center gap-1.5 text-xs text-trainer-indigo hover:text-trainer-indigo-hover transition-colors"
          onClick={onClose}
        >
          <span>Learn more</span>
          <ExternalLink size={12} />
        </a>
      )}

      <div className="inline-flex items-center gap-1.5">
        <span
          className={cn(
            "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium",
            entry.category === "condition" && "bg-trainer-danger/10 text-trainer-danger",
            entry.category === "anatomy" && "bg-trainer-indigo/10 text-trainer-muted",
            entry.category === "physio-exercise" && "bg-trainer-success/10 text-trainer-success",
            entry.category === "gym-term" && "bg-trainer-gold/10 text-trainer-gold"
          )}
        >
          {entry.category === "condition" && "Condition"}
          {entry.category === "anatomy" && "Anatomy"}
          {entry.category === "physio-exercise" && "Exercise"}
          {entry.category === "gym-term" && "Gym Term"}
        </span>
      </div>
    </div>
  );
}
