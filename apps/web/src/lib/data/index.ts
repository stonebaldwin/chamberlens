import { createDb } from "@repo/db";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { DemoDataSource } from "./demo";
import { PostgresDataSource } from "./postgres";
import type { DataSource } from "./types";

export * from "./types";

let cached: DataSource | undefined;

function resolveDatabaseUrl(): string | undefined {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  try {
    const { env } = getCloudflareContext();
    const v = (env as Record<string, unknown>).DATABASE_URL;
    if (typeof v === "string" && v.length > 0) return v;
  } catch {
    // Not inside a Cloudflare request context (e.g. build/prerender).
  }
  return undefined;
}

/**
 * Returns the Postgres-backed data source when DATABASE_URL is configured, or
 * the in-memory demo source otherwise — so the app is fully reviewable before a
 * database is wired. Both implement the same DataSource interface.
 */
export function getDataSource(): DataSource {
  if (cached) return cached;
  const url = resolveDatabaseUrl();
  cached = url ? new PostgresDataSource(createDb(url)) : new DemoDataSource();
  return cached;
}

export function isDemoMode(): boolean {
  return getDataSource().isDemo;
}
