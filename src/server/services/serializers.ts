import type { Prisma } from "@prisma/client";

/** Prisma Decimal -> JS number for JSON. Prices have 4 dp, well inside double precision. */
export function dec(v: Prisma.Decimal | null | undefined): number | null {
  return v == null ? null : Number(v.toString());
}

export const modelCardSelect = {
  slug: true,
  name: true,
  type: true,
  releaseDate: true,
  contextWindow: true,
  openWeights: true,
  inputModalities: true,
  capabilities: true,
  minInputPrice: true,
  minOutputPrice: true,
  providerCount: true,
  atlasScore: true,
  lab: { select: { slug: true, name: true, brandColor: true } },
} satisfies Prisma.ModelSelect;

type CardRow = Prisma.ModelGetPayload<{ select: typeof modelCardSelect }>;

/** The compact shape used in lists, search results, rankings and cards. */
export interface ModelCard {
  slug: string;
  name: string;
  type: string;
  releaseDate: string;
  contextWindow: number;
  openWeights: boolean;
  inputModalities: string[];
  capabilities: string[];
  minInputPrice: number | null;
  minOutputPrice: number | null;
  providerCount: number;
  atlasScore: number | null;
  lab: { slug: string; name: string; brandColor: string };
}

export function toModelCard(m: CardRow): ModelCard {
  return {
    slug: m.slug,
    name: m.name,
    type: m.type,
    releaseDate: m.releaseDate.toISOString(),
    contextWindow: m.contextWindow,
    openWeights: m.openWeights,
    inputModalities: m.inputModalities,
    capabilities: m.capabilities,
    minInputPrice: dec(m.minInputPrice),
    minOutputPrice: dec(m.minOutputPrice),
    providerCount: m.providerCount,
    atlasScore: m.atlasScore,
    lab: m.lab,
  };
}
