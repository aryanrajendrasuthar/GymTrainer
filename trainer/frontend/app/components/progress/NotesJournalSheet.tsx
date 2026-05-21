"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ScrollText, Search, X, Dumbbell } from "lucide-react";
import type { WorkoutSession } from "@/app/types";
import { cn } from "@/app/lib/utils";

interface Props {
  sessions: WorkoutSession[];
}

export function NotesJournalSheet({ sessions }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const notedSessions = useMemo(() => {
    return sessions
      .filter((s) => s.sessionNotes && s.sessionNotes.trim().length > 0)
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [sessions]);

  const filtered = useMemo(() => {
    if (!query.trim()) return notedSessions;
    const q = query.toLowerCase();
    return notedSessions.filter(
      (s) =>
        s.sessionNotes?.toLowerCase().includes(q) ||
        s.splitDay.toLowerCase().includes(q)
    );
  }, [notedSessions, query]);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={cn(
          "flex items-center gap-1.5 px-3 py-1.5 rounded-[10px] border text-xs font-semibold transition-colors",
          notedSessions.length > 0
            ? "bg-white/6 border-white/10 text-white/40 hover:text-white/70 hover:border-white/20"
            : "bg-white/4 border-white/6 text-white/20 cursor-default"
        )}
        disabled={notedSessions.length === 0}
        title="Session notes journal"
      >
        <ScrollText size={12} />
        Notes
        {notedSessions.length > 0 && (
          <span className="bg-trainer-indigo/20 text-trainer-indigo rounded-full px-1.5 py-0.5 text-[9px] font-bold">
            {notedSessions.length}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 380, damping: 40 }}
              className="fixed bottom-0 inset-x-0 z-50 bg-trainer-elevated border-t border-white/10 rounded-t-[24px] max-h-[85vh] flex flex-col"
            >
              {/* Handle */}
              <div className="flex justify-center pt-3 pb-1 shrink-0">
                <div className="w-9 h-1 rounded-full bg-white/15" />
              </div>

              {/* Header */}
              <div className="flex items-center justify-between px-5 pb-3 shrink-0">
                <div className="flex items-center gap-2">
                  <ScrollText size={15} className="text-trainer-indigo" />
                  <p className="text-base font-bold text-white">Session Notes</p>
                  <span className="text-xs text-white/35">{notedSessions.length} entries</span>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  className="w-8 h-8 rounded-full bg-white/8 flex items-center justify-center text-white/40 hover:text-white transition-colors"
                >
                  <X size={15} />
                </button>
              </div>

              {/* Search */}
              <div className="px-5 pb-3 shrink-0">
                <div className="flex items-center gap-2 bg-trainer-surface border border-white/10 rounded-[12px] px-3 py-2.5">
                  <Search size={13} className="text-white/30 shrink-0" />
                  <input
                    type="text"
                    placeholder="Search notes or workout name…"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="flex-1 bg-transparent text-sm text-white placeholder:text-white/25 focus:outline-none"
                    style={{ fontSize: "16px" }}
                  />
                  {query && (
                    <button onClick={() => setQuery("")} className="text-white/30 hover:text-white/60 transition-colors">
                      <X size={12} />
                    </button>
                  )}
                </div>
              </div>

              {/* Notes list */}
              <div className="overflow-y-auto flex-1 px-5 pb-8">
                {filtered.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 gap-3">
                    <ScrollText size={28} className="text-white/15" />
                    <p className="text-sm text-white/30 text-center">
                      {query ? "No notes match your search" : "No session notes yet"}
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    {filtered.map((session) => (
                      <motion.div
                        key={session.id}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-trainer-surface border border-white/8 rounded-[14px] p-4"
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-6 h-6 rounded-[6px] bg-trainer-indigo/12 flex items-center justify-center shrink-0">
                            <Dumbbell size={11} className="text-trainer-indigo/60" />
                          </div>
                          <p className="text-xs font-bold text-white/80">{session.splitDay}</p>
                          <p className="text-[10px] text-white/30 ml-auto">
                            {new Date(session.date).toLocaleDateString("en-US", {
                              weekday: "short",
                              month: "short",
                              day: "numeric",
                            })}
                          </p>
                        </div>
                        <p className="text-sm text-white/60 leading-relaxed">
                          {highlightMatch(session.sessionNotes!, query)}
                        </p>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

function highlightMatch(text: string, query: string): React.ReactNode {
  if (!query.trim()) return text;
  const parts = text.split(new RegExp(`(${escapeRegex(query)})`, "gi"));
  return parts.map((part, i) =>
    part.toLowerCase() === query.toLowerCase()
      ? <mark key={i} className="bg-trainer-indigo/25 text-white rounded-sm">{part}</mark>
      : part
  );
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
