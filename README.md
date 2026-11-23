# OneAtlas

An AI model discovery and intelligence platform. You can browse, search, filter, compare and rank AI models across labs (who builds them) and providers (who serves them), with pricing, context windows, capabilities and benchmarks in one place.

Built for the OneAtlas AI Software Engineer Internship task, **Full Stack role**.

- **Live:** `https://oneatlas-jade.vercel.app/`
- **Stack:** Next.js 15 (App Router) · React 19 · TypeScript · Tailwind CSS · PostgreSQL · Prisma 6 · Zod · Vitest

---

## What's in it

| Area | What you can do |
|---|---|
| **Model explorer** (`/models`) | Full-text search. Filter by model type, capabilities (AND), input modality, lab, provider, open weights, max price and min context. Sort by release date, input/output price, context, name or Atlas score. Paginated, and every filter lives in the URL, so a search can be shared. |
| **Model detail** (`/models/[slug]`) | Specs, modalities, capabilities, a pricing table for every provider (cheapest and fastest flagged, reduced context flagged), a cost estimator, benchmark scores with rank ("#3 of 47") and similar models. |
| **Compare** (`/compare?models=a,b,c`) | Up to 4 models side by side: pricing, limits, modalities, capabilities and benchmarks, with the best value in each row highlighted. Includes a monthly cost estimator. Models can be added from anywhere through a persistent compare tray. |
| **Rankings** (`/rankings`) | An overall leaderboard (Atlas Index), per-category leaderboards (knowledge, reasoning, coding, math, multimodal, human preference) and single-benchmark leaderboards. Filter by model type and open weights. |
| **Labs** (`/labs`, `/labs/[slug]`) | Every lab with model counts, its latest release, a release timeline, and the providers that serve its models. |
| **Providers** (`/providers`, `/providers/[slug]`) | Every provider with model count, average throughput and cheapest price, plus a full offering table showing where it's the cheapest option. |
| **Global search** | `⌘K` / `Ctrl+K` / `/` from any page. Results are grouped into models, labs and providers, with keyboard navigation. |

Every page reads from PostgreSQL through the service layer, and every piece of data is also available as JSON through the REST API. Nothing is hardcoded in the frontend; even the filter options and their counts come from the database.

---

## Architecture

```
                 ┌──────────────────────────────────────────────┐
  Browser ──────▶│  Next.js App Router                          │
                 │                                              │
                 │  Server Components (pages) ──┐               │
                 │                              ▼               │
                 │  Route Handlers (/api/*) ──▶ Service layer ──┼──▶ Prisma ──▶ PostgreSQL
                 │                              ▲               │
                 │  Client Components ──fetch───┘ (search,      │
                 │  (filters, compare, ⌘K)        compare picker)│
                 └──────────────────────────────────────────────┘

  Data feed / seed ──▶ Zod validation ──▶ normalization ──▶ single-transaction upsert
```

```
src/
  app/                    pages + /api route handlers (thin: parse input → call service → respond)
  components/             UI. Client components are marked "use client"
  lib/                    shared constants (enums, labels) and formatting helpers
  server/
    db.ts                 Prisma client singleton (pg driver adapter)
    http.ts               route() wrapper, ApiError, consistent error envelope, cache headers
    validation.ts         Zod schemas for every query string
    services/             all data access: models, rankings, directory (labs/providers), search
    ingest/               raw feed schemas, normalization (pure), ingestion pipeline
prisma/
  schema.prisma           data model
  migrations/             SQL migrations
  data/                   raw catalog (labs, providers, models, benchmarks)
  seed.ts                 runs the same ingestion pipeline the admin API uses
tests/                    unit tests (normalization + validation)
```

**One service layer, two entry points.** Server-rendered pages call the services directly, which saves a pointless HTTP hop to their own server. The API routes call the same functions. So the website and the API can't drift apart, and the API is a real product surface, not an afterthought.

---

## Data model

```
Lab 1──* Model *──* Provider        (through ModelOffering)
          │
          └──* BenchmarkScore *──1 Benchmark
```

- **Lab vs Provider are separate tables.** Meta *builds* Llama; Groq, Together and Bedrock *serve* it. Mixing those two up is the most common modelling mistake in this domain, and it's what makes "who's cheapest for Llama 3.3 70B?" answerable.
- **`ModelOffering`** is the join table, and it holds the per-provider facts: input/output/cached price, the context window the provider actually serves (Groq serves Llama 4 Maverick at 128K even though the model supports 1M), throughput, latency and uptime. `@@unique([modelId, providerId])`.
- **Prices are `Decimal(12,4)` in USD per 1M tokens.** Floats are the wrong type for money, and one canonical unit means sorting and comparing just works.
- **Capabilities and modalities are Postgres `text[]`** with `hasEvery` filters. For a small, fixed vocabulary this is simpler and faster than join tables, and the vocabulary is still enforced at ingestion by Zod enums.
- **Denormalized read fields on `Model`:** `minInputPrice`, `minOutputPrice`, `providerCount`, `atlasScore`. Prisma can't `ORDER BY MIN(relation.field)`, and "sort by cheapest" is the main sort on the explorer. So the ingestion pipeline recomputes these with set-based SQL every time offerings change. This is a deliberate trade: a slightly more complex write path for a simple, indexed read path.
- **Indexes** match the actual query patterns: sort columns (`releaseDate`, `contextWindow`, `minInputPrice`, `atlasScore`), FKs, and `(benchmarkId, score)` for leaderboards.

## Ingestion and normalization

Real feeds are messy, so the raw catalog in `prisma/data` is deliberately written like one: context as `"128k"` / `"1M"` / `1047576`, Bedrock and Azure prices per **1K** tokens, others per 1M, sometimes per token, and inconsistent tag casing.

`ingestCatalog()` (`src/server/ingest/ingest.ts`) is the only write path:

1. **Validate shape** with Zod and collect *every* issue with its path (`models.3.offerings.1.provider`), not just the first one.
2. **Check references** before touching the DB: unknown lab, provider, model or benchmark, and out-of-range percentage scores. References to rows that already exist in the DB are allowed, so partial updates work.
3. **Normalize** with pure functions: token strings → integers, any price unit → per-1M (rounded to kill float noise like `0.00125 × 1000 = 1.2499999`), tags lowercased and de-duplicated, dates parsed as UTC. A provider claiming more context than the model's native window is rejected.
4. **Upsert everything inside one transaction**, keyed by slug. If anything fails, nothing is written. Running it twice is a no-op (idempotent). Offerings that disappear from the feed are removed.
5. **Recompute aggregates** (min prices, provider counts, atlas scores).

The seed script and `POST /api/admin/ingest` both go through this same function.

## Atlas score

Benchmarks use different scales (Arena Elo ~1100–1500 vs percentages), so you can't just average them. For each benchmark I min-max normalize scores across all models to 0–100 (inverting if lower is better), then take each model's mean. Models with fewer than 3 benchmarks get no score, so a model that only reports one easy benchmark can't top the table.

Known limitation: the score is relative to the current catalog, and missing benchmarks still introduce some bias. That's acceptable for a discovery tool, and it's documented.

---

## API

All responses are JSON. Errors always look like `{ "error": { "code", "message", "details?" } }`. Read endpoints send `Cache-Control: public, s-maxage=60, stale-while-revalidate=600`, so a CDN can absorb traffic.

| Method | Endpoint | Notes |
|---|---|---|
| GET | `/api/models` | `q, lab, provider, type, capability, modality, openWeights, maxPrice, minContext, sort, order, page, pageSize`. List params accept `a,b` or repeated keys. Returns `{ data, meta: { page, pageSize, total, totalPages } }` |
| GET | `/api/models/:slug` | Full detail + per-provider pricing + benchmark ranks + similar models |
| GET | `/api/compare?models=a,b` | 1–4 models, order preserved; 404 lists the unknown slugs |
| GET | `/api/rankings` | `benchmark` **or** `category`, plus `type, openWeights, limit` |
| GET | `/api/benchmarks` | All benchmarks with model counts |
| GET | `/api/labs`, `/api/labs/:slug` | Lab directory and detail |
| GET | `/api/providers`, `/api/providers/:slug` | Provider directory and detail |
| GET | `/api/search?q=` | Grouped search for the command palette |
| GET | `/api/filters` | Facets with counts (drives the filter sidebar) |
| GET | `/api/stats` | Catalog counts |
| GET | `/api/health` | Liveness + DB check (503 if the DB is down) |
| POST | `/api/admin/ingest` | `Authorization: Bearer $ADMIN_TOKEN`. Body in raw feed format. Returns 422 with every issue listed if invalid |

Examples:

```bash
curl "localhost:3000/api/models?capability=vision,tool-calling&openWeights=true&sort=price"
curl "localhost:3000/api/rankings?benchmark=swe-bench-verified&limit=10"
curl "localhost:3000/api/models?sort=banana"     # 400 with a clear validation message
```

---

## Running locally

Requirements: Node 20+, and Docker (or any PostgreSQL 14+).

```bash
npm install
cp .env.example .env
docker compose up -d          # local Postgres on :5432
npx prisma migrate deploy     # create tables
npm run db:seed               # load the catalog
npm run dev                   # http://localhost:3000
```

Other scripts: `npm test` (unit tests), `npm run typecheck`, `npm run db:reset` (drop, migrate and reseed).

## Deploying (Vercel + Neon)

1. Create a Neon project. Copy the **pooled** connection string (`DATABASE_URL`) and the **direct** one (`DIRECT_URL`).
2. Import the GitHub repo into Vercel and add `DATABASE_URL`, `DIRECT_URL` and `ADMIN_TOKEN` as environment variables.
3. Deploy. The build runs `prisma generate && prisma migrate deploy && next build`, so the schema is migrated automatically.
4. Seed once from your machine: `DATABASE_URL="<neon direct url>" DIRECT_URL="<same>" npm run db:seed`.
5. Check `https://<your-app>/api/health`.

---

## Technical decisions

- **URL as the state store for filters.** The explorer and rankings write filters to the query string, and the server component re-renders. That gives shareable links, a working back button and no client cache to keep in sync. `useTransition` keeps the old results visible (dimmed) while new ones load, and an optimistic copy of the query string makes checkboxes respond instantly and lets rapid clicks stack up correctly.
- **React Context + localStorage for the compare tray.** It's genuinely cross-page client state, so context fits. Storage access is wrapped in try/catch because private browsing can throw.
- **Search** uses `ILIKE` with name-first ranking. At this catalog size it's fast enough. The next step would be a `pg_trgm` GIN index or a `tsvector` column, without changing the API contract.
- **Search requests** are debounced, and each keystroke aborts the previous fetch with `AbortController`, so a slow response can never overwrite a newer one.
- **Prisma with the `pg` driver adapter** (`engineType = "client"`): no Rust query engine binary, which means a smaller serverless bundle and faster cold starts on Vercel.
- **Offset pagination with a unique tiebreaker** (`slug`) so rows never repeat or get skipped between pages. With thousands of models I'd switch to cursor pagination.
- **Errors**: one `route()` wrapper maps Zod errors → 400, `ApiError` → its status, ingestion errors → 422 and anything unknown → 500 (logged, with no internals leaked). Bad query params on *pages* fall back to defaults instead of crashing (`safeParseQuery`). Missing models, labs and providers return a real 404.
- **Admin ingest auth** uses a bearer token compared with `timingSafeEqual`. For a real product this would be proper auth plus rate limiting.

## About the data

Labs, providers, models, context windows and licences reflect public information as of late 2025, and prices are approximate list prices. **Benchmark scores are synthetic.** They're generated deterministically from a per-model quality tier (`prisma/data/benchmarks.ts`) so the leaderboards behave realistically, but they are not real results. Throughput, latency and uptime are also synthetic. Because ingestion is decoupled from the data files, swapping in a real feed only means replacing `prisma/data/*` or POSTing to `/api/admin/ingest`.

## What I'd do next

- A scheduled job that pulls live pricing from provider APIs through the existing ingest endpoint, plus price history (a `PriceSnapshot` table) to show trends.
- Trigram or full-text search indexes, and cursor pagination.
- A playground to send the same prompt to compared models through their providers.
- E2E tests (Playwright) for the explorer and compare flows.
