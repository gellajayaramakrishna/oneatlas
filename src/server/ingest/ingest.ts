import type { Prisma, PrismaClient } from "@prisma/client";
import { ZodError } from "zod";
import { ingestPayloadSchema, type IngestPayload, type ParsedIngestPayload } from "./schemas";
import {
  computeAtlasScores,
  normalizeTags,
  parseReleaseDate,
  parseTokenCount,
  stableHash01,
  toPerMillion,
  NormalizationError,
} from "./normalize";

type Tx = Prisma.TransactionClient;

export class IngestValidationError extends Error {
  constructor(public issues: { path: string; message: string }[]) {
    super(`Ingest payload failed validation (${issues.length} issue${issues.length === 1 ? "" : "s"})`);
    this.name = "IngestValidationError";
  }
}

export interface IngestSummary {
  labs: number;
  providers: number;
  models: number;
  offerings: number;
  benchmarks: number;
  scores: number;
  durationMs: number;
}

/**
 * The single write path for catalog data. Used by the seed script and by
 * POST /api/admin/ingest.
 *
 *   1. Validate shape with zod (collect every issue, do not stop at the first).
 *   2. Check cross references (model -> lab, offering -> provider, score -> model/benchmark),
 *      allowing references to rows that already exist in the database.
 *   3. Normalize units and upsert everything inside one transaction, so a bad
 *      feed never leaves the catalog half-updated.
 *   4. Recompute denormalized fields (min prices, provider count, atlas score).
 *
 * Upserts are keyed by slug, so ingestion is idempotent: running it twice is a no-op.
 */
export async function ingestCatalog(prisma: PrismaClient, input: IngestPayload): Promise<IngestSummary> {
  const started = Date.now();
  let data: ParsedIngestPayload;
  try {
    data = ingestPayloadSchema.parse(input);
  } catch (err) {
    if (err instanceof ZodError) {
      throw new IngestValidationError(err.issues.map((i) => ({ path: i.path.join("."), message: i.message })));
    }
    throw err;
  }

  await assertReferences(prisma, data);

  let offeringCount = 0;
  await prisma.$transaction(
    async (tx) => {
      const labIds = new Map<string, string>();
      for (const l of data.labs) {
        const row = await tx.lab.upsert({
          where: { slug: l.slug },
          create: {
            slug: l.slug, name: l.name, description: l.description, website: l.website,
            headquarters: l.headquarters, foundedYear: l.founded, brandColor: l.color ?? "#6366f1",
          },
          update: {
            name: l.name, description: l.description, website: l.website,
            headquarters: l.headquarters, foundedYear: l.founded, ...(l.color ? { brandColor: l.color } : {}),
          },
          select: { id: true },
        });
        labIds.set(l.slug, row.id);
      }

      const providerRows = new Map<string, { id: string; perf?: { tps: number; latencyMs: number; uptime: number } }>();
      for (const p of data.providers) {
        const row = await tx.provider.upsert({
          where: { slug: p.slug },
          create: { slug: p.slug, name: p.name, description: p.description, website: p.website, kind: p.kind },
          update: { name: p.name, description: p.description, website: p.website, kind: p.kind },
          select: { id: true },
        });
        providerRows.set(p.slug, { id: row.id, perf: p.perf });
      }

      const benchmarkIds = new Map<string, string>();
      for (const b of data.benchmarks) {
        const fields = { name: b.name, description: b.description, category: b.category, unit: b.unit, higherIsBetter: b.higherIsBetter };
        const row = await tx.benchmark.upsert({ where: { slug: b.slug }, create: { slug: b.slug, ...fields }, update: fields, select: { id: true } });
        benchmarkIds.set(b.slug, row.id);
      }

      const modelIds = new Map<string, string>();
      for (const [mi, m] of data.models.entries()) {
        const labId = labIds.get(m.lab) ?? (await lookupId(tx, "lab", m.lab));
        const contextWindow = parseTokenCount(m.context, `models.${mi}.context`);
        const fields = {
          name: m.name,
          description: m.description,
          type: m.type,
          labId,
          releaseDate: parseReleaseDate(m.released, `models.${mi}.released`),
          contextWindow,
          maxOutputTokens: m.maxOutput != null ? parseTokenCount(m.maxOutput, `models.${mi}.maxOutput`) : null,
          parameterCount: m.params ?? null,
          openWeights: m.open ?? false,
          license: m.license ?? (m.open ? "Open weights" : "Proprietary"),
          knowledgeCutoff: m.cutoff ?? null,
          inputModalities: normalizeTags(m.input),
          outputModalities: normalizeTags(m.output),
          capabilities: normalizeTags(m.caps),
        };
        const model = await tx.model.upsert({ where: { slug: m.slug }, create: { slug: m.slug, ...fields }, update: fields, select: { id: true } });
        modelIds.set(m.slug, model.id);

        // Replace offerings: the feed is the source of truth for where a model is served.
        const keepProviderIds: string[] = [];
        for (const [oi, o] of m.offerings.entries()) {
          const prov = providerRows.get(o.provider) ?? { id: await lookupId(tx, "provider", o.provider) };
          const path = `models.${mi}.offerings.${oi}`;
          const offeringContext = o.context != null ? parseTokenCount(o.context, `${path}.context`) : contextWindow;
          if (offeringContext > contextWindow) {
            throw new NormalizationError(`provider context ${offeringContext} exceeds model context ${contextWindow}`, `${path}.context`);
          }
          // Synthetic but stable perf: provider baseline +/- 25%.
          const spread = 0.75 + stableHash01(`${m.slug}:${o.provider}`) * 0.5;
          const perf = prov.perf;
          const offering = {
            inputPrice: toPerMillion(o.in, o.unit),
            outputPrice: toPerMillion(o.out, o.unit),
            cachedInputPrice: o.cached != null ? toPerMillion(o.cached, o.unit) : null,
            contextWindow: offeringContext,
            throughputTps: o.tps ?? (perf ? Math.round(perf.tps * spread) : null),
            latencyMs: o.latencyMs ?? (perf ? Math.round(perf.latencyMs / spread) : null),
            uptimePct: perf ? Math.round((perf.uptime - Math.abs(spread - 1) * 1.2) * 100) / 100 : null,
          };
          await tx.modelOffering.upsert({
            where: { modelId_providerId: { modelId: model.id, providerId: prov.id } },
            create: { modelId: model.id, providerId: prov.id, ...offering },
            update: offering,
          });
          keepProviderIds.push(prov.id);
          offeringCount++;
        }
        await tx.modelOffering.deleteMany({ where: { modelId: model.id, providerId: { notIn: keepProviderIds } } });
      }

      for (const s of data.scores) {
        const modelId = modelIds.get(s.model) ?? (await lookupId(tx, "model", s.model));
        const benchmarkId = benchmarkIds.get(s.benchmark) ?? (await lookupId(tx, "benchmark", s.benchmark));
        await tx.benchmarkScore.upsert({
          where: { modelId_benchmarkId: { modelId, benchmarkId } },
          create: { modelId, benchmarkId, score: s.score, source: s.source ?? null },
          update: { score: s.score, source: s.source ?? null },
        });
      }

      await refreshAggregates(tx);
    },
    { timeout: 120_000, maxWait: 10_000 },
  );

  return {
    labs: data.labs.length,
    providers: data.providers.length,
    models: data.models.length,
    offerings: offeringCount,
    benchmarks: data.benchmarks.length,
    scores: data.scores.length,
    durationMs: Date.now() - started,
  };
}

/** Recompute denormalized read fields on Model. Cheap: two set-based statements + one pass over scores. */
export async function refreshAggregates(tx: Tx) {
  await tx.$executeRaw`
    UPDATE "Model" m SET
      "minInputPrice"  = s.min_in,
      "minOutputPrice" = s.min_out,
      "providerCount"  = s.cnt
    FROM (
      SELECT "modelId", MIN("inputPrice") AS min_in, MIN("outputPrice") AS min_out, COUNT(*)::int AS cnt
      FROM "ModelOffering" GROUP BY "modelId"
    ) s
    WHERE m.id = s."modelId"`;
  await tx.$executeRaw`
    UPDATE "Model" SET "minInputPrice" = NULL, "minOutputPrice" = NULL, "providerCount" = 0
    WHERE id NOT IN (SELECT DISTINCT "modelId" FROM "ModelOffering")`;

  const [scores, benchmarks] = await Promise.all([
    tx.benchmarkScore.findMany({ select: { modelId: true, benchmarkId: true, score: true } }),
    tx.benchmark.findMany({ select: { id: true, higherIsBetter: true } }),
  ]);
  const atlas = computeAtlasScores(scores, benchmarks);
  await tx.model.updateMany({ where: { id: { notIn: [...atlas.keys()] } }, data: { atlasScore: null } });
  for (const [id, score] of atlas) {
    await tx.model.update({ where: { id }, data: { atlasScore: score } });
  }
}

async function lookupId(tx: Tx, kind: "lab" | "provider" | "model" | "benchmark", slug: string): Promise<string> {
  const where = { where: { slug }, select: { id: true } } as const;
  const row =
    kind === "lab" ? await tx.lab.findUnique(where)
    : kind === "provider" ? await tx.provider.findUnique(where)
    : kind === "model" ? await tx.model.findUnique(where)
    : await tx.benchmark.findUnique(where);
  if (!row) throw new IngestValidationError([{ path: kind, message: `unknown ${kind} "${slug}"` }]);
  return row.id;
}

/** Fail fast, before opening a transaction, listing every dangling reference at once. */
async function assertReferences(prisma: PrismaClient, data: ParsedIngestPayload) {
  const [labs, providers, models, benchmarks] = await Promise.all([
    prisma.lab.findMany({ select: { slug: true } }),
    prisma.provider.findMany({ select: { slug: true } }),
    prisma.model.findMany({ select: { slug: true } }),
    prisma.benchmark.findMany({ select: { slug: true } }),
  ]);
  const known = {
    lab: new Set([...labs.map((x) => x.slug), ...data.labs.map((x) => x.slug)]),
    provider: new Set([...providers.map((x) => x.slug), ...data.providers.map((x) => x.slug)]),
    model: new Set([...models.map((x) => x.slug), ...data.models.map((x) => x.slug)]),
    benchmark: new Set([...benchmarks.map((x) => x.slug), ...data.benchmarks.map((x) => x.slug)]),
  };
  const issues: { path: string; message: string }[] = [];
  data.models.forEach((m, i) => {
    if (!known.lab.has(m.lab)) issues.push({ path: `models.${i}.lab`, message: `unknown lab "${m.lab}"` });
    m.offerings.forEach((o, j) => {
      if (!known.provider.has(o.provider)) issues.push({ path: `models.${i}.offerings.${j}.provider`, message: `unknown provider "${o.provider}"` });
    });
  });
  data.scores.forEach((s, i) => {
    if (!known.model.has(s.model)) issues.push({ path: `scores.${i}.model`, message: `unknown model "${s.model}"` });
    if (!known.benchmark.has(s.benchmark)) issues.push({ path: `scores.${i}.benchmark`, message: `unknown benchmark "${s.benchmark}"` });
  });
  const benchUnits = new Map(data.benchmarks.map((b) => [b.slug, b.unit]));
  data.scores.forEach((s, i) => {
    if (benchUnits.get(s.benchmark) === "%" && (s.score < 0 || s.score > 100)) {
      issues.push({ path: `scores.${i}.score`, message: `percentage score ${s.score} out of range 0-100` });
    }
  });
  if (issues.length) throw new IngestValidationError(issues);
}
