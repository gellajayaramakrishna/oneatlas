import type { Metadata } from "next";
import Link from "next/link";
import { Badge, PageHeader } from "@/components/ui";
import { formatPrice } from "@/lib/format";
import { listProviders } from "@/server/services/directory";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Providers", description: "Inference providers and the models they serve, with pricing and performance." };

const KIND_LABEL: Record<string, string> = { "first-party": "First-party", hyperscaler: "Hyperscaler", "inference-cloud": "Inference cloud", aggregator: "Aggregator" };

export default async function ProvidersPage() {
  const providers = await listProviders();
  return (
    <div className="container-page py-8">
      <PageHeader title="Providers" description="Where you can actually call a model: first-party APIs, hyperscalers and specialised inference clouds." />
      <div className="card mt-6 overflow-x-auto">
        <table className="table-base">
          <thead>
            <tr>
              <th>Provider</th>
              <th>Kind</th>
              <th className="text-right">Models</th>
              <th className="text-right">Labs</th>
              <th className="text-right">Avg throughput</th>
              <th className="text-right">Cheapest input $/1M</th>
            </tr>
          </thead>
          <tbody>
            {providers.map((p) => (
              <tr key={p.slug}>
                <td>
                  <Link href={`/providers/${p.slug}`} className="font-medium hover:text-indigo-600">{p.name}</Link>
                  <div className="max-w-md truncate text-xs text-slate-500">{p.description}</div>
                </td>
                <td><Badge>{KIND_LABEL[p.kind] ?? p.kind}</Badge></td>
                <td className="num text-right">{p.modelCount}</td>
                <td className="num text-right">{p.labCount}</td>
                <td className="num text-right">{p.avgThroughputTps ? `${p.avgThroughputTps} t/s` : "—"}</td>
                <td className="num text-right">{formatPrice(p.cheapestInputPrice)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
