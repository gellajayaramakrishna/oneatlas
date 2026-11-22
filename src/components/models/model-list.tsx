import Link from "next/link";
import { formatDate, formatPrice, formatTokens } from "@/lib/format";
import type { ModelCard } from "@/server/services/serializers";
import { CompareToggle } from "../compare-controls";
import { Badge, LabMark, TypeBadge } from "../ui";

/** Responsive model listing: a dense table on desktop, stacked cards on mobile. */
export function ModelList({ models }: { models: ModelCard[] }) {
  return (
    <>
      <div className="card hidden overflow-x-auto md:block">
        <table className="table-base">
          <thead>
            <tr>
              <th className="w-10"><span className="sr-only">Compare</span></th>
              <th>Model</th>
              <th>Type</th>
              <th className="text-right">Context</th>
              <th className="text-right">Input $/1M</th>
              <th className="text-right">Output $/1M</th>
              <th className="text-right">Atlas</th>
              <th className="text-right">Released</th>
            </tr>
          </thead>
          <tbody>
            {models.map((m) => (
              <tr key={m.slug}>
                <td><CompareToggle slug={m.slug} name={m.name} /></td>
                <td>
                  <Link href={`/models/${m.slug}`} className="group flex items-center gap-2.5">
                    <LabMark name={m.lab.name} color={m.lab.brandColor} size="sm" />
                    <span>
                      <span className="font-medium group-hover:text-indigo-600">{m.name}</span>
                      <span className="block text-xs text-slate-500">
                        {m.lab.name} · {m.providerCount} provider{m.providerCount === 1 ? "" : "s"}
                        {m.openWeights && <Badge tone="green" className="ml-1.5">Open</Badge>}
                      </span>
                    </span>
                  </Link>
                </td>
                <td><TypeBadge type={m.type} /></td>
                <td className="num text-right">{formatTokens(m.contextWindow)}</td>
                <td className="num text-right">{formatPrice(m.minInputPrice)}</td>
                <td className="num text-right">{formatPrice(m.minOutputPrice)}</td>
                <td className="num text-right">{m.atlasScore?.toFixed(1) ?? <span className="text-slate-300">—</span>}</td>
                <td className="whitespace-nowrap text-right text-slate-500">{formatDate(m.releaseDate)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="space-y-3 md:hidden">
        {models.map((m) => (
          <li key={m.slug} className="card card-hover relative p-4">
            <div className="flex items-start gap-3">
              <LabMark name={m.lab.name} color={m.lab.brandColor} />
              <div className="min-w-0 flex-1">
                <Link href={`/models/${m.slug}`} className="font-medium after:absolute after:inset-0">{m.name}</Link>
                <div className="text-xs text-slate-500">{m.lab.name} · {formatDate(m.releaseDate)}</div>
              </div>
              <div className="relative z-10"><CompareToggle slug={m.slug} name={m.name} /></div>
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              <TypeBadge type={m.type} />
              {m.openWeights && <Badge tone="green">Open weights</Badge>}
            </div>
            <dl className="mt-3 grid grid-cols-3 gap-2 text-xs">
              <div><dt className="text-slate-500">Context</dt><dd className="num font-medium">{formatTokens(m.contextWindow)}</dd></div>
              <div><dt className="text-slate-500">In / Out</dt><dd className="num font-medium">{formatPrice(m.minInputPrice)} / {formatPrice(m.minOutputPrice)}</dd></div>
              <div><dt className="text-slate-500">Atlas</dt><dd className="num font-medium">{m.atlasScore?.toFixed(1) ?? "—"}</dd></div>
            </dl>
          </li>
        ))}
      </ul>
    </>
  );
}

export function Pagination({ page, totalPages, makeHref }: { page: number; totalPages: number; makeHref: (page: number) => string }) {
  if (totalPages <= 1) return null;
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1).filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1);
  return (
    <nav className="mt-6 flex items-center justify-center gap-1" aria-label="Pagination">
      <PageLink href={makeHref(page - 1)} disabled={page <= 1}>← Prev</PageLink>
      {pages.map((p, i) => (
        <span key={p} className="flex items-center">
          {i > 0 && pages[i - 1] !== p - 1 && <span className="px-1 text-slate-400">…</span>}
          <PageLink href={makeHref(p)} active={p === page}>{p}</PageLink>
        </span>
      ))}
      <PageLink href={makeHref(page + 1)} disabled={page >= totalPages}>Next →</PageLink>
    </nav>
  );
}

function PageLink({ href, children, active, disabled }: { href: string; children: React.ReactNode; active?: boolean; disabled?: boolean }) {
  if (disabled) return <span className="btn-ghost pointer-events-none opacity-40">{children}</span>;
  return (
    <Link href={href} scroll={false} className={active ? "btn-primary min-w-9" : "btn-ghost min-w-9"} aria-current={active ? "page" : undefined}>
      {children}
    </Link>
  );
}
