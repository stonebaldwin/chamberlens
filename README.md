# Public-Data Monorepo

A reusable data-ingestion **Core** plus product apps for a public-data holding company.
The first product is **ChamberLens** ([chamberlens.com](https://chamberlens.com)) — a self-serve
SaaS that aggregates public local-government meeting agendas, minutes, and video across
jurisdictions and across vendor platforms, makes them full-text searchable, and sends keyword
alerts.

## Why a monorepo

The expensive parts — the adapter framework, normalizer, entity resolution, change
detection, ingestion health monitoring, transcription, and full-text search — live in
**product-agnostic** packages so future sibling products reuse them. The second product is
mostly new adapters plus a new front end on the same Core.

## Layout

```
apps/
  web/      ChamberLens Next.js app (App Router) on Cloudflare Workers via @opennextjs/cloudflare
  ingest/   Cloudflare Workers cron/queue ingestion runners (Phase 6)
packages/
  core/     reusable engine: adapters, normalizer, entity resolution, change detection,
            health monitoring, transcription, full-text search — NO product/UI assumptions
  db/       Drizzle schema + Neon client + migrations (shared)
  ui/       design system: tokens + accessible primitives (shared)
```

**Separation rule:** `packages/{core,db,ui}` must not import anything ChamberLens-specific.
Apps depend on packages; packages never depend on apps. Shared packages are published
under the neutral `@repo/*` scope so a second product imports them without a ChamberLens name.

## Stack

- Next.js 16 (App Router) + TypeScript (strict) on Cloudflare Workers (`@opennextjs/cloudflare`, Node runtime)
- Neon Postgres + Drizzle ORM
- Better Auth (Phase 4) · Stripe (Phase 5) · Resend (email)
- Tailwind CSS v4 design system (`@repo/ui`)
- Cloudflare Cron Triggers + Queues + Browser Rendering for ingestion (Phase 6)
- Postgres full-text search (tsvector/GIN); batch speech-to-text behind a swappable provider

## Getting started

```bash
pnpm install
cp .env.example .env        # fill in DATABASE_URL (Neon)
pnpm dev                    # apps/web at http://localhost:3007
```

Visit [`/styleguide`](http://localhost:3007/styleguide) to review the design system.

**No database needed to review.** With no `DATABASE_URL`, the app serves a bundled
demo dataset and the full product — search, dashboard, and admin cockpit — is
reviewable. To use Postgres: set `DATABASE_URL`, then `pnpm db:migrate && pnpm db:seed`.

**Live data.** Pull real meetings, agendas, and documents from any token-free
Legistar government through the Core ingestion pipeline (the same `ingestConfig`
the cron worker uses) — it records a `sync_run` visible in `/admin`:

```bash
# pnpm --filter web ingest <client> <name> <state> <timezone>
pnpm --filter web ingest seattle Seattle WA America/Los_Angeles
pnpm --filter web ingest oakland Oakland CA America/Los_Angeles
```

Full guide: **[docs/OPERATIONS.md](docs/OPERATIONS.md)**.

### Root scripts

| Script             | What it does                           |
| ------------------ | -------------------------------------- |
| `pnpm dev`         | Run the web app (Next dev server)      |
| `pnpm build`       | Build every package and app            |
| `pnpm typecheck`   | Type-check the whole workspace         |
| `pnpm lint`        | Lint the whole workspace               |
| `pnpm format`      | Prettier write                         |
| `pnpm db:generate` | Generate Drizzle migrations (Phase 2+) |
| `pnpm db:migrate`  | Apply migrations                       |
| `pnpm db:studio`   | Open Drizzle Studio                    |

### Deploy (Cloudflare)

```bash
pnpm --filter web preview   # local Workers-runtime preview (opennextjs-cloudflare)
pnpm --filter web deploy    # deploy to Cloudflare Workers
```

Requires a Cloudflare account (`wrangler login`) and `DATABASE_URL` set as a Worker secret.

## Build phases

- [x] **Phase 0** — monorepo, tooling, design system + `/styleguide`
- [x] **Phase 1** — Core: adapters (Legistar live + CivicPlus) + transcription + full-text search + health, 30 tests
- [x] **Phase 2** — database schema (Drizzle, 23 tables, generated tsvector + GIN)
- [x] **Phase 3** — public search/browse front end (ISR-cached, SEO, sitemap)
- [x] **Phase 4** — Better Auth + user dashboard (saved searches, alerts, API, watchlists)
- [x] **Phase 5** — Stripe self-serve billing + entitlements
- [x] **Phase 6** — scheduled ingestion + alert pipeline + admin cockpit
- [x] **Phase 7** — hardening, SEO, seed/demo, operations docs

## Compliance posture

Public civic record — public-interest, indexable, low legal risk. Always attribute and link
the official source, show "retrieved [timestamp]," and label AI summaries as AI-generated
(never as the authoritative record). Respect each platform's robots/ToS; prefer official
APIs over scraping; polite rate-limiting.
