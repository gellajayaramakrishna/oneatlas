import "server-only";
import { prisma } from "../db";

export interface SearchResults {
  models: { slug: string; name: string; lab: string; type: string }[];
  labs: { slug: string; name: string; modelCount: number }[];
  providers: { slug: string; name: string; kind: string }[];
}

/**
 * Global search for the command palette. Name matches rank above description
 * matches, and prefix matches rank above substring matches.
 *
 * At this catalog size ILIKE is plenty fast. The scale-up path is a pg_trgm GIN
 * index or a tsvector column, without changing this function's contract.
 */
export async function globalSearch(q: string, limit = 6): Promise<SearchResults> {
  const term = q.trim();
  const lower = term.toLowerCase();
  const contains = { contains: term, mode: "insensitive" as const };

  const [models, labs, providers] = await Promise.all([
    prisma.model.findMany({
      where: { OR: [{ name: contains }, { slug: { contains: lower.replace(/\s+/g, "-") } }, { lab: { name: contains } }, { description: contains }] },
      select: { slug: true, name: true, type: true, description: true, lab: { select: { name: true } } },
      take: 40,
    }),
    prisma.lab.findMany({
      where: { OR: [{ name: contains }, { slug: { contains: lower } }] },
      select: { slug: true, name: true, _count: { select: { models: true } } },
      take: limit,
    }),
    prisma.provider.findMany({
      where: { OR: [{ name: contains }, { slug: { contains: lower } }] },
      select: { slug: true, name: true, kind: true },
      take: limit,
    }),
  ]);

  const rank = (name: string, labName: string) => {
    const n = name.toLowerCase();
    if (n === lower) return 0;
    if (n.startsWith(lower)) return 1;
    if (n.includes(lower)) return 2;
    if (labName.toLowerCase().includes(lower)) return 3;
    return 4; // description-only match
  };

  return {
    models: models
      .sort((a, b) => rank(a.name, a.lab.name) - rank(b.name, b.lab.name) || a.name.localeCompare(b.name))
      .slice(0, limit)
      .map((m) => ({ slug: m.slug, name: m.name, lab: m.lab.name, type: m.type })),
    labs: labs.map((l) => ({ slug: l.slug, name: l.name, modelCount: l._count.models })),
    providers,
  };
}
