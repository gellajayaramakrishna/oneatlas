import type { Metadata } from "next";
import Link from "next/link";
import { LabMark, PageHeader } from "@/components/ui";
import { formatDate } from "@/lib/format";
import { listLabs } from "@/server/services/directory";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "AI labs", description: "Browse the companies and research labs building AI models." };

export default async function LabsPage() {
  const labs = await listLabs();
  return (
    <div className="container-page py-8">
      <PageHeader title="AI labs" description="The companies and research groups that build the models: who they are, what they ship, and how much of it is open." />
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {labs.map((l) => (
          <Link key={l.slug} href={`/labs/${l.slug}`} className="card card-hover flex flex-col p-5">
            <div className="flex items-center gap-3">
              <LabMark name={l.name} color={l.brandColor} />
              <div>
                <div className="font-semibold">{l.name}</div>
                <div className="text-xs text-slate-500">{l.headquarters} · since {l.foundedYear}</div>
              </div>
            </div>
            <p className="mt-3 line-clamp-3 flex-1 text-sm text-slate-600">{l.description}</p>
            <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-500">
              <span><span className="num font-medium text-ink">{l.modelCount}</span> models{l.openWeightsCount > 0 && <> · <span className="num">{l.openWeightsCount}</span> open</>}</span>
              {l.latestRelease && <span>Latest: {l.latestRelease.name} ({formatDate(l.latestRelease.releaseDate)})</span>}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
