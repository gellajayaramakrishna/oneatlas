"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition, type ReactNode } from "react";
import {
  CAPABILITY_LABELS,
  MODEL_SORT_LABELS,
  MODEL_SORTS,
  MODEL_TYPE_LABELS,
  type Capability,
  type ModelTypeValue,
} from "@/lib/constants";
import { cn } from "@/lib/format";
import type { Facets } from "@/server/services/models";
import { useDebounced } from "../hooks";

/**
 * State management for the explorer: the URL is the single source of truth.
 * Filters write to the query string; the server component re-renders the
 * results. This gives shareable/bookmarkable searches, working back/forward,
 * and no client-side cache to keep in sync. useTransition keeps the old
 * results on screen (dimmed) while the new ones stream in.
 */
export function ExplorerShell({ facets, total, children }: { facets: Facets; total: number; children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const urlParams = useSearchParams();
  const [pending, startTransition] = useTransition();

  // Optimistic copy of the query string: controls update instantly and rapid
  // clicks compound correctly, instead of waiting for the server round-trip.
  const urlString = urlParams.toString();
  const [local, setLocal] = useState(urlString);
  useEffect(() => setLocal(urlString), [urlString]);
  const params = new URLSearchParams(local);
  const [mobileFilters, setMobileFilters] = useState(false);

  const [q, setQ] = useState(params.get("q") ?? "");
  const debouncedQ = useDebounced(q, 300);

  function commit(mutate: (p: URLSearchParams) => void) {
    const next = new URLSearchParams(params.toString());
    mutate(next);
    next.delete("page"); // any filter change returns to page 1
    const qs = next.toString();
    setLocal(qs);
    startTransition(() => router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false }));
  }

  // Keep the input in sync when the URL changes from elsewhere (back button, "Clear all").
  const urlQ = urlParams.get("q") ?? "";
  useEffect(() => {
    setQ((cur) => (cur.trim() === urlQ ? cur : urlQ));
  }, [urlQ]);

  useEffect(() => {
    if ((params.get("q") ?? "") === debouncedQ.trim()) return;
    commit((p) => (debouncedQ.trim() ? p.set("q", debouncedQ.trim()) : p.delete("q")));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQ]);

  const list = (key: string) => (params.get(key) ?? "").split(",").filter(Boolean);
  const toggleIn = (key: string, value: string) =>
    commit((p) => {
      const cur = new Set((p.get(key) ?? "").split(",").filter(Boolean));
      if (cur.has(value)) cur.delete(value);
      else cur.add(value);
      if (cur.size) p.set(key, [...cur].join(","));
      else p.delete(key);
    });
  const setOne = (key: string, value: string | null) => commit((p) => (value ? p.set(key, value) : p.delete(key)));

  const chips: { key: string; value: string; label: string }[] = [];
  for (const v of list("lab")) chips.push({ key: "lab", value: v, label: facets.labs.find((l) => l.slug === v)?.name ?? v });
  for (const v of list("provider")) chips.push({ key: "provider", value: v, label: facets.providers.find((l) => l.slug === v)?.name ?? v });
  for (const v of list("type")) chips.push({ key: "type", value: v, label: MODEL_TYPE_LABELS[v as ModelTypeValue] ?? v });
  for (const v of list("capability")) chips.push({ key: "capability", value: v, label: CAPABILITY_LABELS[v as Capability] ?? v });
  for (const v of list("modality")) chips.push({ key: "modality", value: v, label: `${v} input` });
  if (params.get("openWeights") === "true") chips.push({ key: "openWeights", value: "", label: "Open weights" });
  if (params.get("maxPrice")) chips.push({ key: "maxPrice", value: "", label: `≤ $${params.get("maxPrice")}/1M in` });
  if (params.get("minContext")) chips.push({ key: "minContext", value: "", label: `≥ ${Number(params.get("minContext")) / 1000}K ctx` });

  const sidebar = (
    <div className="space-y-6">
      <FilterGroup title="Model type">
        {facets.types.map((t) => (
          <Check key={t.value} label={MODEL_TYPE_LABELS[t.value as ModelTypeValue] ?? t.value} count={t.count} checked={list("type").includes(t.value)} onChange={() => toggleIn("type", t.value)} />
        ))}
      </FilterGroup>
      <FilterGroup title="Capabilities" hint="Match all">
        {facets.capabilities.map((c) => (
          <Check key={c.value} label={CAPABILITY_LABELS[c.value as Capability] ?? c.value} count={c.count} checked={list("capability").includes(c.value)} onChange={() => toggleIn("capability", c.value)} />
        ))}
      </FilterGroup>
      <FilterGroup title="Input modality">
        {facets.modalities.map((m) => (
          <Check key={m.value} label={m.value} count={m.count} checked={list("modality").includes(m.value)} onChange={() => toggleIn("modality", m.value)} className="capitalize" />
        ))}
      </FilterGroup>
      <FilterGroup title="Company / lab">
        {facets.labs.map((l) => (
          <Check key={l.slug} label={l.name} count={l.count} checked={list("lab").includes(l.slug)} onChange={() => toggleIn("lab", l.slug)} />
        ))}
      </FilterGroup>
      <FilterGroup title="Provider">
        {facets.providers.map((p) => (
          <Check key={p.slug} label={p.name} count={p.count} checked={list("provider").includes(p.slug)} onChange={() => toggleIn("provider", p.slug)} />
        ))}
      </FilterGroup>
      <FilterGroup title="Licensing">
        <Check label="Open weights only" checked={params.get("openWeights") === "true"} onChange={() => setOne("openWeights", params.get("openWeights") === "true" ? null : "true")} />
      </FilterGroup>
      <FilterGroup title="Max input price ($/1M)">
        <select className="input" value={params.get("maxPrice") ?? ""} onChange={(e) => setOne("maxPrice", e.target.value || null)}>
          <option value="">Any price</option>
          {["0.1", "0.5", "1", "3", "5"].map((v) => (
            <option key={v} value={v}>≤ ${v}</option>
          ))}
        </select>
      </FilterGroup>
      <FilterGroup title="Min context window">
        <select className="input" value={params.get("minContext") ?? ""} onChange={(e) => setOne("minContext", e.target.value || null)}>
          <option value="">Any size</option>
          {[32000, 128000, 200000, 400000, 1000000].map((v) => (
            <option key={v} value={v}>≥ {v >= 1e6 ? `${v / 1e6}M` : `${v / 1e3}K`}</option>
          ))}
        </select>
      </FilterGroup>
    </div>
  );

  return (
    <div className="grid gap-8 lg:grid-cols-[240px_1fr]">
      <aside className="hidden lg:block">
        <div className="sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto pb-6 pr-2">{sidebar}</div>
      </aside>

      <section className="min-w-0">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filter by name, lab or description…" className="input sm:max-w-sm" aria-label="Search models" />
          <div className="flex items-center gap-2 sm:ml-auto">
            <button type="button" className="btn-secondary lg:hidden" onClick={() => setMobileFilters(true)}>
              Filters{chips.length ? ` (${chips.length})` : ""}
            </button>
            <label className="text-xs text-slate-500" htmlFor="sort">Sort</label>
            <select id="sort" className="input w-auto" value={params.get("sort") ?? "release"} onChange={(e) => setOne("sort", e.target.value === "release" ? null : e.target.value)}>
              {MODEL_SORTS.map((s) => (
                <option key={s} value={s}>{MODEL_SORT_LABELS[s]}</option>
              ))}
            </select>
            <button
              type="button"
              className="btn-secondary px-2.5"
              title="Toggle sort direction"
              aria-label="Toggle sort direction"
              onClick={() => setOne("order", params.get("order") === "asc" ? "desc" : params.get("order") === "desc" ? "asc" : defaultFlip(params.get("sort")))}
            >
              {currentDir(params) === "asc" ? "↑" : "↓"}
            </button>
          </div>
        </div>

        <div className="mt-3 flex min-h-7 flex-wrap items-center gap-2 text-sm">
          <span className="text-slate-500">
            <span className="num font-medium text-ink">{total}</span> model{total === 1 ? "" : "s"}
          </span>
          {chips.map((c) => (
            <button
              key={`${c.key}-${c.value}`}
              type="button"
              onClick={() => (c.value ? toggleIn(c.key, c.value) : setOne(c.key, null))}
              className="inline-flex items-center gap-1 rounded-md bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700 hover:bg-indigo-100"
            >
              {c.label} <span aria-hidden>×</span>
            </button>
          ))}
          {chips.length > 0 && (
            <button type="button" className="text-xs text-slate-500 underline-offset-2 hover:underline" onClick={() => { setQ(""); setLocal(""); startTransition(() => router.replace(pathname, { scroll: false })); }}>
              Clear all
            </button>
          )}
        </div>

        <div className={cn("mt-4 transition-opacity", pending && "pointer-events-none opacity-50")} aria-busy={pending}>
          {children}
        </div>
      </section>

      {mobileFilters && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Filters">
          <div className="absolute inset-0 bg-slate-900/30" onClick={() => setMobileFilters(false)} />
          <div className="absolute inset-y-0 right-0 w-[85%] max-w-sm overflow-y-auto bg-white p-5 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <span className="font-semibold">Filters</span>
              <button type="button" className="btn-ghost" onClick={() => setMobileFilters(false)}>Done</button>
            </div>
            {sidebar}
          </div>
        </div>
      )}
    </div>
  );
}

const DEFAULT_DIR: Record<string, "asc" | "desc"> = { release: "desc", price: "asc", "output-price": "asc", context: "desc", name: "asc", score: "desc" };
function currentDir(p: URLSearchParams) {
  return (p.get("order") as "asc" | "desc" | null) ?? DEFAULT_DIR[p.get("sort") ?? "release"] ?? "desc";
}
function defaultFlip(sort: string | null) {
  return DEFAULT_DIR[sort ?? "release"] === "asc" ? "desc" : "asc";
}

function FilterGroup({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <fieldset>
      <legend className="label-caps mb-2 flex w-full justify-between">
        {title}
        {hint && <span className="font-normal normal-case tracking-normal text-slate-400">{hint}</span>}
      </legend>
      <div className="space-y-1">{children}</div>
    </fieldset>
  );
}

function Check({ label, count, checked, onChange, className }: { label: string; count?: number; checked: boolean; onChange: () => void; className?: string }) {
  return (
    <label className="flex cursor-pointer items-center gap-2 rounded px-1 py-0.5 text-sm text-slate-700 hover:bg-slate-50">
      <input type="checkbox" checked={checked} onChange={onChange} className="h-3.5 w-3.5 rounded border-slate-300 accent-indigo-600" />
      <span className={cn("flex-1 truncate", className)}>{label}</span>
      {count !== undefined && <span className="num text-xs text-slate-400">{count}</span>}
    </label>
  );
}
