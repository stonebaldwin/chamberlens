import { NextResponse } from "next/server";
import { createPortalUrl } from "@/lib/billing";
import { getSessionUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<Response> {
  const user = await getSessionUser();
  if (!user) return NextResponse.redirect(new URL("/login", request.url));

  const portalUrl = await createPortalUrl(user.id);
  if (!portalUrl) {
    return NextResponse.redirect(new URL("/dashboard/account?billing=unavailable", request.url));
  }
  return NextResponse.redirect(portalUrl, { status: 303 });
}
