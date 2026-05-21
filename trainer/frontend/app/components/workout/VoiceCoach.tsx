"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, MicOff, X, Bot, Loader2, Volume2 } from "lucide-react";
import { aiApi, type AIChatContext } from "@/app/lib/api";
import { cn } from "@/app/lib/utils";

interface VoiceCoachProps {
  accessToken?: string;
  context: AIChatContext;
  exerciseName?: string;
}

type VoiceState = "idle" | "listening" | "thinking" | "speaking";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SpeechRecognitionClass = any;

declare global {
  interface Window {
    SpeechRecognition: SpeechRecognitionClass;
    webkitSpeechRecognition: SpeechRecognitionClass;
  }
}

function speak(text: string, onEnd?: () => void) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    onEnd?.();
    return;
  }
  window.speechSynthesis.cancel();
  const utt = new SpeechSynthesisUtterance(text);
  utt.rate = 1.05;
  utt.pitch = 0.95;
  utt.volume = 1;
  // Pick a deeper English voice if available
  const voices = window.speechSynthesis.getVoices();
  const preferred = voices.find((v) =>
    /en[-_](US|GB|AU)/i.test(v.lang) && /male|david|alex|daniel/i.test(v.name)
  ) ?? voices.find((v) => /en/i.test(v.lang)) ?? null;
  if (preferred) utt.voice = preferred;
  utt.onend = () => onEnd?.();
  utt.onerror = () => onEnd?.();
  window.speechSynthesis.speak(utt);
}

export function VoiceCoach({ accessToken, context, exerciseName }: VoiceCoachProps) {
  const [open, setOpen] = useState(false);
  const [voiceState, setVoiceState] = useState<VoiceState>("idle");
  const [transcript, setTranscript] = useState("");
  const [reply, setReply] = useState("");
  const [error, setError] = useState("");
  const recogRef = useRef<SpeechRecognitionClass | null>(null);
  const supported = typeof window !== "undefined" &&
    ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      recogRef.current?.abort();
      window.speechSynthesis?.cancel();
    };
  }, []);

  const startListening = useCallback(() => {
    if (!supported) {
      setError("Voice input not supported in this browser.");
      return;
    }
    const SR = window.SpeechRecognition ?? window.webkitSpeechRecognition;
    const recog = new SR();
    recog.lang = "en-US";
    recog.interimResults = false;
    recog.maxAlternatives = 1;
    recogRef.current = recog;

    setTranscript("");
    setReply("");
    setError("");
    setVoiceState("listening");

    recog.onresult = async (e: SpeechRecognitionClass) => {
      const text = e.results[0]?.[0]?.transcript?.trim() ?? "";
      if (!text) { setVoiceState("idle"); return; }
      setTranscript(text);
      setVoiceState("thinking");

      const enrichedContext: AIChatContext = {
        ...context,
        // Inject the current exercise into the context so the LLM knows what we're doing
      };

      const messages = exerciseName
        ? [{ role: "user" as const, content: `[Currently doing: ${exerciseName}] ${text}` }]
        : [{ role: "user" as const, content: text }];

      try {
        if (!accessToken) throw new Error("Not authenticated");
        const { reply: r } = await aiApi.chat(accessToken, messages, enrichedContext);
        setReply(r);
        setVoiceState("speaking");
        speak(r, () => setVoiceState("idle"));
      } catch {
        setError("Couldn't reach the coach. Try again.");
        setVoiceState("idle");
      }
    };

    recog.onerror = (e: SpeechRecognitionClass) => {
      if (e.error === "no-speech") {
        setError("No speech detected. Try again.");
      } else if (e.error !== "aborted") {
        setError("Microphone error. Check permissions.");
      }
      setVoiceState("idle");
    };

    recog.onend = () => {
      if (voiceState === "listening") setVoiceState("idle");
    };

    recog.start();
  }, [supported, accessToken, context, exerciseName, voiceState]);

  const stopListening = useCallback(() => {
    recogRef.current?.stop();
    setVoiceState("idle");
  }, []);

  const stopSpeaking = useCallback(() => {
    window.speechSynthesis?.cancel();
    setVoiceState("idle");
  }, []);

  const close = useCallback(() => {
    recogRef.current?.abort();
    window.speechSynthesis?.cancel();
    setOpen(false);
    setVoiceState("idle");
    setTranscript("");
    setReply("");
    setError("");
  }, []);

  if (!supported && !open) return null;

  return (
    <>
      {/* Floating mic button */}
      <motion.button
        whileTap={{ scale: 0.88 }}
        onClick={() => { setOpen(true); if (!open) setTimeout(startListening, 150); }}
        className={cn(
          "w-9 h-9 rounded-full flex items-center justify-center transition-all",
          voiceState === "listening"
            ? "bg-red-500 shadow-lg shadow-red-500/40"
            : voiceState === "speaking"
            ? "bg-trainer-indigo shadow-lg shadow-trainer-indigo/40"
            : "bg-white/10 hover:bg-white/18"
        )}
        aria-label="Voice coach"
      >
        {voiceState === "speaking" ? (
          <Volume2 size={15} className="text-white" />
        ) : (
          <Mic size={15} className={voiceState === "listening" ? "text-white" : "text-white/60"} />
        )}
        {voiceState === "listening" && (
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-red-400"
            animate={{ scale: [1, 1.4, 1], opacity: [0.8, 0, 0.8] }}
            transition={{ duration: 1.2, repeat: Infinity }}
          />
        )}
      </motion.button>

      {/* Panel */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={close}
              className="fixed inset-0 bg-black/50 z-50"
            />
            <motion.div
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              transition={{ type: "spring", stiffness: 400, damping: 38 }}
              className="fixed bottom-0 inset-x-0 z-50 bg-trainer-elevated border-t border-white/10 rounded-t-[24px] p-6"
            >
              {/* Handle */}
              <div className="w-10 h-1 bg-white/15 rounded-full mx-auto mb-5" />

              {/* Header */}
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <Bot size={16} className="text-trainer-indigo" />
                  <p className="text-sm font-bold text-white">Voice Coach</p>
                </div>
                <button
                  onClick={close}
                  className="w-7 h-7 rounded-full bg-white/8 flex items-center justify-center text-white/40 hover:text-white transition-colors"
                >
                  <X size={13} />
                </button>
              </div>

              {/* State display */}
              <div className="min-h-[80px] flex flex-col items-center justify-center gap-3 mb-6">
                {voiceState === "idle" && !transcript && !error && (
                  <p className="text-sm text-white/35 text-center">
                    {exerciseName ? `Ask about ${exerciseName} or anything else` : "Ask your coach anything"}
                  </p>
                )}

                {voiceState === "listening" && (
                  <div className="flex flex-col items-center gap-2">
                    <div className="flex gap-1.5 items-end h-8">
                      {[0, 1, 2, 3, 4].map((i) => (
                        <motion.div
                          key={i}
                          className="w-1 bg-red-400 rounded-full"
                          animate={{ height: ["8px", "32px", "8px"] }}
                          transition={{ duration: 0.6, delay: i * 0.12, repeat: Infinity }}
                        />
                      ))}
                    </div>
                    <p className="text-xs text-white/40">Listening…</p>
                  </div>
                )}

                {voiceState === "thinking" && (
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 size={20} className="text-trainer-indigo animate-spin" />
                    <p className="text-xs text-white/40">Thinking…</p>
                  </div>
                )}

                {voiceState === "speaking" && reply && (
                  <div className="flex items-center gap-2">
                    <Volume2 size={14} className="text-trainer-indigo animate-pulse shrink-0" />
                    <p className="text-sm text-white/70 leading-relaxed text-center">{reply}</p>
                  </div>
                )}

                {voiceState === "idle" && transcript && (
                  <div className="w-full space-y-3">
                    {transcript && (
                      <div className="bg-trainer-surface rounded-[10px] px-3 py-2">
                        <p className="text-[10px] text-white/30 mb-1">You said</p>
                        <p className="text-sm text-white/70 italic">"{transcript}"</p>
                      </div>
                    )}
                    {reply && (
                      <div className="bg-trainer-indigo/8 border border-trainer-indigo/20 rounded-[10px] px-3 py-2">
                        <p className="text-[10px] text-trainer-indigo mb-1">Coach</p>
                        <p className="text-sm text-white/80 leading-relaxed">{reply}</p>
                      </div>
                    )}
                  </div>
                )}

                {error && (
                  <p className="text-xs text-trainer-danger text-center">{error}</p>
                )}
              </div>

              {/* Controls */}
              <div className="flex gap-3">
                {voiceState === "listening" ? (
                  <button
                    onClick={stopListening}
                    className="flex-1 py-3.5 rounded-[14px] bg-red-500/15 border border-red-500/30 text-red-400 text-sm font-bold flex items-center justify-center gap-2 hover:bg-red-500/25 transition-colors"
                  >
                    <MicOff size={15} />
                    Stop
                  </button>
                ) : voiceState === "speaking" ? (
                  <button
                    onClick={stopSpeaking}
                    className="flex-1 py-3.5 rounded-[14px] bg-trainer-indigo/15 border border-trainer-indigo/30 text-trainer-indigo text-sm font-bold flex items-center justify-center gap-2 hover:bg-trainer-indigo/25 transition-colors"
                  >
                    <X size={15} />
                    Stop Speaking
                  </button>
                ) : voiceState === "thinking" ? (
                  <button
                    disabled
                    className="flex-1 py-3.5 rounded-[14px] bg-white/6 border border-white/8 text-white/25 text-sm font-bold flex items-center justify-center gap-2"
                  >
                    <Loader2 size={15} className="animate-spin" />
                    Processing…
                  </button>
                ) : (
                  <button
                    onClick={startListening}
                    className="flex-1 py-3.5 rounded-[14px] bg-trainer-indigo text-white text-sm font-bold flex items-center justify-center gap-2 hover:bg-trainer-indigo-hover active:scale-[0.98] transition-all"
                  >
                    <Mic size={15} />
                    {transcript ? "Ask Again" : "Start Speaking"}
                  </button>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
