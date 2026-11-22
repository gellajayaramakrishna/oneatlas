// Display helpers. Pure functions, safe on server and client.

export function formatTokens(n: number | null | undefined): string {
  if (n == null) return "—";
  if (n >= 1_000_000) {
    const m = n / 1_000_000;
    return `${Number.isInteger(m) ? m : m.toFixed(m >= 10 ? 0 : 2).replace(/\.?0+$/, "")}M`;
  }
  if (n >= 1_000) return `${Math.round(n / 1_000)}K`;
  return String(n);
}

/** Price is USD per 1M tokens. */
export function formatPrice(p: number | null | undefined): string {
  if (p == null) return "—";
  if (p === 0) return "Free";
  if (p < 0.1) return `$${p.toFixed(3)}`;
  return `$${p.toFixed(2)}`;
}

export function formatDate(d: string | Date | null | undefined): string {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric", timeZone: "UTC" });
}

export function formatScore(score: number | null | undefined, unit = "%"): string {
  if (score == null) return "—";
  return unit === "elo" ? Math.round(score).toString() : `${score.toFixed(1)}%`;
}

export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

/**
 * Estimated cost in USD for a workload, given per-1M prices.
 * Used on detail and compare pages ("what does 1M in / 200K out cost?").
 */
export function estimateCost(inputPrice: number | null, outputPrice: number | null, inTok: number, outTok: number) {
  if (inputPrice == null || outputPrice == null) return null;
  return (inputPrice * inTok + outputPrice * outTok) / 1_000_000;
}
