import Link from "next/link";
import { SearchTrigger } from "@/components/command-palette";
import { CompareToggle } from "@/components/compare-controls";
import { LabMark, SectionTitle, TypeBadge } from "@/components/ui";
import { formatDate, formatPrice, formatTokens } from "@/lib/format";
import { listLabs } from "@/server/services/directory";
import { getCatalogStats, listModels } from "@/server/services/models";
import { getRankings } from "@/server/services/rankings";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [stats, top, latest, cheapest, longContext, labs] = await Promise.all([
    getCatalogStats(),
    getRankings({ limit: 5 }),
    listModels({ sort: "release", page: 1, pageSize: 6 }),
    listModels({ sort: "price", order: "asc", page: 1, pageSize: 5, minContext: 100_000, type: ["CHAT", "REASONING", "MULTIMODAL"] }),
    listModels({ sort: "context", page: 1, pageSize: 5 }),
    listLabs(),
  ]);

  return (
    <>
      <section className="border-b border-slate-200 bg-gradient-to-b from-slate-50 to-white">
        <div className="container-page py-16 sm:py-20">
          <div className="max-w-3xl">
            <p className="label-caps text-indigo-600">AI model intelligence</p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">Find the right model. Know what it costs.</h1>
            <p className="mt-4 text-lg text-slate-600">
              Search, compare and rank {stats.models} models from {stats.labs} labs across {stats.providers} providers. Pricing, context windows, capabilities and benchmarks in one place.
            </p>
            <div className="mt-8 max-w-xl">
              <SearchTrigger large />
            </div>
            <div className="mt-4 flex flex-wrap gap-2 text-sm">
              {[
                ["Open-weight models", "/models?openWeights=true"],
                ["Vision + tool calling", "/models?capability=vision,tool-calling"],
                ["Under $0.50 / 1M", "/models?maxPrice=0.5&sort=price"],
                ["1M+ context", "/models?minContext=1000000"],
                ["Coding leaderboard", "/rankings?category=CODING"],
              ].map(([label, href]) => (
                <Link key={href} href={href} className="rounded-full border border-slate-200 bg-white px-3 py-1 text-slate-600 hover:border-slate-300 hover:text-ink">{label}</Link>
              ))}
            </div>
          </div>
          <dl className="mt-12 grid max-w-3xl grid-cols-2 gap-6 sm:grid-cols-4">
            {[
              ["Models", stats.models],
              ["Labs", stats.labs],
              ["Providers", stats.providers],
              ["Price points", stats.offerings],
            ].map(([k, v]) => (
              <div key={k as string}>
                <dt className="label-caps">{k}</dt>
                <dd className="num mt-1 text-2xl font-semibold">{v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <div className="container-page space-y-12 py-12">
        <div className="grid gap-8 lg:grid-cols-2">
          <section>
            <SectionTitle title="Top models · Atlas Index" href="/rankings" />
            <ol className="card divide-y divide-slate-100">
              {top.rows.map((r) => (
                <li key={r.model.slug} className="flex items-center gap-3 p-3">
                  <span className="num w-5 text-center text-sm font-semibold text-slate-400">{r.rank}</span>
                  <LabMark name={r.model.lab.name} color={r.model.lab.brandColor} size="sm" />
                  <Link href={`/models/${r.model.slug}`} className="min-w-0 flex-1 truncate font-medium hover:text-indigo-600">{r.model.name}</Link>
                  <span className="num text-sm font-semibold">{r.score.toFixed(1)}</span>
                  <CompareToggle slug={r.model.slug} name={r.model.name} />
                </li>
              ))}
            </ol>
          </section>
          <section>
            <SectionTitle title="Best value · 100K+ context" href="/models?sort=price&minContext=100000" />
            <ol className="card divide-y divide-slate-100">
              {cheapest.data.map((m) => (
                <li key={m.slug} className="flex items-center gap-3 p-3">
                  <LabMark name={m.lab.name} color={m.lab.brandColor} size="sm" />
                  <Link href={`/models/${m.slug}`} className="min-w-0 flex-1 truncate font-medium hover:text-indigo-600">{m.name}</Link>
                  <span className="num text-sm text-slate-500">{formatPrice(m.minInputPrice)} / {formatPrice(m.minOutputPrice)}</span>
                  <CompareToggle slug={m.slug} name={m.name} />
                </li>
              ))}
            </ol>
          </section>
        </div>

        <section>
          <SectionTitle title="Recently released" href="/models" />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {latest.data.map((m) => (
              <Link key={m.slug} href={`/models/${m.slug}`} className="card card-hover p-4">
                <div className="flex items-center gap-2.5">
                  <LabMark name={m.lab.name} color={m.lab.brandColor} />
                  <div className="min-w-0">
                    <div className="truncate font-medium">{m.name}</div>
                    <div className="text-xs text-slate-500">{m.lab.name} · {formatDate(m.releaseDate)}</div>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                  <TypeBadge type={m.type} />
                  <span className="num">{formatTokens(m.contextWindow)} ctx · from {formatPrice(m.minInputPrice)}</span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section>
          <SectionTitle title="Longest context windows" href="/models?sort=context" />
          <div className="card overflow-x-auto">
            <table className="table-base">
              <tbody>
                {longContext.data.map((m) => (
                  <tr key={m.slug}>
                    <td><Link href={`/models/${m.slug}`} className="font-medium hover:text-indigo-600">{m.name}</Link> <span className="text-xs text-slate-500">· {m.lab.name}</span></td>
                    <td className="num text-right font-semibold">{formatTokens(m.contextWindow)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <SectionTitle title="Labs" href="/labs" />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {labs.map((l) => (
              <Link key={l.slug} href={`/labs/${l.slug}`} className="card card-hover flex items-center gap-2.5 p-3">
                <LabMark name={l.name} color={l.brandColor} size="sm" />
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium">{l.name}</span>
                  <span className="text-xs text-slate-500">{l.modelCount} models</span>
                </span>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
