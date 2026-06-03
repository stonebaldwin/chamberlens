/**
 * Ingest REAL meetings from a live Legistar government via the Core pipeline.
 *
 * Drives the same `ingestConfig` the Cloudflare cron worker uses — runs the
 * Legistar adapter against the public Web API (webapi.legistar.com/v1/{client}),
 * normalizes, persists (creating gov bodies, meetings, agenda items, documents,
 * search rows + content events), and records a sync_run (visible in /admin).
 *
 * Usage (from repo root):
 *   pnpm --filter web exec tsx scripts/ingest-legistar.ts [client] [name] [state] [timezone]
 *   MAX_EVENTS=25 pnpm --filter web exec tsx scripts/ingest-legistar.ts seattle Seattle WA America/Los_Angeles
 *
 * Defaults to Seattle, WA. Needs DATABASE_URL (root .env). No API token needed
 * for token-free Legistar clients.
 */
import { config } from "dotenv";

config({ path: "../../.env" });

import { and, createDb, eq, schema } from "@repo/db";
import { ingestConfig, type IngestConfigInput, PostgresSearchIndexer } from "@repo/core";

const CLIENT = process.argv[2] ?? "seattle";
const NAME = process.argv[3] ?? "Seattle";
const STATE = process.argv[4] ?? "WA";
const TZ = process.argv[5] ?? "America/Los_Angeles";
const MAX_EVENTS = Number(process.env.MAX_EVENTS ?? 20);
const SLUG = `${NAME.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}-${STATE.toLowerCase()}`;

// Rough city centroids for the geo-radius feature (optional).
const COORDS: Record<string, [number, number]> = {
  seattle: [47.6062, -122.3321],
  oakland: [37.8044, -122.2712],
  metro: [34.0522, -118.2437],
};

async function main(): Promise<void> {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is required (root .env).");
  const db = createDb(url);

  // 1) Upsert the jurisdiction (by slug).
  let jurisdiction = (
    await db
      .select({ id: schema.jurisdictions.id })
      .from(schema.jurisdictions)
      .where(eq(schema.jurisdictions.slug, SLUG))
      .limit(1)
  )[0];

  if (!jurisdiction) {
    const [lat, lng] = COORDS[CLIENT] ?? [null, null];
    const ins = await db
      .insert(schema.jurisdictions)
      .values({ name: NAME, slug: SLUG, type: "city", state: STATE, timezone: TZ, lat, lng })
      .returning({ id: schema.jurisdictions.id });
    jurisdiction = ins[0]!;
    console.log(`+ created jurisdiction ${NAME}, ${STATE} (${SLUG}) → ${jurisdiction.id}`);
  } else {
    console.log(`· jurisdiction ${SLUG} already exists → ${jurisdiction.id}`);
  }

  // 2) Upsert the platform_config (the per-agency ingest recipe).
  let cfg = (
    await db
      .select({ id: schema.platformConfigs.id })
      .from(schema.platformConfigs)
      .where(
        and(
          eq(schema.platformConfigs.jurisdictionId, jurisdiction.id),
          eq(schema.platformConfigs.platform, "legistar"),
        ),
      )
      .limit(1)
  )[0];

  if (!cfg) {
    const ins = await db
      .insert(schema.platformConfigs)
      .values({
        jurisdictionId: jurisdiction.id,
        platform: "legistar",
        method: "api",
        client: CLIENT,
        cadence: "weekly",
        isActive: true,
        status: "active",
        config: { maxEvents: MAX_EVENTS },
      })
      .returning({ id: schema.platformConfigs.id });
    cfg = ins[0]!;
    console.log(`+ created platform_config → ${cfg.id}`);
  }

  // 3) Run the ingest pipeline against the live Legistar API.
  const input: IngestConfigInput = {
    id: cfg.id,
    jurisdictionId: jurisdiction.id,
    platform: "legistar",
    client: CLIENT,
    cadence: "weekly",
    timezone: TZ,
    options: { maxEvents: MAX_EVENTS },
  };

  console.log(`\nIngesting "${CLIENT}" via webapi.legistar.com (max ${MAX_EVENTS} events)…`);
  const run = await ingestConfig(input, { db, indexer: new PostgresSearchIndexer(db) });

  console.log("\nSync run:");
  console.log(
    JSON.stringify(
      {
        status: run.status,
        recordsSeen: run.recordsSeen,
        recordsNew: run.recordsNew,
        recordsUpdated: run.recordsUpdated,
        anomalous: run.anomalous,
        notes: run.notes ?? null,
        errorCount: run.errors?.length ?? 0,
      },
      null,
      2,
    ),
  );

  if (run.status !== "failed") {
    await db
      .update(schema.platformConfigs)
      .set({ lastSyncedAt: new Date(), lastSuccessAt: new Date() })
      .where(eq(schema.platformConfigs.id, cfg.id));
  }
  console.log("\nDone.");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
