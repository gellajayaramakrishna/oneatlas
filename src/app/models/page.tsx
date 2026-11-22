import type { Metadata } from "next";
import { Suspense } from "react";
import { ExplorerShell } from "@/components/models/explorer-shell";
import { ModelList, Pagination } from "@/components/models/model-list";
import { EmptyState, PageHeader } from "@/components/ui";
import { getFacets, listModels } from "@/server/services/models";
import { modelListQuery, safeParseQuery } from "@/server/validation";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Models", description: "Browse, search and filter AI models by lab, provider, capability, price and context window." };

type SP = Record<string, string | string[] | undefined>;

export default async function ModelsPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const query = safeParseQuery(modelListQuery, sp);
  const [result, facets] = await Promise.all([listModels(query), getFacets()]);

  const makeHref = (page: number) => {
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries(sp)) if (v !== undefined && k !== "page") p.set(k, Array.isArray(v) ? v.join(",") : v);
    if (page > 1) p.set("page", String(page));
    const qs = p.toString();
    return qs ? `/models?${qs}` : "/models";
  };

  return (
    <div className="container-page py-8">
      <PageHeader title="Models" description="Every model in the catalog, with the cheapest available price across providers. Filters combine, and the URL is shareable." />
      <div className="mt-6">
        {/* useSearchParams in a client component needs a Suspense boundary */}
        <Suspense>
          <ExplorerShell facets={facets} total={result.meta.total}>
            {result.data.length ? (
              <>
                <ModelList models={result.data} />
                <Pagination page={result.meta.page} totalPages={result.meta.totalPages} makeHref={makeHref} />
              </>
            ) : (
              <EmptyState title="No models match these filters">Try removing a filter or broadening your search.</EmptyState>
            )}
          </ExplorerShell>
        </Suspense>
      </div>
    </div>
  );
}
