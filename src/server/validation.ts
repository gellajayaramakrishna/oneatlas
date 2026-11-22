import { z } from "zod";
import {
  BENCHMARK_CATEGORIES,
  CAPABILITIES,
  DEFAULT_PAGE_SIZE,
  MAX_COMPARE,
  MAX_PAGE_SIZE,
  MODALITIES,
  MODEL_SORTS,
  MODEL_TYPES,
} from "@/lib/constants";

// Query strings arrive as strings, or arrays when a key repeats. These helpers
// accept both "?lab=openai&lab=meta" and "?lab=openai,meta".

type RawParams = URLSearchParams | Record<string, string | string[] | undefined>;

function toRecord(params: RawParams): Record<string, string | string[]> {
  const out: Record<string, string | string[]> = {};
  if (params instanceof URLSearchParams) {
    for (const key of new Set(params.keys())) {
      const all = params.getAll(key);
      out[key] = all.length > 1 ? all : all[0];
    }
  } else {
    for (const [k, v] of Object.entries(params)) if (v !== undefined) out[k] = v;
  }
  return out;
}

const csv = <T extends z.ZodTypeAny>(item: T) =>
  z.preprocess((v) => {
    if (v == null || v === "") return undefined;
    const arr = Array.isArray(v) ? v : [v];
    const parts = arr.flatMap((s) => String(s).split(",")).map((s) => s.trim()).filter(Boolean);
    return parts.length ? Array.from(new Set(parts)) : undefined;
  }, z.array(item).max(50).optional());

const bool = z.preprocess((v) => {
  if (v === "true" || v === "1") return true;
  if (v === "false" || v === "0") return false;
  return v === "" ? undefined : v;
}, z.boolean().optional());

const slug = z.string().regex(/^[a-z0-9-]+$/, "invalid slug").max(80);

export const modelListQuery = z.object({
  q: z.string().trim().max(100).optional().transform((v) => v || undefined),
  lab: csv(slug),
  provider: csv(slug),
  type: csv(z.enum(MODEL_TYPES)),
  capability: csv(z.enum(CAPABILITIES)),
  modality: csv(z.enum(MODALITIES)),
  openWeights: bool,
  maxPrice: z.coerce.number().nonnegative().max(1000).optional(),
  minContext: z.coerce.number().int().nonnegative().optional(),
  sort: z.enum(MODEL_SORTS).default("release"),
  order: z.enum(["asc", "desc"]).optional(),
  page: z.coerce.number().int().min(1).max(10_000).default(1),
  pageSize: z.coerce.number().int().min(1).max(MAX_PAGE_SIZE).default(DEFAULT_PAGE_SIZE),
});
export type ModelListQuery = z.output<typeof modelListQuery>;

export const compareQuery = z.object({
  models: csv(slug).pipe(
    z.array(slug).min(1, "pass at least one model slug").max(MAX_COMPARE, `compare at most ${MAX_COMPARE} models`),
  ),
});

export const rankingsQuery = z.object({
  benchmark: slug.optional(),
  category: z.enum(BENCHMARK_CATEGORIES).optional(),
  type: csv(z.enum(MODEL_TYPES)),
  openWeights: bool,
  limit: z.coerce.number().int().min(1).max(100).default(50),
});
export type RankingsQuery = z.output<typeof rankingsQuery>;

export const searchQuery = z.object({
  q: z.string().trim().min(1, "q is required").max(100),
  limit: z.coerce.number().int().min(1).max(20).default(6),
});

export const slugParam = z.object({ slug });

export function parseQuery<S extends z.ZodTypeAny>(schema: S, params: RawParams): z.output<S> {
  return schema.parse(toRecord(params));
}

/** Like parseQuery but never throws: invalid params fall back to defaults. Used by pages, where a bad URL should still render. */
export function safeParseQuery<S extends z.ZodTypeAny>(schema: S, params: RawParams): z.output<S> {
  const r = schema.safeParse(toRecord(params));
  if (r.success) return r.data;
  // Drop the offending keys and retry, so one bad filter does not wipe the rest.
  const rec = toRecord(params);
  for (const issue of r.error.issues) delete rec[String(issue.path[0])];
  return schema.parse(rec);
}
