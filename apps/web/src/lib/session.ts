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
}

const DEMO_USER: SessionUser = {
  id: "demo-user",
  email: "demo@chamberlens.local",
  name: "Demo User",
  role: "operator",
  plan: "business",
  isDemo: true,
};

/**
 * Resolve the current user. In demo mode (no DATABASE_URL) we return a fixed
 * demo user so the dashboard is reviewable; otherwise we read the Better Auth
 * session. Plan is derived from subscriptions in Phase 5.
 */
export async function getSessionUser(): Promise<SessionUser | null> {
  if (!authAvailable()) return DEMO_USER;
  try {
    const session = await getAuth().api.getSession({ headers: await headers() });
    if (!session?.user) return null;
    const u = session.user as { id: string; email: string; name?: string | null; role?: string };
    const plan = await getUserPlan(u.id);
    return {
      id: u.id,
      email: u.email,
      name: u.name ?? u.email,
      role: u.role ?? "user",
      plan,
      isDemo: false,
    };
  } catch {
    return null;
  }
}

export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  return user;
}

export function isOperator(user: SessionUser): boolean {
  return user.role === "operator";
}
