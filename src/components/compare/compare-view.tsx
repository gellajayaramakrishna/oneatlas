"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { CAPABILITIES, CAPABILITY_LABELS, MAX_COMPARE, MODALITIES, MODEL_TYPE_LABELS, type ModelTypeValue } from "@/lib/constants";
import { cn, formatDate, formatPrice, formatScore, formatTokens } from "@/lib/format";
import type { ModelDetail } from "@/server/services/models";
import { useCompare } from "../compare-context";
import { useDebounced } from "../hooks";
import { CostCalculator } from "../models/cost-calculator";
import { LabMark } from "../ui";

type Best = "min" | "max";

export function CompareView({ models }: { models: ModelDetail[] }) {
  const router = useRouter();
  const { items, replace, clear } = useCompare();
  const slugs = models.map((m) => m.slug);

  // The URL is the source of truth on this page; mirror it into the basket.
  useEffect(() => {
    if (models.length) replace(models.map((m) => ({ slug: m.slug, name: m.name })));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slugs.join(",")]);

  // Opened /compare with no models (e.g. from the navbar) but the basket has some: show those.
  useEffect(() => {
    if (!models.length && items.length) router.replace(`/compare?models=${items.map((i) => i.slug).join(",")}`, { scroll: false });
  }, [models.length, items, router]);

  const setSlugs = (next: string[]) => {
    if (!next.length) clear();
    router.push(next.length ? `/compare?models=${next.join(",")}` : "/compare", { scroll: false });
  };

  const benchmarks = Array.from(new Map(models.flatMap((m) => m.benchmarks.map((b) => [b.slug, b]))).values());
  const caps = CAPABILITIES.filter((c) => models.some((m) => m.capabilities.includes(c)));

  return (
    <div className="space-y-8">
      <ComparePicker selected={slugs} onAdd={(s) => setSlugs([...slugs, s])} />

      {models.length === 0 ? (
        <div className="card px-6 py-16 text-center">
          <div className="font-medium">Pick models to compare</div>
          <p className="mt-1 text-sm text-slate-500">Search above, or use the + button on any model in the explorer. Try a popular matchup:</p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {[
              ["gpt-5-1", "claude-sonnet-4-5", "gemini-3-pro"],
              ["llama-4-maverick", "deepseek-v3-1", "qwen3-235b-a22b"],
              ["gpt-5-mini", "claude-haiku-4-5", "gemini-2-5-flash"],
            ].map((set) => (
              <Link key={set.join()} href={`/compare?models=${set.join(",")}`} className="btn-secondary text-xs">
                {set.join(" vs ")}
              </Link>
            ))}
          </div>
        </div>
      ) : (
        <>
          <div className="card overflow-x-auto">
            <table className="table-base min-w-[640px] table-fixed">
              <colgroup>
                <col className="w-44" />
                {models.map((m) => <col key={m.slug} />)}
              </colgroup>
              <thead>
                <tr>
                  <th className="align-bottom">Model</th>
                  {models.map((m) => (
                    <th key={m.slug} className="align-top">
                      <div className="flex items-start justify-between gap-2">
                        <Link href={`/models/${m.slug}`} className="flex min-w-0 items-center gap-2 text-sm font-semibold text-ink hover:text-indigo-600">
                          <LabMark name={m.lab.name} color={m.lab.brandColor} size="sm" />
                          <span className="truncate">{m.name}</span>
                        </Link>
                        <button type="button" onClick={() => setSlugs(slugs.filter((s) => s !== m.slug))} className="text-slate-400 hover:text-ink" aria-label={`Remove ${m.name}`}>×</button>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <Group label="Overview" span={models.length} />
                <Row label="Lab" cells={models.map((m) => <Link key={m.slug} href={`/labs/${m.lab.slug}`} className="hover:text-indigo-600">{m.lab.name}</Link>)} />
                <Row label="Type" cells={models.map((m) => MODEL_TYPE_LABELS[m.type as ModelTypeValue])} />
                <Row label="Released" cells={models.map((m) => formatDate(m.releaseDate))} values={models.map((m) => new Date(m.releaseDate).getTime())} best="max" />
                <Row label="Parameters" cells={models.map((m) => m.parameterCount ?? "Undisclosed")} />
                <Row label="Open weights" cells={models.map((m) => (m.openWeights ? "Yes" : "No"))} />
                <Row label="License" cells={models.map((m) => m.license ?? "—")} />

                <Group label="Pricing (cheapest provider, $/1M tokens)" span={models.length} />
                <Row label="Input" mono cells={models.map((m) => formatPrice(m.minInputPrice))} values={models.map((m) => m.minInputPrice)} best="min" />
                <Row label="Output" mono cells={models.map((m) => formatPrice(m.minOutputPrice))} values={models.map((m) => m.minOutputPrice)} best="min" />
                <Row label="Providers" mono cells={models.map((m) => m.providerCount)} values={models.map((m) => m.providerCount)} best="max" />

                <Group label="Limits" span={models.length} />
                <Row label="Context window" mono cells={models.map((m) => formatTokens(m.contextWindow))} values={models.map((m) => m.contextWindow)} best="max" />
                <Row label="Max output" mono cells={models.map((m) => formatTokens(m.maxOutputTokens))} values={models.map((m) => m.maxOutputTokens)} best="max" />
                <Row label="Knowledge cutoff" cells={models.map((m) => m.knowledgeCutoff ?? "—")} />

                <Group label="Modalities" span={models.length} />
                <Row label="Input" cells={models.map((m) => <Pills key={m.slug} items={MODALITIES.filter((x) => m.inputModalities.includes(x))} />)} />
                <Row label="Output" cells={models.map((m) => <Pills key={m.slug} items={m.outputModalities} />)} />

                <Group label="Capabilities" span={models.length} />
                {caps.map((c) => (
                  <Row key={c} label={CAPABILITY_LABELS[c]} cells={models.map((m) => (m.capabilities.includes(c) ? <span key={m.slug} className="text-emerald-600">✓</span> : <span key={m.slug} className="text-slate-300">—</span>))} />
                ))}

                <Group label="Benchmarks" span={models.length} />
                <Row label="Atlas score" mono cells={models.map((m) => m.atlasScore?.toFixed(1) ?? "—")} values={models.map((m) => m.atlasScore)} best="max" />
                {benchmarks.map((b) => {
                  const vals = models.map((m) => m.benchmarks.find((x) => x.slug === b.slug)?.score ?? null);
                  return <Row key={b.slug} label={b.name} mono cells={vals.map((v) => formatScore(v, b.unit))} values={vals} best="max" />;
                })}
              </tbody>
            </table>
          </div>
          <p className="-mt-6 text-xs text-slate-500"><span className="rounded bg-emerald-50 px-1 text-emerald-700">Highlighted</span> = best value in the row.</p>

          <CostCalculator title="Monthly cost at the cheapest provider" rows={models.map((m) => ({ label: m.name, inputPrice: m.minInputPrice, outputPrice: m.minOutputPrice }))} />
        </>
      )}
    </div>
  );
}

function Group({ label, span }: { label: string; span: number }) {
  return (
    <tr className="hover:!bg-transparent">
      <td colSpan={span + 1} className="label-caps bg-slate-50/60 !py-2">{label}</td>
    </tr>
  );
}

function Row({ label, cells, values, best, mono }: { label: string; cells: ReactNode[]; values?: (number | null)[]; best?: Best; mono?: boolean }) {
  let bestIdx = new Set<number>();
  if (values && best) {
    const nums = values.filter((v): v is number => v != null);
    // Only highlight when there is an actual difference between models.
    if (nums.length > 1 && new Set(nums).size > 1) {
      const target = best === "min" ? Math.min(...nums) : Math.max(...nums);
      bestIdx = new Set(values.map((v, i) => (v === target ? i : -1)).filter((i) => i >= 0));
    }
  }
  return (
    <tr>
      <td className="text-slate-500">{label}</td>
      {cells.map((c, i) => (
        <td key={i} className={cn(mono && "num", bestIdx.has(i) && "bg-emerald-50 font-semibold text-emerald-800")}>{c}</td>
      ))}
    </tr>
  );
}

function Pills({ items }: { items: string[] }) {
  return (
    <div className="flex flex-wrap gap-1">
      {items.map((i) => <span key={i} className="rounded bg-slate-100 px-1.5 py-0.5 text-[11px] capitalize">{i}</span>)}
    </div>
  );
}

function ComparePicker({ selected, onAdd }: { selected: string[]; onAdd: (slug: string) => void }) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<{ slug: string; name: string; lab: string }[]>([]);
  const debounced = useDebounced(q.trim(), 200);
  const full = selected.length >= MAX_COMPARE;

  useEffect(() => {
    if (!debounced) return setResults([]);
    const ctrl = new AbortController();
    fetch(`/api/search?q=${encodeURIComponent(debounced)}&limit=8`, { signal: ctrl.signal })
      .then((r) => r.json())
      .then((b) => setResults(b.data?.models ?? []))
      .catch(() => {});
    return () => ctrl.abort();
  }, [debounced]);

  return (
    <div className="relative max-w-md">
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        disabled={full}
        placeholder={full ? `Maximum of ${MAX_COMPARE} models. Remove one to add another.` : "Add a model to compare…"}
        className="input"
        aria-label="Add a model to compare"
      />
      {results.length > 0 && (
        <ul className="absolute z-20 mt-1 w-full overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg">
          {results.map((r) => {
            const already = selected.includes(r.slug);
            return (
              <li key={r.slug}>
                <button
                  type="button"
                  disabled={already}
                  onClick={() => {
                    onAdd(r.slug);
                    setQ("");
                    setResults([]);
                  }}
                  className="flex w-full justify-between px-3 py-2 text-left text-sm hover:bg-slate-50 disabled:opacity-40"
                >
                  <span className="font-medium">{r.name}</span>
                  <span className="text-xs text-slate-500">{already ? "added" : r.lab}</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
