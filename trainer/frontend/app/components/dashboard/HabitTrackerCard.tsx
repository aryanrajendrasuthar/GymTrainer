"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Circle, ChevronDown, ChevronUp, Settings2, Plus, X } from "lucide-react";
import { useHabitStore } from "@/app/store/habitStore";
import { cn } from "@/app/lib/utils";

const EMOJI_SUGGESTIONS = ["💪", "🏃", "🧘", "🥗", "💤", "🚴", "🏋️", "🌅", "🥤", "🧠"];

export function HabitTrackerCard() {
  const { habits, completions, toggleEnabled, markDone, markUndone, getTodayCompleted, getStreak, addHabit, removeHabit } =
    useHabitStore();
  const [expanded, setExpanded] = useState(false);
  const [showManage, setShowManage] = useState(false);
  const [newEmoji, setNewEmoji] = useState("💪");
  const [newName, setNewName] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const enabledHabits = habits.filter((h) => h.enabled);
  const todayDone = getTodayCompleted();

  // Last 7 calendar days (oldest → newest)
  const last7Dates = (() => {
    const today = new Date();
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() - (6 - i));
      return d.toISOString().slice(0, 10);
    });
  })();
  const doneCount = enabledHabits.filter((h) => todayDone.includes(h.id)).length;
  const total = enabledHabits.length;
  const allDone = total > 0 && doneCount === total;

  const compliantDays = total > 0
    ? last7Dates.filter((date) => {
        const dayIds = completions.find((c) => c.date === date)?.completedIds ?? [];
        return enabledHabits.every((h) => dayIds.includes(h.id));
      }).length
    : 0;

  const R = 10;
  const circ = 2 * Math.PI * R;
  const pct = total > 0 ? doneCount / total : 0;

  function handleAddHabit() {
    if (newName.trim().length < 2) return;
    addHabit(newName, newEmoji);
    setNewName("");
    setNewEmoji("💪");
    setShowEmojiPicker(false);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.06 }}
      className="bg-trainer-surface border border-white/8 rounded-[18px] overflow-hidden"
    >
      {/* Header */}
      <button
        onClick={() => { setExpanded((v) => !v); setShowManage(false); }}
        className="w-full flex items-center gap-3 px-4 py-3.5 text-left"
      >
        {/* Completion ring */}
        <div className="relative w-9 h-9 shrink-0">
          <svg width="36" height="36" className="-rotate-90">
            <circle cx="18" cy="18" r={R} strokeWidth="2.5" stroke="rgba(255,255,255,0.07)" fill="none" />
            <motion.circle
              cx="18" cy="18" r={R}
              strokeWidth="2.5"
              stroke={allDone ? "#4ade80" : "#6c63ff"}
              fill="none"
              strokeLinecap="round"
              strokeDasharray={circ}
              animate={{ strokeDashoffset: circ * (1 - pct) }}
              transition={{ duration: 0.45, ease: "easeOut" }}
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-white/50">
            {doneCount}/{total}
          </span>
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-white">Daily Habits</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <p className="text-[11px] text-white/35">
              {allDone ? "All done for today! 🎉" : `${total - doneCount} remaining`}
            </p>
            {total > 0 && (
              <span className="text-[10px] text-white/20 tabular-nums">
                · {compliantDays}/7d ✓
              </span>
            )}
          </div>
        </div>
        {expanded
          ? <ChevronUp size={14} className="text-white/30 shrink-0" />
          : <ChevronDown size={14} className="text-white/30 shrink-0" />}
      </button>

      {/* Habit grid */}
      {enabledHabits.length > 0 && (
        <div className="px-4 pb-3 grid grid-cols-3 gap-2">
          {enabledHabits.map((habit) => {
            const done = todayDone.includes(habit.id);
            const streak = getStreak(habit.id);
            const isStale = !done && last7Dates.slice(-3).every(
              (date) => !(completions.find((c) => c.date === date)?.completedIds.includes(habit.id))
            ) && last7Dates.slice(0, 4).some(
              (date) => completions.find((c) => c.date === date)?.completedIds.includes(habit.id)
            );
            return (
              <motion.button
                key={habit.id}
                whileTap={{ scale: 0.93 }}
                onClick={() => (done ? markUndone(habit.id) : markDone(habit.id))}
                className={cn(
                  "flex flex-col items-center gap-1.5 p-2.5 rounded-[12px] border transition-all",
                  done
                    ? "bg-trainer-success/12 border-trainer-success/30"
                    : isStale
                    ? "bg-amber-400/6 border-amber-400/25 hover:border-amber-400/40"
                    : "bg-white/4 border-white/8 hover:border-white/18"
                )}
              >
                <span className="text-xl leading-none">{habit.emoji}</span>
                <div className="flex items-center gap-1">
                  {done
                    ? <CheckCircle2 size={10} className="text-trainer-success" />
                    : <Circle size={10} className="text-white/25" />}
                </div>
                <p className={cn("text-[9px] font-semibold leading-none text-center", done ? "text-trainer-success" : "text-white/35")}>
                  {habit.name}
                </p>
                {streak > 1 && (
                  <span className="text-[8px] text-amber-400 font-bold">{streak}d 🔥</span>
                )}
                {/* 7-day completion dots */}
                <div className="flex gap-[2px]">
                  {last7Dates.map((date) => {
                    const filled = completions.find((c) => c.date === date)?.completedIds.includes(habit.id) ?? false;
                    return (
                      <div
                        key={date}
                        className={cn(
                          "w-1.5 h-1.5 rounded-full",
                          filled ? "bg-trainer-success" : "bg-white/10"
                        )}
                      />
                    );
                  })}
                </div>
              </motion.button>
            );
          })}
        </div>
      )}

      {/* Expanded: manage habits */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden border-t border-white/5"
          >
            <div className="px-4 pt-3 pb-4">
              <button
                onClick={() => setShowManage((v) => !v)}
                className="flex items-center gap-1.5 text-xs text-white/35 hover:text-white/60 transition-colors mb-3"
              >
                <Settings2 size={11} />
                {showManage ? "Hide settings" : "Configure habits"}
              </button>

              <AnimatePresence>
                {showManage && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="flex flex-col gap-2">
                      {habits.map((habit) => (
                        <div
                          key={habit.id}
                          className="flex items-center gap-3 p-2.5 rounded-[10px] bg-trainer-elevated"
                        >
                          <span className="text-base leading-none">{habit.emoji}</span>
                          <p className="text-sm text-white/70 flex-1 text-left">{habit.name}</p>

                          {habit.isCustom && (
                            <button
                              onClick={() => removeHabit(habit.id)}
                              className="w-6 h-6 rounded-full bg-trainer-danger/12 flex items-center justify-center text-trainer-danger/60 hover:text-trainer-danger hover:bg-trainer-danger/20 transition-colors shrink-0"
                              aria-label={`Remove ${habit.name}`}
                            >
                              <X size={11} />
                            </button>
                          )}

                          <button onClick={() => toggleEnabled(habit.id)} className="shrink-0">
                            <div className={cn(
                              "w-8 h-4 rounded-full transition-all relative",
                              habit.enabled ? "bg-trainer-indigo" : "bg-white/12"
                            )}>
                              <motion.div
                                className="absolute top-0.5 w-3 h-3 rounded-full bg-white shadow"
                                animate={{ left: habit.enabled ? "calc(100% - 14px)" : "2px" }}
                                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                              />
                            </div>
                          </button>
                        </div>
                      ))}

                      {/* New habit form */}
                      <div className="mt-1 p-3 rounded-[12px] bg-trainer-elevated border border-white/6">
                        <p className="text-[10px] text-white/30 uppercase tracking-widest font-semibold mb-2">
                          Add Custom Habit
                        </p>
                        <div className="flex gap-2 mb-2">
                          {/* Emoji button */}
                          <div className="relative">
                            <button
                              type="button"
                              onClick={() => setShowEmojiPicker((v) => !v)}
                              className="w-10 h-10 rounded-[10px] bg-trainer-surface border border-white/10 flex items-center justify-center text-xl hover:border-white/20 transition-colors"
                            >
                              {newEmoji}
                            </button>
                            <AnimatePresence>
                              {showEmojiPicker && (
                                <motion.div
                                  initial={{ opacity: 0, scale: 0.92, y: 4 }}
                                  animate={{ opacity: 1, scale: 1, y: 0 }}
                                  exit={{ opacity: 0, scale: 0.92, y: 4 }}
                                  className="absolute bottom-full left-0 mb-1 bg-trainer-surface border border-white/12 rounded-[12px] p-2 grid grid-cols-5 gap-1 z-10 shadow-xl"
                                >
                                  {EMOJI_SUGGESTIONS.map((em) => (
                                    <button
                                      key={em}
                                      type="button"
                                      onClick={() => { setNewEmoji(em); setShowEmojiPicker(false); }}
                                      className={cn(
                                        "w-8 h-8 rounded-[8px] flex items-center justify-center text-base hover:bg-white/8 transition-colors",
                                        newEmoji === em && "bg-trainer-indigo/20"
                                      )}
                                    >
                                      {em}
                                    </button>
                                  ))}
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>

                          {/* Name input */}
                          <input
                            type="text"
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleAddHabit()}
                            placeholder="Habit name…"
                            maxLength={30}
                            className="flex-1 bg-trainer-surface border border-white/10 rounded-[10px] px-3 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-trainer-indigo/40"
                            style={{ fontSize: "16px" }}
                          />
                        </div>

                        <motion.button
                          whileTap={{ scale: 0.97 }}
                          onClick={handleAddHabit}
                          disabled={newName.trim().length < 2}
                          className={cn(
                            "w-full py-2 rounded-[10px] text-xs font-bold flex items-center justify-center gap-1.5 transition-all",
                            newName.trim().length >= 2
                              ? "bg-trainer-indigo/20 text-trainer-indigo border border-trainer-indigo/30 hover:bg-trainer-indigo/25"
                              : "bg-white/4 text-white/20 border border-white/6 cursor-not-allowed"
                          )}
                        >
                          <Plus size={11} />
                          Add Habit
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
