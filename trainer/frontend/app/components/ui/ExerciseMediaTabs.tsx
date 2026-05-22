"use client";

import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Activity, Database, WifiOff } from "lucide-react";
import Image from "next/image";
import { MuscleActivationDiagram } from "./MuscleActivationDiagram";
import { type MuscleGroup } from "@/app/types";
import { cn } from "@/app/lib/utils";

interface WgerData {
  images: string[];
  alternativeNames: string[];
}

interface LocalExerciseDetails {
  equipment: string[];
  movementType: string;
  forceType: string;
  mechanic: string;
  tags: string[];
  contraindications: string[];
}

interface ExerciseMediaTabsProps {
  youtubeId: string;
  exerciseName: string;
  primaryMuscles: MuscleGroup[];
  secondaryMuscles: MuscleGroup[];
  wgerExerciseId?: number;
  defaultTab?: "video" | "muscles" | "wger";
  instructions?: string[];
  mode?: "gym" | "physio";
  affectedArea?: MuscleGroup[];
  rehabilitationMuscles?: MuscleGroup[];
  localDetails?: LocalExerciseDetails;
}

const TABS = [
  { id: "video" as const, label: "Video", icon: Play },
  { id: "muscles" as const, label: "Muscles", icon: Activity },
  { id: "wger" as const, label: "Details", icon: Database },
];

export function ExerciseMediaTabs({
  youtubeId,
  exerciseName,
  primaryMuscles,
  secondaryMuscles,
  wgerExerciseId,
  defaultTab = "muscles",
  instructions = [],
  mode = "gym",
  affectedArea = [],
  rehabilitationMuscles = [],
  localDetails,
}: ExerciseMediaTabsProps) {
  const [activeTab, setActiveTab] = useState<"video" | "muscles" | "wger">(defaultTab);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [videoModalOpen, setVideoModalOpen] = useState(false);
  const [videoThumbFailed, setVideoThumbFailed] = useState(false);
  const [isOnline] = useState(() => typeof navigator !== "undefined" ? navigator.onLine : true);

  const thumbnailUrl = `https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg`;

  const handlePlayVideo = useCallback(() => {
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      setVideoModalOpen(true);
    } else {
      setVideoLoaded(true);
    }
  }, []);

  return (
    <div className="rounded-[16px] overflow-hidden bg-trainer-elevated border border-white/8">
      {/* Tab bar */}
      <div className="flex border-b border-white/8">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors relative",
              activeTab === id ? "text-trainer-indigo" : "text-white/40 hover:text-white/70"
            )}
          >
            <Icon size={14} />
            <span>{label}</span>
            {activeTab === id && (
              <motion.div
                layoutId="media-tab-indicator"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-trainer-indigo"
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="min-h-[200px]">
        <AnimatePresence mode="wait">
          {activeTab === "video" && (
            <motion.div
              key="video"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="relative aspect-video"
            >
              {!videoLoaded ? (
                <div
                  className="relative w-full h-full cursor-pointer group"
                  onClick={!videoThumbFailed ? handlePlayVideo : undefined}
                  role={!videoThumbFailed ? "button" : undefined}
                  aria-label={`Play ${exerciseName} form video`}
                  tabIndex={!videoThumbFailed ? 0 : undefined}
                  onKeyDown={(e) => !videoThumbFailed && e.key === "Enter" && handlePlayVideo()}
                >
                  {!isOnline ? (
                    <OfflineFallback exerciseName={exerciseName} instructions={instructions} />
                  ) : videoThumbFailed ? (
                    <div className="flex flex-col items-center justify-center h-full gap-3 p-6 bg-trainer-elevated">
                      <Play size={28} className="text-white/15" />
                      <p className="text-xs text-white/30 text-center">No video available for this exercise</p>
                    </div>
                  ) : (
                    <>
                      <Image
                        src={thumbnailUrl}
                        alt={`${exerciseName} form video thumbnail`}
                        fill
                        className="object-cover"
                        onError={(e) => {
                          const img = e.target as HTMLImageElement;
                          if (!img.src.includes("hqdefault")) {
                            img.src = `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`;
                          } else {
                            setVideoThumbFailed(true);
                          }
                        }}
                      />
                      <div className="absolute inset-0 bg-black/30 flex items-center justify-center group-hover:bg-black/20 transition-colors">
                        <motion.div
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.95 }}
                          className="w-16 h-16 bg-trainer-indigo rounded-full flex items-center justify-center shadow-lg shadow-trainer-indigo/40"
                        >
                          <Play size={24} className="text-white ml-1" fill="white" />
                        </motion.div>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <iframe
                  src={`https://www.youtube-nocookie.com/embed/${youtubeId}?autoplay=1&rel=0&modestbranding=1`}
                  title={`${exerciseName} form guide`}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full"
                />
              )}
            </motion.div>
          )}

          {activeTab === "muscles" && (
            <motion.div
              key="muscles"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col items-center justify-center py-4 px-2"
            >
              <MuscleActivationDiagram
                primaryMuscles={primaryMuscles}
                secondaryMuscles={secondaryMuscles}
                size="md"
                mode={mode}
                affectedArea={affectedArea}
                rehabilitationMuscles={rehabilitationMuscles}
              />
              <div className="mt-3 flex gap-4 text-xs text-white/50">
                {mode === "gym" ? (
                  <>
                    <span className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-full bg-trainer-indigo inline-block" />
                      Primary
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-full bg-trainer-indigo/35 inline-block" />
                      Secondary
                    </span>
                  </>
                ) : (
                  <>
                    <span className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-full bg-trainer-danger inline-block" />
                      Affected
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-full bg-trainer-success inline-block" />
                      Rehabilitating
                    </span>
                  </>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === "wger" && (
            <motion.div
              key="wger"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="p-4 space-y-4"
            >
              {localDetails && (
                <LocalDetailsPanel details={localDetails} />
              )}
              {wgerExerciseId && (
                <WgerDataPanel exerciseId={wgerExerciseId} exerciseName={exerciseName} />
              )}
              {!localDetails && !wgerExerciseId && (
                <p className="text-sm text-white/40 text-center py-8">
                  No supplementary data available for this exercise.
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Mobile video modal */}
      {videoModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black flex items-center justify-center md:hidden"
          onClick={() => setVideoModalOpen(false)}
        >
          <div className="w-full aspect-video" onClick={(e) => e.stopPropagation()}>
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${youtubeId}?autoplay=1&rel=0`}
              title={`${exerciseName} form guide`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full"
            />
          </div>
        </div>
      )}
    </div>
  );
}

function OfflineFallback({ exerciseName, instructions }: { exerciseName: string; instructions: string[] }) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 p-6 bg-trainer-elevated">
      <WifiOff size={32} className="text-white/20" />
      <div className="text-center">
        <p className="text-sm font-medium text-white/60">{exerciseName}</p>
        <p className="text-xs text-white/30 mt-1">Video unavailable offline</p>
      </div>
      {instructions.length > 0 && (
        <ol className="text-xs text-white/50 space-y-1.5 list-decimal list-inside max-h-32 overflow-y-auto w-full">
          {instructions.map((step, i) => (
            <li key={i}>{step}</li>
          ))}
        </ol>
      )}
    </div>
  );
}

function LocalDetailsPanel({ details }: { details: LocalExerciseDetails }) {
  const rows: { label: string; value: string }[] = [
    { label: "Movement", value: details.movementType },
    { label: "Force", value: details.forceType },
    { label: "Mechanic", value: details.mechanic },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-2">
        {rows.map(({ label, value }) => (
          <div key={label} className="flex flex-col gap-1 p-2.5 rounded-[10px] bg-white/4 border border-white/8">
            <p className="text-[9px] text-white/30 uppercase tracking-widest">{label}</p>
            <p className="text-xs font-semibold text-white/70 capitalize">{value}</p>
          </div>
        ))}
      </div>

      {details.equipment.length > 0 && (
        <div>
          <p className="text-[10px] text-white/30 uppercase tracking-widest mb-2">Equipment</p>
          <div className="flex flex-wrap gap-1.5">
            {details.equipment.map((eq) => (
              <span key={eq} className="text-xs px-2.5 py-1 rounded-full bg-white/8 text-white/60 capitalize">
                {eq.replace(/-/g, " ")}
              </span>
            ))}
          </div>
        </div>
      )}

      {details.tags.length > 0 && (
        <div>
          <p className="text-[10px] text-white/30 uppercase tracking-widest mb-2">Tags</p>
          <div className="flex flex-wrap gap-1.5">
            {details.tags.map((tag) => (
              <span key={tag} className="text-xs px-2.5 py-1 rounded-full bg-trainer-indigo/10 text-trainer-indigo/70 capitalize">
                {tag.replace(/-/g, " ")}
              </span>
            ))}
          </div>
        </div>
      )}

      {details.contraindications.length > 0 && (
        <div>
          <p className="text-[10px] text-white/30 uppercase tracking-widest mb-2">Contraindications</p>
          <ul className="space-y-1.5">
            {details.contraindications.map((c, i) => (
              <li key={i} className="flex gap-2 items-start">
                <span className="w-1.5 h-1.5 rounded-full bg-trainer-danger/50 shrink-0 mt-1.5" />
                <p className="text-xs text-white/50 leading-relaxed capitalize">{c}</p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function WgerDataPanel({ exerciseId, exerciseName }: { exerciseId: number; exerciseName: string }) {
  const [data, setData] = useState<WgerData | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState(false);

  const fetchWgerData = useCallback(async () => {
    if (fetched) return;
    setLoading(true);
    setFetched(true);

    try {
      const DB_NAME = "trainer-wger-cache";
      const STORE = "exercises";
      const CACHE_KEY = `wger-${exerciseId}`;
      const TTL_MS = 30 * 24 * 60 * 60 * 1000;

      const { openDB } = await import("idb");
      const db = await openDB(DB_NAME, 1, {
        upgrade(db) {
          if (!db.objectStoreNames.contains(STORE)) {
            db.createObjectStore(STORE);
          }
        },
      });

      const cached = await db.get(STORE, CACHE_KEY);
      if (cached && Date.now() - cached.timestamp < TTL_MS) {
        setData(cached.data);
        setLoading(false);
        return;
      }

      const res = await fetch(`https://wger.de/api/v2/exercise/${exerciseId}/?format=json`);
      if (!res.ok) throw new Error("Wger fetch failed");
      const json = await res.json();

      const imgRes = await fetch(`https://wger.de/api/v2/exerciseimage/?exercise=${exerciseId}&format=json`);
      const imgJson = await imgRes.json();
      const images: string[] = imgJson.results?.map((r: { image: string }) => r.image) || [];

      const wgerData: WgerData = {
        images,
        alternativeNames: json.aliases || [],
      };

      await db.put(STORE, { data: wgerData, timestamp: Date.now() }, CACHE_KEY);
      setData(wgerData);
    } catch {
      setData({ images: [], alternativeNames: [] });
    } finally {
      setLoading(false);
    }
  }, [exerciseId, fetched]);

  useEffect(() => {
    fetchWgerData();
  }, [fetchWgerData]);

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="skeleton h-4 w-40 rounded-[4px]" />
        <div className="skeleton h-32 rounded-[12px]" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs text-white/30 mb-1.5">Source: Wger Open Exercise Database</p>
        <p className="text-sm font-medium text-white">{exerciseName}</p>
      </div>

      {data?.alternativeNames && data.alternativeNames.length > 0 && (
        <div>
          <p className="text-xs text-white/40 mb-1">Also known as:</p>
          <p className="text-sm text-white/70">{data.alternativeNames.join(", ")}</p>
        </div>
      )}

      {data?.images && data.images.length > 0 && (
        <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
          {data.images.map((src, i) => (
            <div key={i} className="relative shrink-0 w-32 h-32 rounded-[12px] overflow-hidden">
              <Image src={src} alt={`${exerciseName} image ${i + 1}`} fill className="object-cover" />
            </div>
          ))}
        </div>
      )}

      {(!data?.images || data.images.length === 0) && (
        <p className="text-sm text-white/30 text-center py-4">No images available from Wger</p>
      )}
    </div>
  );
}
