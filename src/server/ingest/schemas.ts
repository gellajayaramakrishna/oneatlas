import { z } from "zod";
import { BENCHMARK_CATEGORIES, CAPABILITIES, MODALITIES, MODEL_TYPES } from "@/lib/constants";

// ---------------------------------------------------------------------------
// RAW input schemas: what a data feed / admin upload may look like.
// They are deliberately permissive about *format* (strings like "128k", prices
// in different units) and strict about *meaning* (known enums, valid slugs).
// ---------------------------------------------------------------------------

const slug = z
  .string()
  .min(1)
  .max(80)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "slug must be lowercase kebab-case");

/** "128k", "1M", "1.5m", "200,000", 8192 */
export const tokenCount = z.union([z.number().int().positive(), z.string().min(1)]);

/** Feeds are inconsistent about case and whitespace in tags ("Vision ", "TOOL-CALLING"). */
const tag = <T extends [string, ...string[]]>(values: T) =>
  z.preprocess((v) => (typeof v === "string" ? v.trim().toLowerCase() : v), z.enum(values));

const hexColor = z.string().regex(/^#[0-9a-fA-F]{6}$/);

export const rawLabSchema = z.object({
  slug,
  name: z.string().min(1),
  description: z.string().min(1),
  website: z.string().url(),
  headquarters: z.string().min(1),
  founded: z.number().int().min(1900).max(2100),
  color: hexColor.optional(),
});

export const rawProviderSchema = z.object({
  slug,
  name: z.string().min(1),
  description: z.string().min(1),
  website: z.string().url(),
  kind: z.enum(["first-party", "aggregator", "inference-cloud", "hyperscaler"]),
  perf: z
    .object({
      tps: z.number().positive(),
      latencyMs: z.number().int().positive(),
      uptime: z.number().min(0).max(100),
    })
    .optional(),
});

export const priceUnit = z.enum(["per_1m", "per_1k", "per_token"]);

export const rawOfferingSchema = z.object({
  provider: slug,
  in: z.number().nonnegative(),
  out: z.number().nonnegative(),
  cached: z.number().nonnegative().optional(),
  unit: priceUnit.default("per_1m"),
  context: tokenCount.optional(),
  tps: z.number().positive().optional(),
  latencyMs: z.number().int().positive().optional(),
});

// Embeddings output vectors, not a modality the UI filters on, so allow it here.
const outputModality = tag([...MODALITIES, "embedding"]);

export const rawModelSchema = z
  .object({
    slug,
    name: z.string().min(1),
    lab: slug,
    type: z.enum(MODEL_TYPES),
    released: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "released must be YYYY-MM-DD"),
    context: tokenCount,
    maxOutput: tokenCount.optional(),
    params: z.string().optional(),
    open: z.boolean().optional(),
    license: z.string().optional(),
    cutoff: z.string().optional(),
    input: z.array(tag([...MODALITIES])).min(1),
    output: z.array(outputModality).min(1),
    caps: z.array(tag([...CAPABILITIES])),
    description: z.string().min(1),
    tier: z
      .object({
        q: z.number().min(0).max(1),
        code: z.number().optional(),
        math: z.number().optional(),
        reason: z.number().optional(),
        vision: z.number().optional(),
      })
      .optional(),
    offerings: z.array(rawOfferingSchema).default([]),
  })
  .superRefine((m, ctx) => {
    const seen = new Set<string>();
    m.offerings.forEach((o, i) => {
      if (seen.has(o.provider)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["offerings", i, "provider"], message: `duplicate provider "${o.provider}"` });
      }
      seen.add(o.provider);
    });
  });

export const rawBenchmarkSchema = z.object({
  slug,
  name: z.string().min(1),
  description: z.string().min(1),
  category: z.enum(BENCHMARK_CATEGORIES),
  unit: z.enum(["%", "elo"]).default("%"),
  higherIsBetter: z.boolean().default(true),
});

export const rawScoreSchema = z.object({
  model: slug,
  benchmark: slug,
  score: z.number().finite(),
  source: z.string().optional(),
});

export const ingestPayloadSchema = z.object({
  labs: z.array(rawLabSchema).default([]),
  providers: z.array(rawProviderSchema).default([]),
  models: z.array(rawModelSchema).default([]),
  benchmarks: z.array(rawBenchmarkSchema).default([]),
  scores: z.array(rawScoreSchema).default([]),
});

export type RawLab = z.input<typeof rawLabSchema>;
export type RawProvider = z.input<typeof rawProviderSchema>;
export type RawModel = z.input<typeof rawModelSchema>;
export type RawBenchmark = z.input<typeof rawBenchmarkSchema>;
export type RawScore = z.input<typeof rawScoreSchema>;
export type IngestPayload = z.input<typeof ingestPayloadSchema>;
export type ParsedIngestPayload = z.output<typeof ingestPayloadSchema>;
