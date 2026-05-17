import { glossaryTerms, glossaryMap, type GlossaryTerm, type GlossaryCategory } from "./glossary";
import { gymGlossaryTerms } from "./glossary-gym";

export const allGlossaryTerms: GlossaryTerm[] = [
  ...glossaryTerms,
  ...gymGlossaryTerms,
];

export const allGlossaryMap: Record<string, GlossaryTerm> = Object.fromEntries(
  allGlossaryTerms.map((t) => [t.id, t])
);

export function getTermById(id: string): GlossaryTerm | undefined {
  return allGlossaryMap[id];
}

export function getTermsByCategory(category: GlossaryCategory): GlossaryTerm[] {
  return allGlossaryTerms.filter((t) => t.category === category);
}

export function getTermsByBodyRegion(region: string): GlossaryTerm[] {
  return allGlossaryTerms.filter(
    (t) => t.bodyRegion?.toLowerCase().includes(region.toLowerCase())
  );
}

export function searchGlossary(query: string): GlossaryTerm[] {
  const q = query.toLowerCase();
  return allGlossaryTerms.filter(
    (t) =>
      t.term.toLowerCase().includes(q) ||
      t.shortDefinition.toLowerCase().includes(q) ||
      t.relatedTerms.some((r) => r.toLowerCase().includes(q))
  );
}

export function getRelatedTerms(id: string): GlossaryTerm[] {
  const term = allGlossaryMap[id];
  if (!term) return [];
  return term.relatedTerms
    .map((relId) => allGlossaryMap[relId])
    .filter(Boolean) as GlossaryTerm[];
}

export type { GlossaryTerm, GlossaryCategory };
export { glossaryTerms, gymGlossaryTerms, glossaryMap };
