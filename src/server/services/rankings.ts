import "server-only";
import type { Prisma } from "@prisma/client";
import { cache } from "react";
import { prisma } from "../db";
import { ApiError } from "../http";
import type { RankingsQuery } from "../validation";
import { modelCardSelect, toModelCard, type ModelCard } from "./serializers";

export interface BenchmarkInfo {
  slug: string;
  name: string;
  description: string;
  category: string;
  unit: string;
  higherIsBetter: boolean;
  modelCount: number;
}

export const listBenchmarks = cache(async (): Promise<BenchmarkInfo[]> => {
  const rows = await prisma.benchmark.findMany({
    include: { _count: { select: { scores: true } } },
    orderBy: [{ category: "asc" }, { name: "asc" }],
  });
  return rows.map((b) => ({
    slug: b.slug,
    name: b.name,
    description: b.description,
    category: b.category,
    unit: b.unit,
    higherIsBetter: b.higherIsBetter,
    modelCount: b._count.scores,
  }));
});

export interface RankingRow {
  rank: number;
  model: ModelCard;
  /** The value the table is sorted by: a benchmark score, a category mean, or the atlas score. */
  score: number;
  /** Per-benchmark scores keyed by benchmark slug, for the comparison columns. */
  scores: Record<string, number>;
}

export interface Rankings {
  mode: "overall" | "category" | "benchmark";
  title: string;
  unit: string;
  columns: BenchmarkInfo[];
  rows: RankingRow[];
}

/**
 * Three leaderboard modes:
 *  - benchmark: sorted by one benchmark's raw score
 *  - category:  mean of the raw scores within a category (all share a unit)
 *  - overall:   sorted by atlasScore (normalized mean across every benchmark)
 */
export async function getRankings(q: RankingsQuery): Promise<Rankings> {
  const allBenchmarks = await listBenchmarks();
  const modelFilter: Prisma.ModelWhereInput = {
    ...(q.type ? { type: { in: q.type } } : {}),
    ...(q.openWeights !== undefined ? { openWeights: q.openWeights } : {}),
  };

  let columns: BenchmarkInfo[];
  let mode: Rankings["mode"];
  let title: string;
  if (q.benchmark) {
    const b = allBenchmarks.find((x) => x.slug === q.benchmark);
    if (!b) throw ApiError.notFound(`Benchmark "${q.benchmark}"`);
    columns = [b];
    mode = "benchmark";
    title = b.name;
  } else if (q.category) {
    columns = allBenchmarks.filter((b) => b.category === q.category);
    mode = "category";
    title = q.category;
  } else {
    columns = allBenchmarks;
    mode = "overall";
    title = "Atlas Index";
  }

  const models = await prisma.model.findMany({
    where: {
      ...modelFilter,
      ...(mode === "overall" ? { atlasScore: { not: null } } : { scores: { some: { benchmark: { slug: { in: columns.map((c) => c.slug) } } } } }),
    },
    select: {
      ...modelCardSelect,
      scores: { select: { score: true, benchmark: { select: { slug: true } } } },
    },
  });

  const higherBetter = new Map(columns.map((c) => [c.slug, c.higherIsBetter]));
  const rows = models
    .map((m) => {
      const scores: Record<string, number> = {};
      for (const s of m.scores) scores[s.benchmark.slug] = s.score;
      let score: number;
      if (mode === "overall") score = m.atlasScore!;
      else {
        const vals = columns.map((c) => scores[c.slug]).filter((v): v is number => v !== undefined);
        score = vals.reduce((a, b) => a + b, 0) / vals.length;
      }
      return { model: toModelCard(m), score: Math.round(score * 10) / 10, scores };
    })
    .sort((a, b) => {
      const hib = mode === "benchmark" ? higherBetter.get(columns[0].slug) ?? true : true;
      return hib ? b.score - a.score : a.score - b.score;
    })
    .slice(0, q.limit);

  // Standard competition ranking: ties share a rank (1, 2, 2, 4).
  const ranked: RankingRow[] = [];
  rows.forEach((r, i) => {
    const rank = i > 0 && rows[i - 1].score === r.score ? ranked[i - 1].rank : i + 1;
    ranked.push({ rank, ...r });
  });

  return {
    mode,
    title,
    unit: mode === "overall" ? "index" : columns[0]?.unit ?? "%",
    columns,
    rows: ranked,
  };
}
