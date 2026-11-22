import { describe, expect, it } from "vitest";
import { computeAtlasScores, normalizeTags, parseReleaseDate, parseTokenCount, toPerMillion } from "@/server/ingest/normalize";

describe("parseTokenCount", () => {
  it.each([
    [8192, 8192],
    ["128k", 128_000],
    ["128K", 128_000],
    ["1M", 1_000_000],
    ["1.5m", 1_500_000],
    ["200,000", 200_000],
    [" 32 k ", 32_000],
  ])("parses %p -> %p", (input, expected) => {
    expect(parseTokenCount(input)).toBe(expected);
  });

  it.each(["lots", "", "12kb", "-5k", "0"])("rejects %p", (input) => {
    expect(() => parseTokenCount(input)).toThrow();
  });

  it("rejects non-integer numbers", () => {
    expect(() => parseTokenCount(1.5)).toThrow();
  });
});

describe("toPerMillion", () => {
  it("leaves per-1M prices alone", () => expect(toPerMillion(2.5, "per_1m")).toBe(2.5));
  it("converts per-1K (Bedrock/Azure style) without float noise", () => {
    expect(toPerMillion(0.00125, "per_1k")).toBe(1.25);
    expect(toPerMillion(0.00024, "per_1k")).toBe(0.24);
  });
  it("converts per-token", () => expect(toPerMillion(0.0000002, "per_token")).toBe(0.2));
});

describe("parseReleaseDate", () => {
  it("parses as UTC midnight (no timezone drift)", () => {
    expect(parseReleaseDate("2025-08-07").toISOString()).toBe("2025-08-07T00:00:00.000Z");
  });
  it("rejects invalid dates", () => expect(() => parseReleaseDate("2025-13-45")).toThrow());
});

describe("normalizeTags", () => {
  it("lowercases, trims and de-duplicates while keeping order", () => {
    expect(normalizeTags(["Vision", "tool-calling ", "vision", "", "JSON-mode"])).toEqual(["vision", "tool-calling", "json-mode"]);
  });
});

describe("computeAtlasScores", () => {
  const benchmarks = [
    { id: "pct", higherIsBetter: true },
    { id: "elo", higherIsBetter: true },
    { id: "err", higherIsBetter: false },
  ];

  it("normalizes mixed units so Elo and % can be averaged", () => {
    const scores = [
      { modelId: "a", benchmarkId: "pct", score: 90 },
      { modelId: "b", benchmarkId: "pct", score: 50 },
      { modelId: "a", benchmarkId: "elo", score: 1400 },
      { modelId: "b", benchmarkId: "elo", score: 1200 },
      { modelId: "a", benchmarkId: "err", score: 5 },
      { modelId: "b", benchmarkId: "err", score: 20 },
    ];
    const r = computeAtlasScores(scores, benchmarks);
    expect(r.get("a")).toBe(100);
    expect(r.get("b")).toBe(0);
  });

  it("inverts lower-is-better benchmarks", () => {
    const scores = [
      { modelId: "a", benchmarkId: "err", score: 5 },
      { modelId: "b", benchmarkId: "err", score: 20 },
    ];
    const r = computeAtlasScores(scores, benchmarks, 1);
    expect(r.get("a")).toBe(100);
    expect(r.get("b")).toBe(0);
  });

  it("returns null for models with too few benchmarks", () => {
    const scores = [
      { modelId: "a", benchmarkId: "pct", score: 90 },
      { modelId: "b", benchmarkId: "pct", score: 50 },
    ];
    const r = computeAtlasScores(scores, benchmarks, 3);
    expect(r.get("a")).toBeNull();
  });
});
