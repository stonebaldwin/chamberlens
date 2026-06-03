import { NextResponse } from "next/server";
import { getDataSource } from "@/lib/data";
import { resolveEnv } from "@/lib/auth";

export const dynamic = "force-dynamic";

const DEMO_KEY = "chamberlens_demo_readonly_key";

// Simple authed read API over search. In production, keys are looked up in a
// keys table (Phase 7); here we accept the demo key (or CHAMBERLENS_DEMO_API_KEY).
export async function GET(request: Request): Promise<Response> {
  const auth = request.headers.get("authorization") ?? "";
  const key = auth.replace(/^Bearer\s+/i, "").trim();
  const validKey = resolveEnv("CHAMBERLENS_DEMO_API_KEY") ?? DEMO_KEY;
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
