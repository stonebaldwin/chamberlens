# @repo/db — schema & search design

Drizzle schema + Neon client for the public-data platform. Tables are grouped by
domain under `src/schema/*` and re-exported from `src/schema/index.ts`.

## Data model (ER overview)

**Civic content**

```
jurisdictions ──< gov_bodies ──< meetings ──< agenda_items ──< documents
      │               │              │                            (also attach to meetings)
      │               │              ├──< documents (agenda/minutes/packet/attachment)
      │               │              └──1 transcripts ──< transcript_segments  (start/end ms → video deep-link)
      └──< platform_configs   (one per agency: platform + client + cadence + tracked bodies)
```

- `jurisdictions` — locality + `state` + `lat/lng` (for geo-radius alerts) + `timezone`.
- `gov_bodies` — councils / commissions / school boards / …, each under a jurisdiction. `isHighValue` marks bodies we transcribe eagerly.
- `platform_configs` — the per-agency ingest recipe (Legistar `{client}` slug or portal base URL, cadence, tracked body ids). `apiTokenRef` stores the **name** of a secret env var, never the secret. Adding a city is a row here, not code.
- `meetings` — tz-aware `scheduledAt`, `sourceUrl`, nullable `videoUrl`, `retrievedAt`, `(platform, externalId)` unique for idempotent re-ingest. `jurisdictionId` is denormalized for fast filtering.
- `documents` — `textContent` (extracted), `contentHash` (sha256 → change detection), `extractionStatus`.
- `transcripts` (one per meeting) + `transcript_segments` (ordered, `startMs/endMs`) — `source` = published-minutes vs STT, with `provider` and `costUsd` for budget tracking.

**Search**

- `search_documents` — denormalized, GIN-indexed search surface (see below).

**Pipeline**

- `content_events` — emitted on new content (`processed` flag) → feeds alerts.
- `sync_runs` — one row per adapter run: counts, `status`, `anomalous`, `errors[]`.

**Accounts & billing**

- `user` / `session` / `account` / `verification` — Better Auth core tables.
- `organizations` / `memberships` — team seats (Business plan).
- `subscriptions` — Stripe ids + `plan` + `status`; entitlements derive from here.
- `usage_counters` — polymorphic metered counters (`subjectType` + `subjectId` + `period` + `metric`).

**Product**

- `saved_searches` (query + `filters` JSON + `isAlert`), `alert_subscriptions` (frequency / channel / geo-radius), `alerts` (delivery log, `(saved_search, content_event)` unique → dedupe), `coverage_requests`.

## Full-text search design

We use **one denormalized `search_documents` table** rather than generated
`tsvector` columns on each source table, because a query must rank across
heterogeneous rows (agenda items, minutes, transcripts, documents) with one set
of filters. Ingestion writes one row per searchable unit.

- `tsv` is a **STORED generated column** — no triggers to maintain:
  ```sql
  tsv tsvector GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(title,'')), 'A') ||
    setweight(to_tsvector('english', body), 'B')
  ) STORED
  ```
  Title matches outrank body matches via the A/B weights.
- A **GIN index** on `tsv` makes matching fast.
- Queries use `websearch_to_tsquery('english', $q)` (supports quoted phrases,
  `OR`, `-negation`), rank with `ts_rank_cd(tsv, query)`, and snippet with
  `ts_headline('english', body, query, …)`. Filters (`jurisdictionId`,
  `govBodyId`, `docType`, `meetingDate` range) are plain btree-indexed columns
  AND-ed into the `WHERE`.
- The `SearchProvider` interface in `@repo/core` hides this so it can later swap
  to a dedicated search service without touching callers.

## Indexes tuned for the hot paths

| Query                                     | Index                                                                                                   |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| Full-text search + filters                | GIN `search_documents_tsv_idx` + btree on jurisdiction/body/date/docType                                |
| "New content since T for body X"          | `meetings_body_idx (gov_body_id, scheduled_at)`, `content_events_processed_idx (processed, created_at)` |
| "Active alert saved-searches to evaluate" | `alert_subscriptions_active_idx`, `saved_searches_alert_idx`                                            |

## Commands

```bash
pnpm --filter @repo/db db:generate   # SQL migrations from schema (no DB needed)
pnpm --filter @repo/db db:migrate    # apply to DATABASE_URL
pnpm --filter @repo/db db:studio     # Drizzle Studio
```
