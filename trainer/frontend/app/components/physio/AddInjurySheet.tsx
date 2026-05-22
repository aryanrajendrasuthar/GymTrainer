"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, Check } from "lucide-react";
import { useUserStore } from "@/app/store/userStore";
import { physioApi } from "@/app/lib/api";
import { type PhysioCondition, type PhysioPhase } from "@/app/types";
import { cn } from "@/app/lib/utils";

// ─── Data ────────────────────────────────────────────────────────────────────

const CONDITION_NAMES: Record<PhysioCondition, string> = {
  "adhesive-capsulitis": "Adhesive Capsulitis",
  "cervical-strain": "Cervical Strain",
  "thoracic-kyphosis": "Thoracic Kyphosis",
  "scapular-winging": "Scapular Winging",
  "scapular-dyskinesia": "Scapular Dyskinesia",
  "l4-l5-disc-herniation": "L4-L5 Disc Herniation",
  "l5-s1-disc-herniation": "L5-S1 Disc Herniation",
  coccydynia: "Coccydynia",
  "patellofemoral-pain-syndrome": "Patellofemoral Pain Syndrome",
  "it-band-syndrome": "IT Band Syndrome",
  "achilles-tendinopathy": "Achilles Tendinopathy",
  "plantar-fasciitis": "Plantar Fasciitis",
  "peroneal-tendon-injury": "Peroneal Tendon Injury",
  "rotator-cuff-strain": "Rotator Cuff Strain",
  "shoulder-impingement": "Shoulder Impingement",
  "piriformis-syndrome": "Piriformis Syndrome",
  "si-joint-dysfunction": "SI Joint Dysfunction",
  "thoracic-outlet-syndrome": "Thoracic Outlet Syndrome",
  "cervicogenic-headache": "Cervicogenic Headache",
  whiplash: "Whiplash",
  "cervical-radiculopathy": "Cervical Radiculopathy",
  "knee-effusion": "Knee Effusion (Swollen Knee)",
  "proximal-hamstring-tendinopathy": "Proximal Hamstring Tendinopathy",
  "tendinopathy-swelling": "Tendinopathy & Soft-Tissue Swelling",
};

const CONDITION_REGION: Record<PhysioCondition, string> = {
  "adhesive-capsulitis": "Shoulder",
  "rotator-cuff-strain": "Shoulder",
  "shoulder-impingement": "Shoulder",
  "scapular-winging": "Shoulder",
  "scapular-dyskinesia": "Shoulder",
  "thoracic-outlet-syndrome": "Shoulder / Neck",
  "cervical-strain": "Neck",
  "cervicogenic-headache": "Neck / Head",
  whiplash: "Neck",
  "thoracic-kyphosis": "Upper Back",
  "l4-l5-disc-herniation": "Lower Back",
  "l5-s1-disc-herniation": "Lower Back",
  coccydynia: "Tailbone",
  "piriformis-syndrome": "Hip / Glute",
  "si-joint-dysfunction": "Hip / Pelvis",
  "patellofemoral-pain-syndrome": "Knee",
  "it-band-syndrome": "Knee / Hip",
  "achilles-tendinopathy": "Ankle",
  "plantar-fasciitis": "Foot",
  "peroneal-tendon-injury": "Ankle / Foot",
  "cervical-radiculopathy": "Neck / Arm",
  "knee-effusion": "Knee",
  "proximal-hamstring-tendinopathy": "Hamstring / Ischium",
  "tendinopathy-swelling": "Any Region",
};

const GROUPS: { label: string; conditions: PhysioCondition[] }[] = [
  {
    label: "Shoulder & Neck",
    conditions: [
      "adhesive-capsulitis",
      "rotator-cuff-strain",
      "shoulder-impingement",
      "scapular-winging",
      "scapular-dyskinesia",
      "thoracic-outlet-syndrome",
      "cervical-strain",
      "cervical-radiculopathy",
      "cervicogenic-headache",
      "whiplash",
    ],
  },
  {
    label: "Spine & Trunk",
    conditions: [
      "thoracic-kyphosis",
      "l4-l5-disc-herniation",
      "l5-s1-disc-herniation",
      "coccydynia",
    ],
  },
  {
    label: "Hip, Hamstring & Glute",
    conditions: [
      "piriformis-syndrome",
      "si-joint-dysfunction",
      "proximal-hamstring-tendinopathy",
    ],
  },
  {
    label: "Knee, Ankle & Foot",
    conditions: [
      "patellofemoral-pain-syndrome",
      "knee-effusion",
      "it-band-syndrome",
      "achilles-tendinopathy",
      "plantar-fasciitis",
      "peroneal-tendon-injury",
    ],
  },
  {
    label: "General Soft-Tissue",
    conditions: [
      "tendinopathy-swelling",
    ],
  },
];

const PHASES: { value: PhysioPhase; label: string; desc: string }[] = [
  { value: "acute", label: "Acute", desc: "Recent onset, significant pain" },
  { value: "subacute", label: "Sub-acute", desc: "Improving, still symptomatic" },
  { value: "chronic", label: "Chronic", desc: "Long-standing, manageable pain" },
  { value: "maintenance", label: "Maintenance", desc: "Resolved, preventing recurrence" },
];

// ─── Component ────────────────────────────────────────────────────────────────

interface AddInjurySheetProps {
  open: boolean;
  onClose: () => void;
}

export function AddInjurySheet({ open, onClose }: AddInjurySheetProps) {
  const { addInjury, updateInjury, profile, accessToken } = useUserStore();

  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<PhysioCondition | null>(null);
  const [severity, setSeverity] = useState<"mild" | "moderate" | "severe">("moderate");
  const [phase, setPhase] = useState<PhysioPhase>("acute");

  const existingConditions = new Set(profile?.injuries.map((i) => i.condition) ?? []);

  const filtered = GROUPS.map((g) => ({
    ...g,
    conditions: g.conditions.filter(
      (c) =>
        !existingConditions.has(c) &&
        (search.trim() === "" ||
          CONDITION_NAMES[c].toLowerCase().includes(search.toLowerCase()) ||
          CONDITION_REGION[c].toLowerCase().includes(search.toLowerCase()))
    ),
  })).filter((g) => g.conditions.length > 0);

  function handleAdd() {
    if (!selected) return;
    const onsetDate = new Date().toISOString().split("T")[0];
    addInjury({
      condition: selected,
      bodyRegion: CONDITION_REGION[selected],
      severity,
      phase,
      onsetDate,
    });
    if (accessToken) {
      physioApi
        .addInjury(accessToken, {
          condition: selected,
          body_region: CONDITION_REGION[selected],
          severity,
          phase,
          onset_date: onsetDate,
        })
        .then((res) => {
          if (res?.id) updateInjury(selected, { backendId: res.id });
        })
        .catch(() => {});
    }
    handleClose();
  }

  function handleClose() {
    setSearch("");
    setSelected(null);
    setSeverity("moderate");
    setPhase("acute");
    onClose();
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/60 z-40"
          />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 380, damping: 42 }}
            className="fixed bottom-0 inset-x-0 z-50 bg-trainer-elevated border-t border-white/10 rounded-t-[24px] max-h-[90vh] flex flex-col"
          >
            {/* Handle */}
            <div className="w-10 h-1 bg-white/15 rounded-full mx-auto mt-3 mb-4 shrink-0" />

            {/* Header */}
            <div className="flex items-center justify-between px-5 pb-4 shrink-0">
              <div>
                <p className="text-base font-bold text-white">Add Condition</p>
                <p className="text-xs text-white/35 mt-0.5">
                  Select a condition to begin rehab
                  <span className="text-white/20"> · {Object.keys(CONDITION_NAMES).length} conditions</span>
                </p>
              </div>
              <button
                onClick={handleClose}
                className="w-8 h-8 rounded-full bg-white/8 flex items-center justify-center text-white/50 hover:text-white transition-colors"
              >
                <X size={15} />
              </button>
            </div>

            {/* Search */}
            <div className="px-5 pb-3 shrink-0">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                <input
                  type="text"
                  placeholder="Search conditions…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-trainer-surface border border-white/10 rounded-[10px] pl-9 pr-3 py-2.5 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-trainer-indigo/50"
                />
              </div>
            </div>

            {/* Condition list */}
            <div className="overflow-y-auto max-h-[55vh] px-5 pb-4">
              {search.trim().length > 0 && filtered.length > 0 && (
                <p className="text-[10px] text-white/25 mb-3 tabular-nums">
                  {filtered.reduce((t, g) => t + g.conditions.length, 0)} result{filtered.reduce((t, g) => t + g.conditions.length, 0) !== 1 ? "s" : ""}
                </p>
              )}
              {filtered.length === 0 ? (
                <p className="text-sm text-white/30 text-center py-8">No matching conditions.</p>
              ) : (
                filtered.map((group) => (
                  <div key={group.label} className="mb-5">
                    <p className="text-[10px] font-semibold text-white/30 uppercase tracking-widest mb-2">
                      {group.label}
                      <span className="text-white/15 font-normal"> ({group.conditions.length})</span>
                    </p>
                    <div className="flex flex-col gap-1.5">
                      {group.conditions.map((c) => {
                        const isSelected = selected === c;
                        return (
                          <button
                            key={c}
                            onClick={() => setSelected(isSelected ? null : c)}
                            className={cn(
                              "flex items-center justify-between px-3.5 py-3 rounded-[12px] border text-left transition-all duration-150",
                              isSelected
                                ? "bg-trainer-indigo/10 border-trainer-indigo/35"
                                : "bg-trainer-surface border-white/8 hover:border-white/20"
                            )}
                          >
                            <div className="min-w-0">
                              <p className={cn("text-sm font-semibold", isSelected ? "text-white" : "text-white/75")}>
                                {CONDITION_NAMES[c]}
                              </p>
                              <p className="text-[11px] text-white/30 mt-0.5">{CONDITION_REGION[c]}</p>
                            </div>
                            {isSelected && (
                              <div className="w-5 h-5 rounded-full bg-trainer-indigo flex items-center justify-center shrink-0 ml-3">
                                <Check size={11} className="text-white" />
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}

              {/* Phase + severity — shown after selection */}
              {selected && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 flex flex-col gap-4"
                >
                  {/* Phase */}
                  <div>
                    <p className="text-xs font-semibold text-white/35 uppercase tracking-widest mb-2">
                      Current Phase
                    </p>
                    <div className="flex flex-col gap-1.5">
                      {PHASES.map((p) => (
                        <button
                          key={p.value}
                          onClick={() => setPhase(p.value)}
                          className={cn(
                            "flex items-center gap-3 px-3.5 py-2.5 rounded-[10px] border text-left transition-all duration-150",
                            phase === p.value
                              ? "bg-trainer-indigo/10 border-trainer-indigo/30"
                              : "bg-trainer-surface border-white/8"
                          )}
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-white/80">{p.label}</p>
                            <p className="text-[11px] text-white/30">{p.desc}</p>
                          </div>
                          {phase === p.value && (
                            <div className="w-4 h-4 rounded-full bg-trainer-indigo flex items-center justify-center shrink-0">
                              <Check size={9} className="text-white" />
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Severity */}
                  <div>
                    <p className="text-xs font-semibold text-white/35 uppercase tracking-widest mb-2">
                      Severity
                    </p>
                    <div className="flex gap-2">
                      {(["mild", "moderate", "severe"] as const).map((s) => (
                        <button
                          key={s}
                          onClick={() => setSeverity(s)}
                          className={cn(
                            "flex-1 py-2.5 rounded-[10px] text-sm font-semibold border capitalize transition-all duration-150",
                            severity === s
                              ? s === "mild"
                                ? "bg-emerald-400/15 border-emerald-400/35 text-emerald-400"
                                : s === "moderate"
                                ? "bg-amber-400/15 border-amber-400/35 text-amber-400"
                                : "bg-trainer-danger/15 border-trainer-danger/35 text-trainer-danger"
                              : "bg-trainer-surface border-white/8 text-white/40"
                          )}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Add button */}
            <div className="px-5 pb-10 pt-3 border-t border-white/8 shrink-0">
              <button
                onClick={handleAdd}
                disabled={!selected}
                className="w-full py-3.5 rounded-[14px] text-sm font-bold bg-trainer-indigo text-white transition-all hover:bg-trainer-indigo-hover active:scale-[0.98] disabled:opacity-35 disabled:cursor-not-allowed disabled:scale-100"
              >
                {selected ? `Add ${CONDITION_NAMES[selected]}` : "Select a condition"}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
