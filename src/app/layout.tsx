import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";
import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { CommandPalette } from "@/components/command-palette";
import { CompareProvider } from "@/components/compare-context";
import { CompareTray } from "@/components/compare-controls";
import { Navbar } from "@/components/navbar";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "OneAtlas — AI model discovery & intelligence", template: "%s · OneAtlas" },
  description: "Discover, compare and evaluate AI models across labs and providers: pricing, context windows, capabilities and benchmarks in one place.",
};

export const viewport: Viewport = { themeColor: "#ffffff" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body className="flex min-h-screen flex-col font-sans">
        <CompareProvider>
          <Navbar />
          <main className="flex-1 pb-24">{children}</main>
          <footer className="border-t border-slate-200 py-8 text-sm text-slate-500">
            <div className="container-page flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <span className="font-medium text-ink">OneAtlas</span> — AI model discovery &amp; intelligence.
                <span className="block text-xs">Demo dataset: prices are approximate list prices; benchmark scores are synthetic and for illustration only.</span>
              </div>
              <div className="flex gap-4">
                <Link href="/models" className="hover:text-ink">Models</Link>
                <Link href="/rankings" className="hover:text-ink">Rankings</Link>
                <a href="/api/models" className="hover:text-ink">API</a>
              </div>
            </div>
          </footer>
          <CompareTray />
          <CommandPalette />
        </CompareProvider>
      </body>
    </html>
  );
}
