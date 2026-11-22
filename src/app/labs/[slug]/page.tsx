import type { Metadata } from "next";
import Link from "next/link";
import { ModelList } from "@/components/models/model-list";
import { LabMark, SectionTitle, Stat } from "@/components/ui";
import { formatDate } from "@/lib/format";
import { orNotFound } from "@/lib/not-found";
import { getLab } from "@/server/services/directory";

export const dynamic = "force-dynamic";
type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  try {
    const lab = await getLab(slug);
    return { title: lab.name, description: lab.description };
  } catch {
    return { title: "Lab not found" };
  }
}

export default async function LabPage({ params }: Props) {
  const { slug } = await params;
  const lab = await orNotFound(getLab(slug));

  // Release timeline grouped by year, newest first.
  const byYear = new Map<number, typeof lab.models>();
  for (const m of lab.models) {
    const y = new Date(m.releaseDate).getUTCFullYear();
    byYear.set(y, [...(byYear.get(y) ?? []), m]);
  }
  const best = [...lab.models].filter((m) => m.atlasScore != null).sort((a, b) => b.atlasScore! - a.atlasScore!)[0];

  return (
    <div className="container-page py-8">
      <nav className="text-sm text-slate-500"><Link href="/labs" className="hover:text-ink">Labs</Link> <span className="px-1">/</span> <span className="text-ink">{lab.name}</span></nav>
      <header className="mt-4 flex flex-col gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-center">
        <LabMark name={lab.name} color={lab.brandColor} size="lg" />
        <div className="flex-1">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{lab.name}</h1>
          <p className="mt-1 max-w-3xl text-slate-600">{lab.description}</p>
        </div>
        <a href={lab.website} target="_blank" rel="noopener noreferrer" className="btn-secondary">Website ↗</a>
      </header>

      <section className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Models" value={lab.modelCount} />
        <Stat label="Open weights" value={lab.openWeightsCount} />
        <Stat label="Headquarters" value={<span className="text-base">{lab.headquarters}</span>} hint={`Founded ${lab.foundedYear}`} />
        <Stat label="Top model" value={<span className="text-base">{best ? <Link href={`/models/${best.slug}`} className="hover:text-indigo-600">{best.name}</Link> : "—"}</span>} hint={best ? `Atlas ${best.atlasScore!.toFixed(1)}` : undefined} />
      </section>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_300px]">
        <section className="min-w-0">
          <SectionTitle title="Models" href={`/models?lab=${lab.slug}`} linkLabel="Open in explorer" />
          <ModelList models={lab.models} />
        </section>
        <aside className="space-y-6">
          <div className="card p-5">
            <h3 className="font-semibold">Release timeline</h3>
            <ol className="mt-3 space-y-4">
              {[...byYear.entries()].map(([year, models]) => (
                <li key={year}>
                  <div className="label-caps">{year}</div>
                  <ul className="mt-1.5 space-y-1.5 border-l border-slate-200 pl-3">
                    {models.map((m) => (
                      <li key={m.slug} className="flex justify-between gap-2 text-sm">
                        <Link href={`/models/${m.slug}`} className="truncate hover:text-indigo-600">{m.name}</Link>
                        <span className="shrink-0 text-xs text-slate-500">{formatDate(m.releaseDate).replace(/, \d{4}$/, "")}</span>
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ol>
          </div>
          <div className="card p-5">
            <h3 className="font-semibold">Available on</h3>
            <ul className="mt-3 space-y-1.5 text-sm">
              {lab.providers.map((p) => (
                <li key={p.slug} className="flex justify-between">
                  <Link href={`/providers/${p.slug}`} className="hover:text-indigo-600">{p.name}</Link>
                  <span className="num text-slate-500">{p.modelCount}</span>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
