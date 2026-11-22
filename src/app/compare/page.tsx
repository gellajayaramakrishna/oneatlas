import type { Metadata } from "next";
import { CompareView } from "@/components/compare/compare-view";
import { PageHeader } from "@/components/ui";
import { MAX_COMPARE } from "@/lib/constants";
import { prisma } from "@/server/db";
import { compareModels } from "@/server/services/models";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Compare models", description: "Compare AI models side by side on pricing, context, capabilities and benchmarks." };

export default async function ComparePage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const raw = (Array.isArray(sp.models) ? sp.models.join(",") : sp.models ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter((s) => /^[a-z0-9-]+$/.test(s));
  const requested = Array.from(new Set(raw)).slice(0, MAX_COMPARE);

  // A stale shared link should not 404 the whole page: drop unknown slugs and tell the user.
  const existing = requested.length
    ? (await prisma.model.findMany({ where: { slug: { in: requested } }, select: { slug: true } })).map((m) => m.slug)
    : [];
  const valid = requested.filter((s) => existing.includes(s));
  const dropped = requested.filter((s) => !existing.includes(s));
  const models = valid.length ? await compareModels(valid) : [];

  return (
    <div className="container-page py-8">
      <PageHeader title="Compare models" description={`Line up to ${MAX_COMPARE} models. The best value in each row is highlighted.`} />
      {dropped.length > 0 && (
        <p className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">Skipped unknown model(s): {dropped.join(", ")}</p>
      )}
      <div className="mt-6">
        <CompareView models={models} />
      </div>
    </div>
  );
}
