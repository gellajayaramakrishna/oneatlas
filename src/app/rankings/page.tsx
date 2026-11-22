import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { CompareToggle } from "@/components/compare-controls";
import { RankingsControls } from "@/components/rankings-controls";
import { EmptyState, LabMark, PageHeader, ScoreBar, TypeBadge } from "@/components/ui";
import { BENCHMARK_CATEGORY_LABELS, type BenchmarkCategoryValue } from "@/lib/constants";
import { cn, formatPrice, formatScore } from "@/lib/format";
import { orNotFound } from "@/lib/not-found";
import { getRankings, listBenchmarks } from "@/server/services/rankings";
import { rankingsQuery, safeParseQuery } from "@/server/validation";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Rankings & benchmarks", description: "Leaderboards for AI models across knowledge, reasoning, coding, math, multimodal and human preference benchmarks." };

export default async function RankingsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const q = safeParseQuery(rankingsQuery, await searchParams);
  if (q.benchmark && q.category) q.category = undefined;
  const [rankings, benchmarks] = await Promise.all([orNotFound(getRankings(q)), listBenchmarks()]);

  const scoreMax = rankings.mode === "overall" ? 100 : rankings.unit === "elo" ? 500 : 100;
  const scoreOffset = rankings.unit === "elo" ? 1000 : 0;
  const title =
    rankings.mode === "overall" ? "Atlas Index"
    : rankings.mode === "category" ? `${BENCHMARK_CATEGORY_LABELS[rankings.title as BenchmarkCategoryValue]} leaderboard`
    : rankings.title;
  const describe =
    rankings.mode === "overall"
      ? "Mean of min–max normalized scores across all benchmarks (0–100). Models need at least 3 results to be ranked."
      : rankings.mode === "category"
        ? "Mean of raw scores across the benchmarks in this category."
        : rankings.columns[0]?.description;

  return (
    <div className="container-page py-8">
      <PageHeader title="Rankings" description="Leaderboards across benchmark categories. Pick a category or a single benchmark, and narrow by model type or licensing." />
      <div className="mt-6">
        <Suspense>
          <RankingsControls benchmarks={benchmarks.map((b) => ({ slug: b.slug, name: b.name, category: b.category }))} />
        </Suspense>
      </div>

      <div className="mt-6 flex flex-col gap-1">
        <h2 className="text-lg font-semibold">{title}</h2>
        {describe && <p className="text-sm text-slate-500">{describe}</p>}
      </div>

      {rankings.rows.length === 0 ? (
        <div className="mt-4"><EmptyState title="No ranked models for these filters" /></div>
      ) : (
        <div className="card mt-4 overflow-x-auto">
          <table className="table-base">
            <thead>
              <tr>
                <th className="w-12 text-center">#</th>
                <th>Model</th>
                <th className="w-56">{rankings.mode === "overall" ? "Atlas score" : rankings.mode === "category" ? "Category mean" : "Score"}</th>
                {rankings.mode !== "benchmark" &&
                  rankings.columns.map((c) => (
                    <th key={c.slug} className="text-right">
                      <Link href={`/rankings?benchmark=${c.slug}`} className="hover:text-ink" title={c.description}>{c.name}</Link>
                    </th>
                  ))}
                <th className="text-right">Input $/1M</th>
                <th className="w-10"><span className="sr-only">Compare</span></th>
              </tr>
            </thead>
            <tbody>
              {rankings.rows.map((r) => (
                <tr key={r.model.slug}>
                  <td className="text-center">
                    <span className={cn("num inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold", r.rank === 1 ? "bg-amber-100 text-amber-800" : r.rank === 2 ? "bg-slate-200 text-slate-700" : r.rank === 3 ? "bg-orange-100 text-orange-800" : "text-slate-500")}>
                      {r.rank}
                    </span>
                  </td>
                  <td>
                    <Link href={`/models/${r.model.slug}`} className="group flex items-center gap-2.5">
                      <LabMark name={r.model.lab.name} color={r.model.lab.brandColor} size="sm" />
                      <span className="min-w-0">
                        <span className="block truncate font-medium group-hover:text-indigo-600">{r.model.name}</span>
                        <span className="flex items-center gap-1.5 text-xs text-slate-500">{r.model.lab.name} <TypeBadge type={r.model.type} /></span>
                      </span>
                    </Link>
                  </td>
                  <td>
                    <div className="flex items-center gap-3">
                      <ScoreBar value={r.score - scoreOffset} max={scoreMax} className="flex-1" />
                      <span className="num w-14 text-right font-semibold">{rankings.mode === "overall" ? r.score.toFixed(1) : formatScore(r.score, rankings.unit)}</span>
                    </div>
                  </td>
                  {rankings.mode !== "benchmark" &&
                    rankings.columns.map((c) => (
                      <td key={c.slug} className="num text-right text-slate-600">{r.scores[c.slug] !== undefined ? formatScore(r.scores[c.slug], c.unit) : <span className="text-slate-300">—</span>}</td>
                    ))}
                  <td className="num text-right">{formatPrice(r.model.minInputPrice)}</td>
                  <td><CompareToggle slug={r.model.slug} name={r.model.name} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <section className="mt-10">
        <h2 className="mb-3 text-lg font-semibold">Benchmarks in the index</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {benchmarks.map((b) => (
            <Link key={b.slug} href={`/rankings?benchmark=${b.slug}`} className="card card-hover p-4">
              <div className="flex items-center justify-between">
                <span className="font-medium">{b.name}</span>
                <span className="label-caps">{BENCHMARK_CATEGORY_LABELS[b.category as BenchmarkCategoryValue]}</span>
              </div>
              <p className="mt-1 text-sm text-slate-600">{b.description}</p>
              <p className="mt-2 text-xs text-slate-500">{b.modelCount} models scored · {b.unit === "elo" ? "Elo rating" : "accuracy %"}</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
