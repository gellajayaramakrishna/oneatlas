"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MAX_COMPARE } from "@/lib/constants";
import { cn } from "@/lib/format";
import { useCompare } from "./compare-context";

export function CompareToggle({ slug, name, variant = "icon" }: { slug: string; name: string; variant?: "icon" | "button" }) {
  const { has, toggle, isFull } = useCompare();
  const active = has(slug);
  const disabled = !active && isFull;
  const label = active ? "Remove from compare" : disabled ? `Compare is full (max ${MAX_COMPARE})` : "Add to compare";

  if (variant === "button") {
    return (
      <button type="button" onClick={() => toggle({ slug, name })} disabled={disabled} className={active ? "btn-primary" : "btn-secondary"} title={label}>
        {active ? "✓ In compare" : "+ Compare"}
      </button>
    );
  }
  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggle({ slug, name });
      }}
      disabled={disabled}
      aria-pressed={active}
      aria-label={`${label}: ${name}`}
      title={label}
      className={cn(
        "inline-flex h-7 w-7 items-center justify-center rounded-md border text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-40",
        active ? "border-indigo-500 bg-indigo-500 text-white" : "border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:text-ink",
      )}
    >
      {active ? "✓" : "+"}
    </button>
  );
}

/** Floating basket shown on every page except /compare itself. */
export function CompareTray() {
  const { items, remove, clear } = useCompare();
  const pathname = usePathname();
  if (!items.length || pathname === "/compare") return null;
  const href = `/compare?models=${items.map((i) => i.slug).join(",")}`;
  return (
    <div className="fixed inset-x-0 bottom-4 z-40 flex justify-center px-4">
      <div className="flex w-full max-w-3xl flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white/95 p-2.5 shadow-lg backdrop-blur">
        <span className="px-1 text-xs font-medium text-slate-500">
          Compare {items.length}/{MAX_COMPARE}
        </span>
        {items.map((i) => (
          <span key={i.slug} className="inline-flex items-center gap-1 rounded-md bg-slate-100 py-1 pl-2 pr-1 text-xs font-medium">
            {i.name}
            <button type="button" onClick={() => remove(i.slug)} aria-label={`Remove ${i.name}`} className="rounded px-1 text-slate-400 hover:bg-slate-200 hover:text-ink">
              ×
            </button>
          </span>
        ))}
        <div className="ml-auto flex gap-2">
          <button type="button" onClick={clear} className="btn-ghost py-1.5 text-xs">
            Clear
          </button>
          <Link href={href} className={cn("btn-primary py-1.5 text-xs", items.length < 2 && "pointer-events-none opacity-50")} aria-disabled={items.length < 2}>
            {items.length < 2 ? "Pick 2+ to compare" : "Compare now →"}
          </Link>
        </div>
      </div>
    </div>
  );
}
