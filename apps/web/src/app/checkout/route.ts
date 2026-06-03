import { NextResponse } from "next/server";
import { type BillingInterval, createCheckoutUrl } from "@/lib/billing";
import { getSessionUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const plan = url.searchParams.get("plan");
  const interval = (url.searchParams.get("interval") ?? "monthly") as BillingInterval;

  const user = await getSessionUser();
  if (!user) {
    return NextResponse.redirect(new URL(`/login?intent=signup&plan=${plan ?? ""}`, request.url));
  }
  if (plan !== "pro" && plan !== "business") {
    return NextResponse.redirect(new URL("/pricing", request.url));
  }

  const checkoutUrl = await createCheckoutUrl({
    userId: user.id,
    email: user.email,
    name: user.name,
    plan,
    interval,
  });
  if (!checkoutUrl) {
    return NextResponse.redirect(new URL("/pricing?checkout=unavailable", request.url));
  }
  return NextResponse.redirect(checkoutUrl, { status: 303 });
}
