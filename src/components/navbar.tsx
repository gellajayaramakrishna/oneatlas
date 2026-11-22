"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { cn } from "@/lib/format";
import { SearchTrigger } from "./command-palette";

const LINKS = [
  { href: "/models", label: "Models" },
  { href: "/compare", label: "Compare" },
  { href: "/rankings", label: "Rankings" },
  { href: "/labs", label: "Labs" },
  { href: "/providers", label: "Providers" },
];

export function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [pathname]);

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="container-page flex h-14 items-center gap-6">
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-ink text-xs text-white">OA</span>
          OneAtlas
        </Link>
        <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
          {LINKS.map((l) => {
            const active = pathname === l.href || pathname.startsWith(`${l.href}/`);
            return (
              <Link key={l.href} href={l.href} className={cn("rounded-md px-3 py-1.5 text-sm transition-colors", active ? "bg-slate-100 font-medium text-ink" : "text-slate-600 hover:text-ink")}>
                {l.label}
              </Link>
            );
          })}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <SearchTrigger className="w-40 sm:w-56" />
          <button type="button" className="btn-ghost px-2 md:hidden" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-label="Toggle menu">
            {open ? "✕" : "☰"}
          </button>
        </div>
      </div>
      {open && (
        <nav className="border-t border-slate-200 bg-white md:hidden" aria-label="Mobile">
          <div className="container-page flex flex-col py-2">
            {LINKS.map((l) => (
              <Link key={l.href} href={l.href} className={cn("rounded-md px-3 py-2 text-sm", pathname.startsWith(l.href) ? "bg-slate-100 font-medium" : "text-slate-600")}>
                {l.label}
              </Link>
            ))}
          </div>
        </nav>
      )}
    </header>
  );
}
