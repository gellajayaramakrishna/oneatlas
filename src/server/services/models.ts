import "server-only";
import type { ModelType, Prisma } from "@prisma/client";
import { cache } from "react";
import { prisma } from "../db";
import { ApiError } from "../http";
import type { ModelListQuery } from "../validation";
import { dec, modelCardSelect, toModelCard, type ModelCard } from "./serializers";

export interface Paginated<T> {
  data: T[];
  meta: { page: number; pageSize: number; total: number; totalPages: number };
}

function buildWhere(q: ModelListQuery): Prisma.ModelWhereInput {
  const and: Prisma.ModelWhereInput[] = [];
  if (q.q) {
    and.push({
      OR: [
        { name: { contains: q.q, mode: "insensitive" } },
        { slug: { contains: q.q.toLowerCase().replace(/\s+/g, "-") } },
        { description: { contains: q.q, mode: "insensitive" } },
        { lab: { name: { contains: q.q, mode: "insensitive" } } },
      ],
    });
  }
  if (q.lab) and.push({ lab: { slug: { in: q.lab } } });
  if (q.provider) and.push({ offerings: { some: { provider: { slug: { in: q.provider } } } } });
  if (q.type) and.push({ type: { in: q.type } });
  // Capability/modality filters are AND: "tool-calling AND vision" narrows results.
  if (q.capability) and.push({ capabilities: { hasEvery: q.capability } });
  if (q.modality) and.push({ inputModalities: { hasEvery: q.modality } });
  if (q.openWeights !== undefined) and.push({ openWeights: q.openWeights });
  if (q.maxPrice !== undefined) and.push({ minInputPrice: { lte: q.maxPrice } });
  if (q.minContext !== undefined) and.push({ contextWindow: { gte: q.minContext } });
  return and.length ? { AND: and } : {};
}

const DEFAULT_ORDER: Record<ModelListQuery["sort"], "asc" | "desc"> = {
  release: "desc",
  price: "asc",
  "output-price": "asc",
  context: "desc",
  name: "asc",
  score: "desc",
};

function buildOrderBy(q: ModelListQuery): Prisma.ModelOrderByWithRelationInput[] {
  const dir = q.order ?? DEFAULT_ORDER[q.sort];
  const primary: Prisma.ModelOrderByWithRelationInput =
    q.sort === "release" ? { releaseDate: dir }
    : q.sort === "price" ? { minInputPrice: { sort: dir, nulls: "last" } }
    : q.sort === "output-price" ? { minOutputPrice: { sort: dir, nulls: "last" } }
    : q.sort === "context" ? { contextWindow: dir }
    : q.sort === "score" ? { atlasScore: { sort: dir, nulls: "last" } }
    : { name: dir };
  // Unique tiebreaker keeps offset pagination stable (no duplicates/skips across pages).
  return [primary, { slug: "asc" }];
}

export async function listModels(q: ModelListQuery): Promise<Paginated<ModelCard>> {
  const where = buildWhere(q);
  const [rows, total] = await prisma.$transaction([
    prisma.model.findMany({
      where,
      orderBy: buildOrderBy(q),
      skip: (q.page - 1) * q.pageSize,
      take: q.pageSize,
      select: modelCardSelect,
    }),
    prisma.model.count({ where }),
  ]);
  return {
    data: rows.map(toModelCard),
    meta: { page: q.page, pageSize: q.pageSize, total, totalPages: Math.max(1, Math.ceil(total / q.pageSize)) },
  };
}

const detailInclude = {
  lab: { select: { slug: true, name: true, brandColor: true, website: true } },
  offerings: {
    include: { provider: { select: { slug: true, name: true, kind: true, website: true } } },
    orderBy: [{ inputPrice: "asc" }, { outputPrice: "asc" }],
  },
  scores: {
    include: { benchmark: { select: { id: true, slug: true, name: true, category: true, unit: true, higherIsBetter: true } } },
  },
} satisfies Prisma.ModelInclude;

type DetailRow = Prisma.ModelGetPayload<{ include: typeof detailInclude }>;

export interface ModelDetail extends ModelCard {
  description: string;
  maxOutputTokens: number | null;
  parameterCount: string | null;
  license: string | null;
  knowledgeCutoff: string | null;
  outputModalities: string[];
  lab: ModelCard["lab"] & { website: string };
  offerings: Array<{
    provider: { slug: string; name: string; kind: string; website: string };
    inputPrice: number;
    outputPrice: number;
    cachedInputPrice: number | null;
    contextWindow: number;
    throughputTps: number | null;
    latencyMs: number | null;
    uptimePct: number | null;
  }>;
  benchmarks: Array<{
    slug: string;
    name: string;
    category: string;
    unit: string;
    score: number;
    rank: number;
    totalRanked: number;
  }>;
}

function toDetail(row: DetailRow, ranks: Map<string, { rank: number; total: number }>): ModelDetail {
  return {
    ...toModelCard(row),
    description: row.description,
    maxOutputTokens: row.maxOutputTokens,
    parameterCount: row.parameterCount,
    license: row.license,
    knowledgeCutoff: row.knowledgeCutoff,
    outputModalities: row.outputModalities,
    lab: { slug: row.lab.slug, name: row.lab.name, brandColor: row.lab.brandColor, website: row.lab.website },
    offerings: row.offerings.map((o) => ({
      provider: o.provider,
      inputPrice: dec(o.inputPrice)!,
      outputPrice: dec(o.outputPrice)!,
      cachedInputPrice: dec(o.cachedInputPrice),
      contextWindow: o.contextWindow,
      throughputTps: o.throughputTps,
      latencyMs: o.latencyMs,
      uptimePct: o.uptimePct,
    })),
    benchmarks: row.scores
      .map((s) => ({
        slug: s.benchmark.slug,
        name: s.benchmark.name,
        category: s.benchmark.category,
        unit: s.benchmark.unit,
        score: s.score,
        rank: ranks.get(s.benchmark.id)?.rank ?? 0,
        totalRanked: ranks.get(s.benchmark.id)?.total ?? 0,
      }))
      .sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name)),
  };
}

/** Rank of a model on each of its benchmarks, in one query for all benchmarks. */
async function computeRanks(row: DetailRow) {
  const ids = row.scores.map((s) => s.benchmarkId);
  const ranks = new Map<string, { rank: number; total: number }>();
  if (!ids.length) return ranks;
  const all = await prisma.benchmarkScore.findMany({ where: { benchmarkId: { in: ids } }, select: { benchmarkId: true, score: true } });
  for (const s of row.scores) {
    const peers = all.filter((a) => a.benchmarkId === s.benchmarkId);
    const better = peers.filter((p) => (s.benchmark.higherIsBetter ? p.score > s.score : p.score < s.score)).length;
    ranks.set(s.benchmarkId, { rank: better + 1, total: peers.length });
  }
  return ranks;
}

// React cache(): generateMetadata and the page both call this; only one DB round-trip per request.
export const getModel = cache(async (slug: string): Promise<ModelDetail> => {
  const row = await prisma.model.findUnique({ where: { slug }, include: detailInclude });
  if (!row) throw ApiError.notFound(`Model "${slug}"`);
  return toDetail(row, await computeRanks(row));
});

export async function getSimilarModels(model: ModelDetail, limit = 4): Promise<ModelCard[]> {
  const rows = await prisma.model.findMany({
    where: { slug: { not: model.slug }, type: model.type as ModelType },
    select: modelCardSelect,
    take: 30,
  });
  const target = model.atlasScore ?? 50;
  return rows
    .map(toModelCard)
    .sort((a, b) => Math.abs((a.atlasScore ?? 0) - target) - Math.abs((b.atlasScore ?? 0) - target))
    .slice(0, limit);
}

/** Fetch several models for side-by-side comparison, preserving the requested order. */
export async function compareModels(slugs: string[]): Promise<ModelDetail[]> {
  const rows = await prisma.model.findMany({ where: { slug: { in: slugs } }, include: detailInclude });
  const missing = slugs.filter((s) => !rows.some((r) => r.slug === s));
  if (missing.length) throw new ApiError(404, "not_found", `Unknown model(s): ${missing.join(", ")}`, { missing });
  const details = await Promise.all(rows.map(async (r) => toDetail(r, await computeRanks(r))));
  return slugs.map((s) => details.find((d) => d.slug === s)!);
}

export interface Facets {
  labs: { slug: string; name: string; count: number }[];
  providers: { slug: string; name: string; count: number }[];
  types: { value: string; count: number }[];
  capabilities: { value: string; count: number }[];
  modalities: { value: string; count: number }[];
}

/** Filter options with counts, computed from the database (never hardcoded in the UI). */
export const getFacets = cache(async (): Promise<Facets> => {
  const [labs, providers, types, caps, mods] = await Promise.all([
    prisma.lab.findMany({ select: { slug: true, name: true, _count: { select: { models: true } } }, orderBy: { name: "asc" } }),
    prisma.provider.findMany({ select: { slug: true, name: true, _count: { select: { offerings: true } } }, orderBy: { name: "asc" } }),
    prisma.model.groupBy({ by: ["type"], _count: { _all: true } }),
    prisma.$queryRaw<{ value: string; count: number }[]>`
      SELECT c AS value, COUNT(*)::int AS count FROM "Model", unnest("capabilities") AS c GROUP BY c ORDER BY count DESC`,
    prisma.$queryRaw<{ value: string; count: number }[]>`
      SELECT m AS value, COUNT(*)::int AS count FROM "Model", unnest("inputModalities") AS m GROUP BY m ORDER BY count DESC`,
  ]);
  return {
    labs: labs.map((l) => ({ slug: l.slug, name: l.name, count: l._count.models })),
    providers: providers.map((p) => ({ slug: p.slug, name: p.name, count: p._count.offerings })),
    types: types.map((t) => ({ value: t.type, count: t._count._all })).sort((a, b) => b.count - a.count),
    capabilities: caps,
    modalities: mods,
  };
});

export const getCatalogStats = cache(async () => {
  const [models, labs, providers, offerings, openWeights] = await prisma.$transaction([
    prisma.model.count(),
    prisma.lab.count(),
    prisma.provider.count(),
    prisma.modelOffering.count(),
    prisma.model.count({ where: { openWeights: true } }),
  ]);
  return { models, labs, providers, offerings, openWeights };
});
