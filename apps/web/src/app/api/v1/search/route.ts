import { NextResponse } from "next/server";
import { getDataSource, isDemoMode } from "@/lib/data";
import { resolveEnv } from "@/lib/auth";

export const dynamic = "force-dynamic";

// The hardcoded demo key is ONLY accepted in demo mode (no DATABASE_URL), so the
// public API stays reviewable without setup. With a real database, require
// CHAMBERLENS_DEMO_API_KEY — never ship a working bearer token in the bundle.
const DEMO_KEY = "chamberlens_demo_readonly_key";

export async function GET(request: Request): Promise<Response> {
  const validKey = resolveEnv("CHAMBERLENS_DEMO_API_KEY") ?? (isDemoMode() ? DEMO_KEY : null);
  if (!validKey) {
    return NextResponse.json({ error: "API not configured" }, { status: 503 });
  }
  const auth = request.headers.get("authorization") ?? "";
  const key = auth.replace(/^Bearer\s+/i, "").trim();
  if (!key || key !== validKey) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const q = (url.searchParams.get("q") ?? "").trim();
  if (!q) return NextResponse.json({ error: "missing query parameter `q`" }, { status: 400 });

  const limit = Math.min(50, Math.max(1, Number(url.searchParams.get("limit")) || 20));
  const results = await getDataSource().search({ q, limit });

  return NextResponse.json({
    query: q,
    total: results.total,
    hits: results.hits.map((h) => ({
      meetingId: h.meeting.id,
      title: `${h.meeting.jurisdictionName} ${h.meeting.govBodyName}`,
      jurisdiction: h.meeting.jurisdictionName,
      body: h.meeting.govBodyName,
      date: h.meeting.scheduledAt,
      docType: h.docType,
      snippet: h.snippet.replace(/<\/?mark>/g, ""),
      url: `/meetings/${h.meeting.id}`,
    })),
  });
}
