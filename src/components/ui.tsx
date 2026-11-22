// Small presentational building blocks shared across pages. Server-safe (no hooks).
import Link from "next/link";
import type { ReactNode } from "react";
import { CAPABILITY_LABELS, MODEL_TYPE_LABELS, type Capability, type ModelTypeValue } from "@/lib/constants";
import { cn } from "@/lib/format";

export function Badge({ children, tone = "slate", className }: { children: ReactNode; tone?: "slate" | "indigo" | "green" | "amber" | "rose"; className?: string }) {
  const tones = {
    slate: "bg-slate-100 text-slate-700",
    indigo: "bg-indigo-50 text-indigo-700",
    green: "bg-emerald-50 text-emerald-700",
    amber: "bg-amber-50 text-amber-800",
    rose: "bg-rose-50 text-rose-700",
  };
  return (
    <span className={cn("inline-flex items-center whitespace-nowrap rounded-md px-1.5 py-0.5 text-[11px] font-medium", tones[tone], className)}>
      {children}
    </span>
  );
}

export function TypeBadge({ type }: { type: string }) {
  const tone = type === "REASONING" ? "indigo" : type === "CODE" ? "amber" : type === "EMBEDDING" ? "green" : "slate";
  return <Badge tone={tone}>{MODEL_TYPE_LABELS[type as ModelTypeValue] ?? type}</Badge>;
}

export function CapabilityBadge({ cap }: { cap: string }) {
  return <Badge>{CAPABILITY_LABELS[cap as Capability] ?? cap}</Badge>;
}

export function LabMark({ name, color, size = "md" }: { name: string; color: string; size?: "sm" | "md" | "lg" }) {
  const sizes = { sm: "h-5 w-5 text-[10px]", md: "h-8 w-8 text-xs", lg: "h-12 w-12 text-base" };
  return (
    <span
      aria-hidden
      className={cn("inline-flex shrink-0 items-center justify-center rounded-md font-semibold text-white", sizes[size])}
      style={{ backgroundColor: color }}
    >
      {name.replace(/[^A-Za-z]/g, "").slice(0, 2)}
    </span>
  );
}

export function ScoreBar({ value, max = 100, className }: { value: number; max?: number; className?: string }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div className={cn("h-1.5 w-full overflow-hidden rounded-full bg-slate-100", className)}>
      <div className="h-full rounded-full bg-indigo-500" style={{ width: `${pct}%` }} />
    </div>
  );
}

export function PageHeader({ title, description, children }: { title: string; description?: ReactNode; children?: ReactNode }) {
  return (
    <div className="flex flex-col gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1>
        {description && <p className="mt-1.5 max-w-2xl text-sm text-slate-600">{description}</p>}
      </div>
      {children}
    </div>
  );
}

export function Stat({ label, value, hint }: { label: string; value: ReactNode; hint?: ReactNode }) {
  return (
    <div className="card p-4">
      <div className="label-caps">{label}</div>
      <div className="mt-1 text-xl font-semibold num">{value}</div>
      {hint && <div className="mt-0.5 text-xs text-slate-500">{hint}</div>}
    </div>
  );
}

export function EmptyState({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="card flex flex-col items-center justify-center gap-2 px-6 py-16 text-center">
      <div className="text-base font-medium">{title}</div>
      {children && <div className="text-sm text-slate-500">{children}</div>}
    </div>
  );
}

export function SectionTitle({ title, href, linkLabel = "View all" }: { title: string; href?: string; linkLabel?: string }) {
  return (
    <div className="mb-3 flex items-baseline justify-between">
      <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
      {href && (
        <Link href={href} className="text-sm text-indigo-600 hover:text-indigo-700">
          {linkLabel} →
        </Link>
      )}
    </div>
  );
}
