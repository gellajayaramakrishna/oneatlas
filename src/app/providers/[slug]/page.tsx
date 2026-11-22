import type { Metadata } from "next";
import Link from "next/link";
import { CompareToggle } from "@/components/compare-controls";
import { Badge, LabMark, Stat, TypeBadge } from "@/components/ui";
import { formatPrice, formatTokens } from "@/lib/format";
import { orNotFound } from "@/lib/not-found";
import { getProvider } from "@/server/services/directory";

export const dynamic = "force-dynamic";
type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  try {
    const p = await getProvider(slug);
    return { title: p.name, description: p.description };
  } catch {
    return { title: "Provider not found" };
  }
}

export default async function ProviderPage({ params }: Props) {
  const { slug } = await params;
  const p = await orNotFound(getProvider(slug));
  const cheapestCount = p.offerings.filter((o) => o.cheapest).length;

  return (
    <div className="container-page py-8">
      <nav className="text-sm text-slate-500"><Link href="/providers" className="hover:text-ink">Providers</Link> <span className="px-1">/</span> <span className="text-ink">{p.name}</span></nav>
      <header className="mt-4 flex flex-col gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-center">
        <div className="flex-1">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{p.name}</h1>
          <p className="mt-1 max-w-3xl text-slate-600">{p.description}</p>
        </div>
        <a href={p.website} target="_blank" rel="noopener noreferrer" className="btn-secondary">Website ↗</a>
      </header>

      <section className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Models served" value={p.modelCount} hint={`from ${p.labCount} labs`} />
        <Stat label="Avg throughput" value={p.avgThroughputTps ? `${p.avgThroughputTps} t/s` : "—"} />
        <Stat label="Cheapest input" value={formatPrice(p.cheapestInputPrice)} hint="per 1M tokens" />
        <Stat label="Best price for" value={cheapestCount} hint="models (vs other providers)" />
      </section>

      <div className="card mt-8 overflow-x-auto">
        <table className="table-base">
          <thead>
            <tr>
              <th className="w-10"><span className="sr-only">Compare</span></th>
              <th>Model</th>
              <th>Type</th>
              <th className="text-right">Input $/1M</th>
              <th className="text-right">Output $/1M</th>
              <th className="text-right">Context</th>
              <th className="text-right">Throughput</th>
              <th className="text-right">Latency</th>
            </tr>
          </thead>
          <tbody>
            {p.offerings.map((o) => (
              <tr key={o.model.slug}>
                <td><CompareToggle slug={o.model.slug} name={o.model.name} /></td>
                <td>
                  <Link href={`/models/${o.model.slug}`} className="group flex items-center gap-2.5">
                    <LabMark name={o.model.lab.name} color={o.model.lab.brandColor} size="sm" />
                    <span>
                      <span className="font-medium group-hover:text-indigo-600">{o.model.name}</span>
                      <span className="block text-xs text-slate-500">{o.model.lab.name}</span>
                    </span>
                  </Link>
                </td>
                <td><TypeBadge type={o.model.type} /></td>
                <td className="num text-right">
                  {formatPrice(o.inputPrice)} {o.cheapest && <Badge tone="green" className="ml-1">Best</Badge>}
                </td>
                <td className="num text-right">{formatPrice(o.outputPrice)}</td>
                <td className="num text-right">{formatTokens(o.contextWindow)}</td>
                <td className="num text-right">{o.throughputTps ? `${Math.round(o.throughputTps)} t/s` : "—"}</td>
                <td className="num text-right">{o.latencyMs ? `${(o.latencyMs / 1000).toFixed(2)}s` : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
