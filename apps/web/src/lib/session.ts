import { cache } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { authAvailable, getAuth } from "./auth";
import { getUserPlan } from "./billing";

export type Plan = "free" | "pro" | "business";

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: string;
  plan: Plan;
  isDemo: boolean;
  /** Present once the user has a Stripe customer (any subscription status). */
  stripeCustomerId: string | null;
}

const DEMO_USER: SessionUser = {
  id: "demo-user",
  email: "demo@chamberlens.local",
  name: "Demo User",
  role: "operator",
  plan: "business",
  isDemo: true,
  stripeCustomerId: null,
};

/**
 * Resolve the current user. In demo mode (no DATABASE_URL) we return a fixed
 * demo user so the dashboard is reviewable; otherwise we read the Better Auth
 * session. Plan is derived from subscriptions in Phase 5.
 */
// Memoized per request (React cache) so the layout + page + metadata that each
// call this resolve the session ONCE instead of repeating the auth+plan queries.
export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  if (!authAvailable()) return DEMO_USER;
  try {
    const session = await getAuth().api.getSession({ headers: await headers() });
    if (!session?.user) return null;
    const u = session.user as {
      id: string;
      email: string;
      name?: string | null;
      role?: string;
      stripeCustomerId?: string | null;
    };
    const plan = await getUserPlan(u.id);
    return {
      id: u.id,
      email: u.email,
      name: u.name ?? u.email,
      role: u.role ?? "user",
      plan,
      isDemo: false,
      stripeCustomerId: u.stripeCustomerId ?? null,
    };
  } catch (err) {
    // "No session" is handled above (returns null). Reaching here means a real
    // backend failure — log it and rethrow so we render the error boundary rather
    // than silently logging an authenticated user out on a transient DB blip.
    console.error("[auth] failed to resolve session", err);
    throw err;
  }
});

export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  return user;
}

export function isOperator(user: SessionUser): boolean {
  return user.role === "operator";
}
