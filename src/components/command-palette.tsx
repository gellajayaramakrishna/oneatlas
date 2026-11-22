"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MODEL_TYPE_LABELS, type ModelTypeValue } from "@/lib/constants";
import { cn } from "@/lib/format";
import { useDebounced } from "./hooks";

interface Results {
  models: { slug: string; name: string; lab: string; type: string }[];
  labs: { slug: string; name: string; modelCount: number }[];
  providers: { slug: string; name: string; kind: string }[];
}
interface Item {
  key: string;
  href: string;
  title: string;
  subtitle: string;
  group: string;
}

/**
 * Global search (⌘K / Ctrl+K / "/").
 * Debounced, and every keystroke aborts the previous in-flight request so
 * slow responses can never overwrite newer results.
 */
export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Results | null>(null);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounced = useDebounced(query.trim(), 180);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement;
      const typing = target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable;
      if ((e.key === "k" && (e.metaKey || e.ctrlKey)) || (e.key === "/" && !typing)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    }
    function onOpen() {
      setOpen(true);
    }
    window.addEventListener("keydown", onKey);
    window.addEventListener("oneatlas:open-search", onOpen);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("oneatlas:open-search", onOpen);
    };
  }, []);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 0);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
      setQuery("");
      setResults(null);
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    if (!debounced) {
      setResults(null);
      return;
    }
    const ctrl = new AbortController();
    setLoading(true);
    fetch(`/api/search?q=${encodeURIComponent(debounced)}`, { signal: ctrl.signal })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((body: { data: Results }) => {
        setResults(body.data);
        setActive(0);
      })
      .catch((err) => {
        if (err.name !== "AbortError") setResults({ models: [], labs: [], providers: [] });
      })
      .finally(() => {
        if (!ctrl.signal.aborted) setLoading(false);
      });
    return () => ctrl.abort();
  }, [debounced]);

  const items: Item[] = useMemo(() => {
    if (!results) return [];
    return [
      ...results.models.map((m) => ({ key: `m-${m.slug}`, href: `/models/${m.slug}`, title: m.name, subtitle: `${m.lab} · ${MODEL_TYPE_LABELS[m.type as ModelTypeValue] ?? m.type}`, group: "Models" })),
      ...results.labs.map((l) => ({ key: `l-${l.slug}`, href: `/labs/${l.slug}`, title: l.name, subtitle: `${l.modelCount} models`, group: "Labs" })),
      ...results.providers.map((p) => ({ key: `p-${p.slug}`, href: `/providers/${p.slug}`, title: p.name, subtitle: p.kind, group: "Providers" })),
    ];
  }, [results]);

  const go = useCallback(
    (href: string) => {
      setOpen(false);
      router.push(href);
    },
    [router],
  );

  function onInputKey(e: React.KeyboardEvent) {
    if (e.key === "Escape") setOpen(false);
    else if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(items.length - 1, a + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(0, a - 1));
    } else if (e.key === "Enter") {
      if (items[active]) go(items[active].href);
      else if (query.trim()) go(`/models?q=${encodeURIComponent(query.trim())}`);
    }
  }

  if (!open) return null;
  let lastGroup = "";
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-slate-900/30 px-4 pt-[12vh] backdrop-blur-sm" onMouseDown={() => setOpen(false)}>
      <div role="dialog" aria-modal="true" aria-label="Search" className="w-full max-w-xl overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl" onMouseDown={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-2 border-b border-slate-200 px-4">
          <span className="text-slate-400">⌕</span>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onInputKey}
            placeholder="Search models, labs, providers…"
            className="h-12 w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
            aria-controls="search-results"
          />
          {loading && <span className="text-xs text-slate-400">…</span>}
          <kbd className="rounded border border-slate-200 px-1.5 text-[10px] text-slate-400">ESC</kbd>
        </div>
        <ul id="search-results" role="listbox" className="max-h-[50vh] overflow-y-auto p-2">
          {!query.trim() && <li className="px-3 py-6 text-center text-sm text-slate-500">Try &ldquo;llama&rdquo;, &ldquo;reasoning&rdquo;, &ldquo;groq&rdquo; or &ldquo;Anthropic&rdquo;</li>}
          {query.trim() && results && items.length === 0 && (
            <li className="px-3 py-6 text-center text-sm text-slate-500">No results for &ldquo;{query}&rdquo;</li>
          )}
          {items.map((item, idx) => {
            const header = item.group !== lastGroup ? item.group : null;
            lastGroup = item.group;
            return (
              <li key={item.key}>
                {header && <div className="label-caps px-3 pb-1 pt-3">{header}</div>}
                <button
                  type="button"
                  role="option"
                  aria-selected={idx === active}
                  onMouseEnter={() => setActive(idx)}
                  onClick={() => go(item.href)}
                  className={cn("flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm", idx === active ? "bg-slate-100" : "")}
                >
                  <span className="font-medium">{item.title}</span>
                  <span className="text-xs text-slate-500">{item.subtitle}</span>
                </button>
              </li>
            );
          })}
          {query.trim() && (
            <li>
              <button type="button" onClick={() => go(`/models?q=${encodeURIComponent(query.trim())}`)} className="mt-1 w-full rounded-lg px-3 py-2 text-left text-sm text-indigo-600 hover:bg-indigo-50">
                See all model results for &ldquo;{query.trim()}&rdquo; →
              </button>
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}

export function SearchTrigger({ className, large }: { className?: string; large?: boolean }) {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event("oneatlas:open-search"))}
      className={cn(
        "flex items-center gap-2 rounded-lg border border-slate-200 bg-white text-left text-slate-500 transition-colors hover:border-slate-300",
        large ? "h-12 w-full px-4 text-base shadow-sm" : "h-9 w-full px-3 text-sm",
        className,
      )}
    >
      <span>⌕</span>
      <span className="flex-1 truncate">{large ? "Search models, labs and providers…" : "Search…"}</span>
      <kbd className="hidden rounded border border-slate-200 px-1.5 text-[10px] sm:inline">⌘K</kbd>
    </button>
  );
}
