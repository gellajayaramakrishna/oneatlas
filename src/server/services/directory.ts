import "server-only";
import { cache } from "react";
import { prisma } from "../db";
import { ApiError } from "../http";
import { dec, modelCardSelect, toModelCard, type ModelCard } from "./serializers";

// ─────────────────────────────────────────── Labs

export interface LabSummary {
  slug: string;
  name: string;
  description: string;
  website: string;
  headquarters: string;
  foundedYear: number;
  brandColor: string;
  modelCount: number;
  openWeightsCount: number;
  latestRelease: { slug: string; name: string; releaseDate: string } | null;
}

export const listLabs = cache(async (): Promise<LabSummary[]> => {
  const labs = await prisma.lab.findMany({
    include: {
      models: { select: { slug: true, name: true, releaseDate: true, openWeights: true }, orderBy: { releaseDate: "desc" } },
    },
  });
  return labs
    .map((l) => ({
      slug: l.slug,
      name: l.name,
      description: l.description,
      website: l.website,
      headquarters: l.headquarters,
      foundedYear: l.foundedYear,
      brandColor: l.brandColor,
      modelCount: l.models.length,
      openWeightsCount: l.models.filter((m) => m.openWeights).length,
      latestRelease: l.models[0]
        ? { slug: l.models[0].slug, name: l.models[0].name, releaseDate: l.models[0].releaseDate.toISOString() }
        : null,
    }))
    .sort((a, b) => b.modelCount - a.modelCount || a.name.localeCompare(b.name));
});

export interface LabDetail extends Omit<LabSummary, "latestRelease"> {
  models: ModelCard[];
  providers: { slug: string; name: string; modelCount: number }[];
}

export const getLab = cache(async (slug: string): Promise<LabDetail> => {
  const lab = await prisma.lab.findUnique({
    where: { slug },
    include: {
      models: {
        select: { ...modelCardSelect, offerings: { select: { provider: { select: { slug: true, name: true } } } } },
        orderBy: { releaseDate: "desc" },
      },
    },
  });
  if (!lab) throw ApiError.notFound(`Lab "${slug}"`);

  // Which providers serve this lab's models, and how many of them.
  const providerMap = new Map<string, { slug: string; name: string; modelCount: number }>();
  for (const m of lab.models) {
    for (const o of m.offerings) {
      const e = providerMap.get(o.provider.slug) ?? { ...o.provider, modelCount: 0 };
      e.modelCount++;
      providerMap.set(o.provider.slug, e);
    }
  }
  return {
    slug: lab.slug,
    name: lab.name,
    description: lab.description,
    website: lab.website,
    headquarters: lab.headquarters,
    foundedYear: lab.foundedYear,
    brandColor: lab.brandColor,
    modelCount: lab.models.length,
    openWeightsCount: lab.models.filter((m) => m.openWeights).length,
    models: lab.models.map(toModelCard),
    providers: [...providerMap.values()].sort((a, b) => b.modelCount - a.modelCount),
  };
});

// ─────────────────────────────────────────── Providers

export interface ProviderSummary {
  slug: string;
  name: string;
  description: string;
  website: string;
  kind: string;
  modelCount: number;
  labCount: number;
  avgThroughputTps: number | null;
  cheapestInputPrice: number | null;
}

export const listProviders = cache(async (): Promise<ProviderSummary[]> => {
  const providers = await prisma.provider.findMany({
    include: {
      offerings: { select: { inputPrice: true, throughputTps: true, model: { select: { labId: true } } } },
    },
  });
  return providers
    .map((p) => {
      const tps = p.offerings.map((o) => o.throughputTps).filter((v): v is number => v != null);
      const prices = p.offerings.map((o) => dec(o.inputPrice)!).filter((v) => v > 0);
      return {
        slug: p.slug,
        name: p.name,
        description: p.description,
        website: p.website,
        kind: p.kind,
        modelCount: p.offerings.length,
        labCount: new Set(p.offerings.map((o) => o.model.labId)).size,
        avgThroughputTps: tps.length ? Math.round(tps.reduce((a, b) => a + b, 0) / tps.length) : null,
        cheapestInputPrice: prices.length ? Math.min(...prices) : null,
      };
    })
    .sort((a, b) => b.modelCount - a.modelCount || a.name.localeCompare(b.name));
});

export interface ProviderDetail extends ProviderSummary {
  offerings: Array<{
    model: ModelCard;
    inputPrice: number;
    outputPrice: number;
    cachedInputPrice: number | null;
    contextWindow: number;
    throughputTps: number | null;
    latencyMs: number | null;
    uptimePct: number | null;
    /** true when this provider is the cheapest place to run this model */
    cheapest: boolean;
  }>;
}

export const getProvider = cache(async (slug: string): Promise<ProviderDetail> => {
  const p = await prisma.provider.findUnique({
    where: { slug },
    include: { offerings: { include: { model: { select: modelCardSelect } } } },
  });
  if (!p) throw ApiError.notFound(`Provider "${slug}"`);
  const summary = (await listProviders()).find((x) => x.slug === slug)!;
  return {
    ...summary,
    offerings: p.offerings
      .map((o) => {
        const model = toModelCard(o.model);
        const inputPrice = dec(o.inputPrice)!;
        return {
          model,
          inputPrice,
          outputPrice: dec(o.outputPrice)!,
          cachedInputPrice: dec(o.cachedInputPrice),
          contextWindow: o.contextWindow,
          throughputTps: o.throughputTps,
          latencyMs: o.latencyMs,
          uptimePct: o.uptimePct,
          cheapest: model.providerCount > 1 && model.minInputPrice === inputPrice,
        };
      })
      .sort((a, b) => a.model.lab.name.localeCompare(b.model.lab.name) || a.model.name.localeCompare(b.model.name)),
  };
});
