import { NextResponse } from "next/server";
import { createDb, sql } from "@repo/db";

// Health checks must never be statically cached.
export const dynamic = "force-dynamic";

/**
 * Resolve DATABASE_URL from wherever we're running:
 * - Cloudflare Workers runtime → the Cloudflare binding (secret/var)
 * - plain `next dev` (Node) → process.env
 */
async function resolveDatabaseUrl(): Promise<string | undefined> {
  try {
    const { getCloudflareContext } = await import("@opennextjs/cloudflare");
    const { env } = getCloudflareContext();
    const fromBinding = (env as Record<string, unknown>).DATABASE_URL;
    if (typeof fromBinding === "string" && fromBinding.length > 0) return fromBinding;
  } catch {
    // Not on the Workers runtime — fall back to process.env below.
  }
  return process.env.DATABASE_URL;
}

export async function GET() {
  const url = await resolveDatabaseUrl();

  if (!url) {
    return NextResponse.json({
      ok: false,
      db: "unconfigured",
      message:
        "DATABASE_URL is not set. Add it to .env (next dev) or apps/web/.dev.vars (preview).",
    });
  }

  try {
    const db = createDb(url);
    await db.execute(sql`select 1 as ok`);
    return NextResponse.json({ ok: true, db: "connected" });
  } catch (err) {
    return NextResponse.json({
      ok: false,
      db: "error",
      message: err instanceof Error ? err.message : String(err),
    });
  }
}
