"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { BENCHMARK_CATEGORIES, BENCHMARK_CATEGORY_LABELS, MODEL_TYPE_LABELS } from "@/lib/constants";
import { cn } from "@/lib/format";

interface Props {
  benchmarks: { slug: string; name: string; category: string }[];
}

export function RankingsControls({ benchmarks }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const urlString = useSearchParams().toString();
  const [pending, startTransition] = useTransition();
  // Optimistic query string so tabs and toggles respond before the server does.
  const [local, setLocal] = useState(urlString);
  useEffect(() => setLocal(urlString), [urlString]);
  const params = new URLSearchParams(local);

  const nav = (mutate: (p: URLSearchParams) => void) => {
    const p = new URLSearchParams(local);
    mutate(p);
    const qs = p.toString();
    setLocal(qs);
    startTransition(() => router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false }));
  };

  const category = params.get("category");
  const benchmark = params.get("benchmark");
  const activeTab = benchmark ? benchmarks.find((b) => b.slug === benchmark)?.category ?? null : category;

  const tabs: { key: string | null; label: string }[] = [{ key: null, label: "Overall" }, ...BENCHMARK_CATEGORIES.map((c) => ({ key: c, label: BENCHMARK_CATEGORY_LABELS[c] }))];
  const visibleBenchmarks = activeTab ? benchmarks.filter((b) => b.category === activeTab) : benchmarks;

  return (
    <div className={cn("space-y-3 transition-opacity", pending && "opacity-60")}>
      <div className="flex gap-1 overflow-x-auto border-b border-slate-200" role="tablist">
        {tabs.map((t) => {
          const active = (activeTab ?? null) === t.key;
          return (
            <button
              key={t.label}
              role="tab"
              aria-selected={active}
              type="button"
              onClick={() => nav((p) => { p.delete("benchmark"); if (t.key) p.set("category", t.key); else p.delete("category"); })}
              className={cn("-mb-px whitespace-nowrap border-b-2 px-3 py-2 text-sm", active ? "border-ink font-medium text-ink" : "border-transparent text-slate-500 hover:text-ink")}
            >
              {t.label}
            </button>
          );
        })}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <select
          className="input w-auto"
          value={benchmark ?? ""}
          aria-label="Benchmark"
          onChange={(e) => nav((p) => { if (e.target.value) { p.set("benchmark", e.target.value); p.delete("category"); } else p.delete("benchmark"); })}
        >
          <option value="">{activeTab ? `All ${BENCHMARK_CATEGORY_LABELS[activeTab as keyof typeof BENCHMARK_CATEGORY_LABELS]} benchmarks` : "Atlas Index (all benchmarks)"}</option>
          {visibleBenchmarks.map((b) => (
            <option key={b.slug} value={b.slug}>{b.name}</option>
          ))}
        </select>
        <select className="input w-auto" value={params.get("type") ?? ""} aria-label="Model type" onChange={(e) => nav((p) => (e.target.value ? p.set("type", e.target.value) : p.delete("type")))}>
          <option value="">All model types</option>
          {(["CHAT", "REASONING", "CODE", "MULTIMODAL"] as const).map((t) => (
            <option key={t} value={t}>{MODEL_TYPE_LABELS[t]}</option>
          ))}
        </select>
        <label className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm">
          <input type="checkbox" className="accent-indigo-600" checked={params.get("openWeights") === "true"} onChange={(e) => nav((p) => (e.target.checked ? p.set("openWeights", "true") : p.delete("openWeights")))} />
          Open weights only
        </label>
      </div>
    </div>
  );
}
