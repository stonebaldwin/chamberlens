import { neon, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

// Local dev against a Neon HTTP proxy (Docker). Guarded by env, so it has no
// effect in production or on the Workers runtime (which hit Neon's real endpoint).
if (typeof process !== "undefined" && process.env.NEON_LOCAL_FETCH_ENDPOINT) {
  neonConfig.fetchEndpoint = process.env.NEON_LOCAL_FETCH_ENDPOINT;
  neonConfig.useSecureWebSocket = false;
  neonConfig.poolQueryViaFetch = true;
}

/**
 * Drizzle client bound to a Neon Postgres connection over the HTTP driver.
 *
 * The HTTP driver runs anywhere `fetch` exists — Node scripts, `next dev`, and
 * the Cloudflare Workers runtime — which is why we use it for the app runtime.
 * Pass the connection string explicitly so the Core never depends on ambient
 * env: that keeps it testable and reusable across products.
 */
export function createDb(connectionString: string) {
  const client = neon(connectionString);
  return drizzle(client, { schema });
}

export type Database = ReturnType<typeof createDb>;

let cached: Database | undefined;

/**
 * Convenience singleton for Node contexts (scripts, `next dev`) where the
 * connection string lives in `process.env`. On the Workers runtime, prefer
 * `createDb(getCloudflareContext().env.DATABASE_URL)` with the binding.
 */
export function getDb(connectionString: string | undefined = process.env.DATABASE_URL): Database {
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set. Add it to .env (see .env.example).");
  }
  return (cached ??= createDb(connectionString));
}
