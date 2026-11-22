import type { Metadata } from "next";
import Link from "next/link";
import { CompareToggle } from "@/components/compare-controls";
import { CostCalculator } from "@/components/models/cost-calculator";
import { Badge, CapabilityBadge, LabMark, ScoreBar, SectionTitle, Stat, TypeBadge } from "@/components/ui";
import { BENCHMARK_CATEGORY_LABELS, MODALITIES, type BenchmarkCategoryValue } from "@/lib/constants";
import { cn, formatDate, formatPrice, formatScore, formatTokens } from "@/lib/format";
import { orNotFound } from "@/lib/not-found";
import { getModel, getSimilarModels } from "@/server/services/models";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  try {
    const m = await getModel(slug);
    return { title: `${m.name} by ${m.lab.name}`, description: m.description };
  } catch {
    return { title: "Model not found" };
  }
}

export default async function ModelPage({ params }: Props) {
  const { slug } = await params;
  const m = await orNotFound(getModel(slug));
  const similar = await getSimilarModels(m);
  const cheapest = m.offerings[0];
  const fastest = [...m.offerings].sort((a, b) => (b.throughputTps ?? 0) - (a.throughputTps ?? 0))[0];

  return (
    <div className="container-page py-8">
      <nav className="text-sm text-slate-500" aria-label="Breadcrumb">
        <Link href="/models" className="hover:text-ink">Models</Link> <span className="px-1">/</span>
        <Link href={`/labs/${m.lab.slug}`} className="hover:text-ink">{m.lab.name}</Link> <span className="px-1">/</span>
        <span className="text-ink">{m.name}</span>
      </nav>

      <header className="mt-4 flex flex-col gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-start">
        <LabMark name={m.lab.name} color={m.lab.brandColor} size="lg" />
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{m.name}</h1>
            <TypeBadge type={m.type} />
            {m.openWeights && <Badge tone="green">Open weights</Badge>}
          </div>
          <p className="mt-1 text-sm text-slate-500">
            by <Link href={`/labs/${m.lab.slug}`} className="text-indigo-600 hover:underline">{m.lab.name}</Link> · released {formatDate(m.releaseDate)} · <code className="text-xs">{m.slug}</code>
          </p>
          <p className="mt-3 max-w-3xl text-slate-700">{m.description}</p>
        </div>
        <div className="flex gap-2">
          <CompareToggle slug={m.slug} name={m.name} variant="button" />
        </div>
      </header>

      <section className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        <Stat label="Context" value={formatTokens(m.contextWindow)} hint="tokens" />
        <Stat label="Max output" value={formatTokens(m.maxOutputTokens)} hint="tokens" />
        <Stat label="Input" value={formatPrice(m.minInputPrice)} hint="from, per 1M" />
        <Stat label="Output" value={formatPrice(m.minOutputPrice)} hint="from, per 1M" />
        <Stat label="Providers" value={m.providerCount} hint={fastest?.throughputTps ? `up to ${Math.round(fastest.throughputTps)} tok/s` : undefined} />
        <Stat label="Atlas score" value={m.atlasScore?.toFixed(1) ?? "—"} hint="normalized 0–100" />
      </section>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_320px]">
        <div className="min-w-0 space-y-8">
          <section>
            <SectionTitle title={`Providers & pricing (${m.offerings.length})`} />
            {m.offerings.length === 0 ? (
              <p className="card p-4 text-sm text-slate-500">No API providers listed for this model yet.</p>
            ) : (
              <div className="card overflow-x-auto">
                <table className="table-base">
                  <thead>
                    <tr>
                      <th>Provider</th>
                      <th className="text-right">Input $/1M</th>
                      <th className="text-right">Output $/1M</th>
                      <th className="text-right">Cached in</th>
                      <th className="text-right">Context</th>
                      <th className="text-right">Throughput</th>
                      <th className="text-right">Latency</th>
                      <th className="text-right">Uptime</th>
                    </tr>
                  </thead>
                  <tbody>
                    {m.offerings.map((o) => (
                      <tr key={o.provider.slug}>
                        <td>
                          <Link href={`/providers/${o.provider.slug}`} className="font-medium hover:text-indigo-600">{o.provider.name}</Link>
                          <div className="flex gap-1 pt-0.5">
                            {o === cheapest && m.offerings.length > 1 && <Badge tone="green">Cheapest</Badge>}
                            {o === fastest && m.offerings.length > 1 && <Badge tone="indigo">Fastest</Badge>}
                          </div>
                        </td>
                        <td className="num text-right">{formatPrice(o.inputPrice)}</td>
                        <td className="num text-right">{formatPrice(o.outputPrice)}</td>
                        <td className="num text-right text-slate-500">{formatPrice(o.cachedInputPrice)}</td>
                        <td className={cn("num text-right", o.contextWindow < m.contextWindow && "text-amber-700")} title={o.contextWindow < m.contextWindow ? "Provider caps context below the model's native window" : undefined}>
                          {formatTokens(o.contextWindow)}
                        </td>
                        <td className="num text-right">{o.throughputTps ? `${Math.round(o.throughputTps)} t/s` : "—"}</td>
                        <td className="num text-right">{o.latencyMs ? `${(o.latencyMs / 1000).toFixed(2)}s` : "—"}</td>
                        <td className="num text-right">{o.uptimePct ? `${o.uptimePct.toFixed(1)}%` : "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <p className="mt-2 text-xs text-slate-500">Prices normalized to USD per 1M tokens. Context in amber means the provider serves less than the native window.</p>
          </section>

          {m.offerings.length > 0 && m.type !== "EMBEDDING" && (
            <CostCalculator title="What would it cost?" rows={m.offerings.map((o) => ({ label: o.provider.name, inputPrice: o.inputPrice, outputPrice: o.outputPrice }))} />
          )}

          <section>
            <SectionTitle title="Benchmarks" href="/rankings" linkLabel="Leaderboards" />
            {m.benchmarks.length === 0 ? (
              <p className="card p-4 text-sm text-slate-500">No benchmark results for this model type.</p>
            ) : (
              <div className="card divide-y divide-slate-100">
                {m.benchmarks.map((b) => (
                  <Link key={b.slug} href={`/rankings?benchmark=${b.slug}`} className="flex flex-col gap-2 p-4 hover:bg-slate-50 sm:flex-row sm:items-center sm:gap-4">
                    <div className="sm:w-56">
                      <div className="font-medium">{b.name}</div>
                      <div className="text-xs text-slate-500">{BENCHMARK_CATEGORY_LABELS[b.category as BenchmarkCategoryValue]}</div>
                    </div>
                    <ScoreBar value={b.unit === "elo" ? b.score - 1000 : b.score} max={b.unit === "elo" ? 500 : 100} className="flex-1" />
                    <div className="flex items-center gap-3 sm:w-40 sm:justify-end">
                      <span className="num font-semibold">{formatScore(b.score, b.unit)}</span>
                      <Badge tone={b.rank <= 3 ? "indigo" : "slate"}>#{b.rank} of {b.totalRanked}</Badge>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </div>

        <aside className="space-y-6">
          <div className="card p-5">
            <h3 className="font-semibold">Specifications</h3>
            <dl className="mt-3 space-y-2 text-sm">
              <Spec k="Lab" v={<Link href={`/labs/${m.lab.slug}`} className="text-indigo-600 hover:underline">{m.lab.name}</Link>} />
              <Spec k="Released" v={formatDate(m.releaseDate)} />
              <Spec k="Parameters" v={m.parameterCount ?? "Undisclosed"} />
              <Spec k="License" v={m.license ?? "—"} />
              <Spec k="Knowledge cutoff" v={m.knowledgeCutoff ?? "—"} />
              <Spec k="Context window" v={`${m.contextWindow.toLocaleString()} tokens`} />
              <Spec k="Max output" v={m.maxOutputTokens ? `${m.maxOutputTokens.toLocaleString()} tokens` : "—"} />
            </dl>
          </div>
          <div className="card p-5">
            <h3 className="font-semibold">Modalities</h3>
            <div className="mt-3 space-y-3 text-sm">
              <ModalityRow label="Input" active={m.inputModalities} />
              <ModalityRow label="Output" active={m.outputModalities} extra={m.outputModalities.includes("embedding") ? ["embedding"] : []} />
            </div>
          </div>
          <div className="card p-5">
            <h3 className="font-semibold">Capabilities</h3>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {m.capabilities.length ? m.capabilities.map((c) => <CapabilityBadge key={c} cap={c} />) : <span className="text-sm text-slate-500">None listed</span>}
            </div>
          </div>
          {similar.length > 0 && (
            <div className="card p-5">
              <h3 className="font-semibold">Similar models</h3>
              <ul className="mt-3 space-y-2">
                {similar.map((s) => (
                  <li key={s.slug} className="flex items-center justify-between gap-2 text-sm">
                    <Link href={`/models/${s.slug}`} className="flex min-w-0 items-center gap-2 hover:text-indigo-600">
                      <LabMark name={s.lab.name} color={s.lab.brandColor} size="sm" />
                      <span className="truncate">{s.name}</span>
                    </Link>
                    <Link href={`/compare?models=${m.slug},${s.slug}`} className="shrink-0 text-xs text-indigo-600 hover:underline">vs →</Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

function Spec({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-slate-500">{k}</dt>
      <dd className="text-right font-medium">{v}</dd>
    </div>
  );
}

function ModalityRow({ label, active, extra = [] }: { label: string; active: string[]; extra?: string[] }) {
  return (
    <div>
      <div className="label-caps mb-1.5">{label}</div>
      <div className="flex flex-wrap gap-1.5">
        {[...MODALITIES, ...extra].map((mod) => (
          <span key={mod} className={cn("rounded-md border px-2 py-0.5 text-xs capitalize", active.includes(mod) ? "border-indigo-200 bg-indigo-50 text-indigo-700" : "border-slate-200 text-slate-300 line-through")}>
            {mod}
          </span>
        ))}
      </div>
    </div>
  );
}
