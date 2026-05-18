"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, ChevronDown, BookOpen } from "lucide-react";
import {
  allGlossaryTerms,
  searchGlossary,
  getRelatedTerms,
  type GlossaryTerm,
  type GlossaryCategory,
} from "@/app/data/glossaryIndex";
import { cn } from "@/app/lib/utils";

// ─── Config ───────────────────────────────────────────────────────────────────

const CATEGORIES: { value: GlossaryCategory | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "anatomy", label: "Anatomy" },
  { value: "physio-condition", label: "Conditions" },
  { value: "movement", label: "Movement" },
  { value: "assessment", label: "Training" },
];

const CATEGORY_STYLE: Record<GlossaryCategory, { label: string; className: string }> = {
  anatomy: { label: "Anatomy", className: "text-sky-400 bg-sky-400/10" },
  "physio-condition": { label: "Condition", className: "text-trainer-warning bg-trainer-warning/10" },
  movement: { label: "Movement", className: "text-trainer-indigo bg-trainer-indigo/10" },
  assessment: { label: "Training", className: "text-trainer-success bg-trainer-success/10" },
};

// ─── Term card ────────────────────────────────────────────────────────────────

function TermCard({
  term,
  isExpanded,
  onToggle,
}: {
  term: GlossaryTerm;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const related = useMemo(() => getRelatedTerms(term.id).slice(0, 4), [term.id]);
  const style = CATEGORY_STYLE[term.category];

  return (
    <motion.div
      layout
      className="bg-trainer-surface border border-white/8 rounded-[14px] overflow-hidden"
    >
      {/* Header row */}
      <button
        onClick={onToggle}
        className="w-full flex items-start gap-3 p-4 text-left"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <p className="text-sm font-bold text-white/90">{term.term}</p>
            <span
              className={cn(
                "text-[10px] font-semibold px-2 py-0.5 rounded-full",
                style.className
              )}
            >
              {style.label}
            </span>
          </div>
          <p className="text-xs text-white/45 leading-relaxed">{term.shortDefinition}</p>
        </div>
        <motion.div
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="shrink-0 mt-0.5"
        >
          <ChevronDown size={15} className="text-white/30" />
        </motion.div>
      </button>

      {/* Expanded content */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 border-t border-white/6 pt-3 flex flex-col gap-3">
              {/* Full definition */}
              <p className="text-sm text-white/60 leading-relaxed">{term.fullDefinition}</p>

              {/* Latin origin */}
              {term.latinOrigin && (
                <div>
                  <p className="text-[10px] text-white/25 uppercase tracking-widest font-semibold mb-1">
                    Etymology
                  </p>
                  <p className="text-xs text-white/40 italic">{term.latinOrigin}</p>
                </div>
              )}

              {/* Body region */}
              {term.bodyRegion && (
                <div className="flex items-center gap-2">
                  <p className="text-[10px] text-white/25 uppercase tracking-widest font-semibold">
                    Region
                  </p>
                  <span className="text-xs font-semibold text-white/50 capitalize">
                    {term.bodyRegion}
                  </span>
                </div>
              )}

              {/* Related terms */}
              {related.length > 0 && (
                <div>
                  <p className="text-[10px] text-white/25 uppercase tracking-widest font-semibold mb-2">
                    Related
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {related.map((r) => (
                      <span
                        key={r.id}
                        className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-white/6 text-white/45"
                      >
                        {r.term}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function GlossaryPage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<GlossaryCategory | "all">("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let terms = search.trim() ? searchGlossary(search) : allGlossaryTerms;
    if (category !== "all") terms = terms.filter((t) => t.category === category);
    return terms.sort((a, b) => a.term.localeCompare(b.term));
  }, [search, category]);

  // Group by first letter for alphabetical sections
  const grouped = useMemo(() => {
    const map = new Map<string, GlossaryTerm[]>();
    for (const term of filtered) {
      const letter = term.term[0].toUpperCase();
      if (!map.has(letter)) map.set(letter, []);
      map.get(letter)!.push(term);
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [filtered]);

  function toggle(id: string) {
    setExpandedId((prev) => (prev === id ? null : id));
  }

  return (
    <div className="flex flex-col min-h-full pb-24 page-enter">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="px-5 pt-14 pb-5"
      >
        <div className="flex items-center gap-2 mb-1">
          <BookOpen size={20} className="text-trainer-indigo" />
          <h1 className="text-2xl font-bold text-white">Glossary</h1>
        </div>
        <p className="text-sm text-white/40">{allGlossaryTerms.length} terms · anatomy, conditions & training</p>
      </motion.div>

      {/* Search */}
      <div className="px-5 mb-4">
        <div className="relative">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
          <input
            type="text"
            placeholder="Search terms…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-trainer-elevated border border-white/10 rounded-[12px] pl-10 pr-4 py-3 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-trainer-indigo/50"
          />
        </div>
      </div>

      {/* Category filter */}
      <div className="px-5 mb-5">
        <div className="flex gap-1.5 overflow-x-auto scrollbar-none pb-1">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setCategory(cat.value)}
              className={cn(
                "shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-200",
                category === cat.value
                  ? "bg-trainer-indigo text-white"
                  : "bg-white/8 text-white/45 hover:text-white"
              )}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Results count */}
      {search && (
        <p className="px-5 mb-3 text-xs text-white/30">
          {filtered.length} result{filtered.length !== 1 ? "s" : ""}
        </p>
      )}

      {/* Term list */}
      <div className="flex flex-col gap-6 px-5">
        {grouped.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <BookOpen size={32} className="text-white/15" />
            <p className="text-sm text-white/30">No terms match your search.</p>
          </div>
        ) : (
          grouped.map(([letter, terms]) => (
            <div key={letter}>
              <p className="text-[11px] font-bold text-white/20 uppercase tracking-widest mb-2">
                {letter}
              </p>
              <div className="flex flex-col gap-2">
                {terms.map((term) => (
                  <TermCard
                    key={term.id}
                    term={term}
                    isExpanded={expandedId === term.id}
                    onToggle={() => toggle(term.id)}
                  />
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
