import { describe, expect, it } from "vitest";
import { compareQuery, modelListQuery, parseQuery, safeParseQuery } from "@/server/validation";
import { rawModelSchema } from "@/server/ingest/schemas";

describe("modelListQuery", () => {
  it("applies defaults", () => {
    const q = parseQuery(modelListQuery, new URLSearchParams(""));
    expect(q).toMatchObject({ sort: "release", page: 1, pageSize: 20 });
  });

  it("accepts comma lists and repeated keys alike", () => {
    const a = parseQuery(modelListQuery, new URLSearchParams("lab=openai,meta"));
    const b = parseQuery(modelListQuery, new URLSearchParams("lab=openai&lab=meta"));
    expect(a.lab).toEqual(["openai", "meta"]);
    expect(b.lab).toEqual(["openai", "meta"]);
  });

  it("coerces booleans and numbers", () => {
    const q = parseQuery(modelListQuery, new URLSearchParams("openWeights=true&maxPrice=0.5&page=2"));
    expect(q.openWeights).toBe(true);
    expect(q.maxPrice).toBe(0.5);
    expect(q.page).toBe(2);
  });

  it("rejects unknown enum values and oversize pages", () => {
    expect(() => parseQuery(modelListQuery, new URLSearchParams("sort=banana"))).toThrow();
    expect(() => parseQuery(modelListQuery, new URLSearchParams("pageSize=1000"))).toThrow();
    expect(() => parseQuery(modelListQuery, new URLSearchParams("capability=telepathy"))).toThrow();
  });

  it("safeParseQuery drops only the bad key", () => {
    const q = safeParseQuery(modelListQuery, { sort: "banana", lab: "meta" });
    expect(q.sort).toBe("release");
    expect(q.lab).toEqual(["meta"]);
  });
});

describe("compareQuery", () => {
  it("caps the number of models", () => {
    expect(() => parseQuery(compareQuery, new URLSearchParams("models=a,b,c,d,e"))).toThrow();
    expect(parseQuery(compareQuery, new URLSearchParams("models=a,b")).models).toEqual(["a", "b"]);
  });
});

describe("rawModelSchema", () => {
  const base = {
    slug: "test-model", name: "Test", lab: "openai", type: "CHAT", released: "2025-01-01", context: "128k",
    input: ["Text"], output: ["text"], caps: ["Tool-Calling "], description: "x",
  };

  it("normalizes tag case before validating", () => {
    const m = rawModelSchema.parse(base);
    expect(m.input).toEqual(["text"]);
    expect(m.caps).toEqual(["tool-calling"]);
  });

  it("rejects duplicate providers in one model", () => {
    const r = rawModelSchema.safeParse({ ...base, offerings: [{ provider: "groq", in: 1, out: 1 }, { provider: "groq", in: 2, out: 2 }] });
    expect(r.success).toBe(false);
  });

  it("defaults price unit to per_1m", () => {
    const m = rawModelSchema.parse({ ...base, offerings: [{ provider: "groq", in: 1, out: 2 }] });
    expect(m.offerings[0].unit).toBe("per_1m");
  });
});
