import type { RawBenchmark, RawModel, RawScore } from "../../src/server/ingest/schemas";

export const benchmarks: RawBenchmark[] = [
  { slug: "mmlu-pro", name: "MMLU-Pro", category: "KNOWLEDGE", unit: "%", description: "Harder, 10-option version of MMLU covering 14 academic and professional subjects." },
  { slug: "gpqa-diamond", name: "GPQA Diamond", category: "REASONING", unit: "%", description: "Graduate-level, Google-proof science questions written by domain PhDs." },
  { slug: "hle", name: "Humanity's Last Exam", category: "REASONING", unit: "%", description: "Expert-written questions at the frontier of human knowledge across dozens of subjects." },
  { slug: "swe-bench-verified", name: "SWE-bench Verified", category: "CODING", unit: "%", description: "Resolve real GitHub issues in Python repositories; human-validated subset of 500 tasks." },
  { slug: "livecodebench", name: "LiveCodeBench", category: "CODING", unit: "%", description: "Contamination-free competitive programming problems collected after model cutoffs." },
  { slug: "aime-2025", name: "AIME 2025", category: "MATH", unit: "%", description: "American Invitational Mathematics Examination 2025 problems, pass@1." },
  { slug: "math-500", name: "MATH-500", category: "MATH", unit: "%", description: "500 competition math problems sampled from the MATH dataset." },
  { slug: "mmmu", name: "MMMU", category: "MULTIMODAL", unit: "%", description: "College-level multimodal questions requiring reasoning over images, charts and diagrams." },
  { slug: "arena-elo", name: "Arena Elo", category: "HUMAN_PREFERENCE", unit: "elo", description: "Crowd-sourced pairwise human preference rating from blind side-by-side chats." },
];

// ---------------------------------------------------------------------------
// Synthetic score generator.
//
// This is demo data: scores are derived from each model's `tier` so the
// leaderboards look plausible and stay internally consistent. Swap this file
// for a real feed (Artificial Analysis, Papers with Code, LMArena exports)
// without touching the ingestion pipeline.
// ---------------------------------------------------------------------------

type Range = { lo: number; hi: number; curve: number };
const RANGES: Record<string, Range> = {
  "mmlu-pro": { lo: 38, hi: 88, curve: 0.8 },
  "gpqa-diamond": { lo: 24, hi: 90, curve: 1.3 },
  hle: { lo: 2, hi: 38, curve: 3 },
  "swe-bench-verified": { lo: 4, hi: 80, curve: 1.6 },
  livecodebench: { lo: 8, hi: 86, curve: 1.4 },
  "aime-2025": { lo: 0, hi: 96, curve: 1.8 },
  "math-500": { lo: 45, hi: 99, curve: 0.6 },
  mmmu: { lo: 40, hi: 84, curve: 1 },
  "arena-elo": { lo: 1150, hi: 1495, curve: 1 },
};

// Deterministic pseudo-random noise in [-1, 1] so re-seeding gives identical data.
function noise(key: string): number {
  let h = 2166136261;
  for (let i = 0; i < key.length; i++) h = Math.imul(h ^ key.charCodeAt(i), 16777619);
  return ((h >>> 0) / 0xffffffff) * 2 - 1;
}

export function generateScores(models: RawModel[]): RawScore[] {
  const out: RawScore[] = [];
  for (const m of models) {
    if (!m.tier) continue;
    const isReasoning = m.type === "REASONING" || m.caps.includes("reasoning");
    const hasVision = m.input.includes("image");

    for (const b of benchmarks) {
      if (b.slug === "mmmu" && !hasVision) continue;
      if (b.slug === "hle" && m.tier.q < 0.6) continue; // smaller models rarely report HLE

      let q = m.tier.q;
      if (b.category === "CODING") q += m.tier.code ?? 0;
      if (b.category === "MATH") q += m.tier.math ?? 0;
      if (b.category === "REASONING") q += m.tier.reason ?? 0;
      if (b.category === "MULTIMODAL") q += m.tier.vision ?? 0;
      // Thinking models gain most on math and competitive coding.
      if (!isReasoning && (b.slug === "aime-2025" || b.slug === "livecodebench" || b.slug === "hle")) q -= 0.18;
      q = Math.min(1, Math.max(0, q));

      const r = RANGES[b.slug];
      let score = r.lo + (r.hi - r.lo) * Math.pow(q, r.curve);
      const jitter = b.unit === "elo" ? 12 : 2.2;
      score += noise(`${m.slug}:${b.slug}`) * jitter;
      score = b.unit === "elo" ? Math.round(score) : Math.round(Math.min(100, Math.max(0, score)) * 10) / 10;

      out.push({ model: m.slug, benchmark: b.slug, score, source: "OneAtlas synthetic demo set" });
    }
  }
  return out;
}
