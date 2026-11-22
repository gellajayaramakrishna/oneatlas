"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { MAX_COMPARE } from "@/lib/constants";

export interface CompareItem {
  slug: string;
  name: string;
}

interface CompareState {
  items: CompareItem[];
  has: (slug: string) => boolean;
  toggle: (item: CompareItem) => void;
  remove: (slug: string) => void;
  clear: () => void;
  replace: (items: CompareItem[]) => void;
  isFull: boolean;
}

const CompareContext = createContext<CompareState | null>(null);
const STORAGE_KEY = "oneatlas.compare.v1";

/**
 * Cross-page "compare basket". Lives in context so any card can add a model
 * and the floating tray updates instantly. Persisted to localStorage so the
 * selection survives navigation and reloads (storage access is guarded:
 * private modes and some embeds throw on access).
 */
export function CompareProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CompareItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setItems(parsed.filter((x) => x && typeof x.slug === "string").slice(0, MAX_COMPARE));
      }
    } catch {
      /* storage unavailable: start empty */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      /* ignore */
    }
  }, [items, hydrated]);

  const has = useCallback((slug: string) => items.some((i) => i.slug === slug), [items]);
  const toggle = useCallback((item: CompareItem) => {
    setItems((prev) => {
      if (prev.some((i) => i.slug === item.slug)) return prev.filter((i) => i.slug !== item.slug);
      if (prev.length >= MAX_COMPARE) return prev;
      return [...prev, item];
    });
  }, []);
  const remove = useCallback((slug: string) => setItems((prev) => prev.filter((i) => i.slug !== slug)), []);
  const clear = useCallback(() => setItems([]), []);
  const replace = useCallback((next: CompareItem[]) => setItems(next.slice(0, MAX_COMPARE)), []);

  const value = useMemo(
    () => ({ items, has, toggle, remove, clear, replace, isFull: items.length >= MAX_COMPARE }),
    [items, has, toggle, remove, clear, replace],
  );
  return <CompareContext.Provider value={value}>{children}</CompareContext.Provider>;
}

export function useCompare() {
  const ctx = useContext(CompareContext);
  if (!ctx) throw new Error("useCompare must be used inside <CompareProvider>");
  return ctx;
}
