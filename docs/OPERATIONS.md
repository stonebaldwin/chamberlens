# Operations & deployment guide

How to run, deploy, and grow ChamberLens. See the root [README](../README.md) for the
architecture overview and [`packages/db/README.md`](../packages/db/README.md) for
the schema + search design.

## Local development

```bash
pnpm install
cp .env.example .env            # fill in DATABASE_URL to use Postgres (optional)
pnpm dev                        # web app at http://localhost:3000
```

**Demo mode.** With no `DATABASE_URL`, the app serves a bundled demo dataset
through the in-memory `DemoDataSource` / `DemoUserStore` / `DemoAdminStore`, and
`getSessionUser()` returns a demo operator — so the entire product (search,
dashboard, admin) is reviewable with zero infrastructure.

**Postgres mode.** Provision a Neon database, set `DATABASE_URL`, then:

```bash
pnpm db:migrate                 # apply Drizzle migrations
pnpm db:seed                    # load the demo dataset into Postgres (real FTS)
pnpm dev
```

`pnpm db:studio` opens Drizzle Studio. `pnpm db:generate` creates a new migration
after editing `packages/db/src/schema/*`.

## Verify

```bash
pnpm typecheck && pnpm lint && pnpm --filter @repo/core test
pnpm --filter web build                          # Next build
pnpm --filter web exec opennextjs-cloudflare build   # Workers bundle
```

## Environment reference

| Variable                                       | Used by               | Notes                                              |
| ---------------------------------------------- | --------------------- | -------------------------------------------------- |
| `DATABASE_URL`                                 | everything            | Neon pooled connection string. Absent ⇒ demo mode. |
| `BETTER_AUTH_SECRET`                           | auth                  | `openssl rand -base64 32`                          |
| `BETTER_AUTH_URL` / `NEXT_PUBLIC_APP_URL`      | auth, billing, alerts | public base URL                                    |
| `RESEND_API_KEY`, `EMAIL_FROM`                 | magic links, alerts   | absent ⇒ emails logged to console                  |
| `OPERATOR_EMAIL`                               | ingest                | health + spend-cap alerts land here                |
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`   | billing               |                                                    |
| `STRIPE_PRICE_{PRO,BUSINESS}_{MONTHLY,ANNUAL}` | billing               | price IDs from the Stripe dashboard                |
| `STT_PROVIDER` (`deepgram`\|`assemblyai`)      | transcription         |                                                    |
| `DEEPGRAM_API_KEY` / `ASSEMBLYAI_API_KEY`      | transcription         |                                                    |
| `STT_MONTHLY_BUDGET_USD`                       | transcription         | hard spend cap (default 50)                        |

Per-jurisdiction Legistar tokens (rare) are named by `platform_configs.apiTokenRef`
and supplied as a secret of that name — never stored in the DB.

## Deploying to Cloudflare

Both apps run on Cloudflare Workers.

**Web (`apps/web`)** via OpenNext:

```bash
cd apps/web
cp ../../.env.example .dev.vars           # local preview secrets
pnpm preview                              # local Workers-runtime preview
wrangler secret put DATABASE_URL          # + the other secrets above
pnpm deploy                               # opennextjs-cloudflare deploy
```

**Ingest (`apps/ingest`)** — cron + queue worker:

```bash
cd apps/ingest
wrangler queues create chamberlens-ingest-jobs
wrangler secret put DATABASE_URL          # + RESEND_API_KEY, OPERATOR_EMAIL, STT keys
pnpm deploy
```

Cron triggers (in `wrangler.jsonc`): `0 9 * * *` runs daily ingestion, `*/15 * * * *`
processes instant alerts. Browser-rendered portals are dispatched to the
`INGEST_QUEUE` and consumed by the same worker.

## Adding a jurisdiction (the recurring growth task)

Coverage = **platform adapter × per-agency config**, so adding a city is data
entry, not code: insert a `platform_configs` row.

```sql
insert into platform_configs (jurisdiction_id, platform, method, client, cadence, is_active, status)
values ('<jurisdiction-uuid>', 'legistar', 'api', 'raleigh', 'daily', true, 'active');
```

- `client` = the Legistar `{client}` slug (e.g. `raleigh`) or a portal base URL.
- `tracked_body_external_ids` (optional JSON) restricts to specific bodies.
- The daily cron picks it up on the next run. Hand the real client slug / portal
  URL in — don't guess it. Use `legistarAdapter.listBodies(config)` to discover
  body ids.

## Adding a new vendor-platform adapter

Implement the `SourceAdapter` interface in `packages/core/src/adapters/` and
register it:

```ts
export const myAdapter: SourceAdapter<MyRaw> = {
  id: "myplatform",
  platform: "myplatform",
  method: "html", // "api" | "html" | "browser"
  async fetchRaw(config, since) {
    /* fetch + parse → MyRaw[] */
  },
  normalize(raw, config) {
    /* → CanonicalMeeting */
  },
};
registerAdapter(myAdapter as unknown as SourceAdapter<never>);
```

Keep `fetchRaw` (I/O) and `normalize` (pure) separate so the parser is
unit-testable against fixtures (see `legistar.test.ts` / `civicplus.test.ts`).
One platform adapter then serves every agency on that platform via config.

## Swapping the speech-to-text provider

`createTranscriber({ provider, deepgramKey, assemblyaiKey })` returns a
`Transcriber` behind one interface. To add a provider, implement `Transcriber`
(a `transcribeUrl()` that returns text + ms-stamped segments + cost) and add it
to `createTranscriber`. Always batch, never stream; transcripts are cached
forever; the `BudgetGuard` enforces the monthly spend cap.

## Caching & performance

Public pages (`/`, jurisdiction/body/meeting pages, sitemap) use ISR
(`export const revalidate`). Search, dashboard, admin, and API routes are
`force-dynamic`. Cloudflare fronts everything; documents/video link out to the
official source rather than proxying through origin.

## Trust & compliance

Every record links its official source and shows "retrieved [time]". AI summaries
are labeled AI-generated and never presented as authoritative. See `/terms`,
`/privacy`, `/about`, and `/contact` (corrections). Respect each platform's
robots/ToS; prefer official APIs over scraping; rate-limit politely (the Core's
`fetchWithRetry` + `Throttle` do this).
