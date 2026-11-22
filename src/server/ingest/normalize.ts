// Pure normalization helpers. No database access here, so everything is unit-testable.

export class NormalizationError extends Error {
  constructor(message: string, public path: string) {
    super(`${path}: ${message}`);
    this.name = "NormalizationError";
  }
}

/**
 * Parse token counts written the way vendors write them.
 *   8192 -> 8192, "128k" -> 128000, "1M" -> 1000000, "1.5m" -> 1500000, "200,000" -> 200000
 * "k" is treated as 1000 (the marketing convention), not 1024.
 */
export function parseTokenCount(value: number | string, path = "value"): number {
  if (typeof value === "number") {
    if (!Number.isInteger(value) || value <= 0) throw new NormalizationError(`invalid token count ${value}`, path);
    return value;
  }
  const cleaned = value.trim().toLowerCase().replace(/[,_\s]/g, "");
  const match = cleaned.match(/^(\d+(?:\.\d+)?)([km]?)$/);
  if (!match) throw new NormalizationError(`cannot parse token count "${value}"`, path);
  const num = Number(match[1]);
  const mult = match[2] === "m" ? 1_000_000 : match[2] === "k" ? 1_000 : 1;
  const result = Math.round(num * mult);
  if (result <= 0) throw new NormalizationError(`token count must be positive, got "${value}"`, path);
  return result;
}

export type PriceUnit = "per_1m" | "per_1k" | "per_token";

/** Convert any price to USD per 1M tokens, rounded to 4 dp to strip float noise (0.00125*1000 = 1.2499999...). */
export function toPerMillion(price: number, unit: PriceUnit): number {
  const factor = unit === "per_1m" ? 1 : unit === "per_1k" ? 1_000 : 1_000_000;
  return Math.round(price * factor * 10_000) / 10_000;
}

/** Parse "YYYY-MM-DD" as a UTC date (avoids the local-timezone off-by-one). */
export function parseReleaseDate(value: string, path = "released"): Date {
  const d = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(d.getTime())) throw new NormalizationError(`invalid date "${value}"`, path);
  return d;
}

/** Order-preserving de-duplication, lowercased. Feeds often repeat tags. */
export function normalizeTags(tags: readonly string[]): string[] {
  return Array.from(new Set(tags.map((t) => t.trim().toLowerCase()).filter(Boolean)));
}

/** Deterministic value in [0, 1) derived from a string. Used to spread synthetic perf numbers. */
export function stableHash01(key: string): number {
  let h = 2166136261;
  for (let i = 0; i < key.length; i++) h = Math.imul(h ^ key.charCodeAt(i), 16777619);
  return (h >>> 0) / 0x100000000;
}

export interface ScoreRow {
  modelId: string;
  benchmarkId: string;
  score: number;
}
export interface BenchmarkMeta {
  id: string;
  higherIsBetter: boolean;
}

/**
 * Atlas score = mean of per-benchmark min-max normalized scores (0-100).
 *
 * Normalizing first is what makes Elo (~1100-1500) and percentages (0-100)
 * averageable. Models with fewer than `minBenchmarks` results get null, so a
 * model that only reports one easy benchmark cannot top the overall table.
 */
export function computeAtlasScores(
  scores: ScoreRow[],
  benchmarks: BenchmarkMeta[],
  minBenchmarks = 3,
): Map<string, number | null> {
  const meta = new Map(benchmarks.map((b) => [b.id, b]));
  const bounds = new Map<string, { min: number; max: number }>();
  for (const s of scores) {
    const b = bounds.get(s.benchmarkId);
    if (!b) bounds.set(s.benchmarkId, { min: s.score, max: s.score });
    else {
      b.min = Math.min(b.min, s.score);
      b.max = Math.max(b.max, s.score);
    }
  }

  const perModel = new Map<string, number[]>();
  for (const s of scores) {
    const b = bounds.get(s.benchmarkId)!;
    const higher = meta.get(s.benchmarkId)?.higherIsBetter ?? true;
    const span = b.max - b.min;
    let n = span === 0 ? 1 : (s.score - b.min) / span;
    if (!higher) n = 1 - n;
    const list = perModel.get(s.modelId) ?? [];
    list.push(n * 100);
    perModel.set(s.modelId, list);
  }

  const result = new Map<string, number | null>();
  for (const [modelId, list] of perModel) {
    result.set(
      modelId,
      list.length >= minBenchmarks ? Math.round((list.reduce((a, b) => a + b, 0) / list.length) * 10) / 10 : null,
    );
  }
  return result;
}
