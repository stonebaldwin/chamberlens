import type { Plan } from "./session";

export interface Entitlements {
  plan: Plan;
  alertsEnabled: boolean;
  /** -1 = unlimited */
  maxSavedSearchAlerts: number;
  maxSavedSearches: number;
  geoRadiusAlerts: boolean;
  teamSeats: number;
  apiAccess: boolean;
  exports: boolean;
  /** Free tier gets digests only, never instant alerts. */
  digestOnly: boolean;
}

const PLANS: Record<Plan, Entitlements> = {
  free: {
    plan: "free",
    alertsEnabled: false,
    maxSavedSearchAlerts: 0,
    maxSavedSearches: 3,
    geoRadiusAlerts: false,
    teamSeats: 1,
    apiAccess: false,
    exports: false,
    digestOnly: true,
  },
  pro: {
    plan: "pro",
    alertsEnabled: true,
    maxSavedSearchAlerts: 50,
    maxSavedSearches: -1,
    geoRadiusAlerts: true,
    teamSeats: 1,
    apiAccess: false,
    exports: false,
    digestOnly: false,
  },
  business: {
    plan: "business",
    alertsEnabled: true,
    maxSavedSearchAlerts: -1,
    maxSavedSearches: -1,
    geoRadiusAlerts: true,
    teamSeats: 10,
    apiAccess: true,
    exports: true,
    digestOnly: false,
  },
};

/** Single source of truth for plan gating (UI + server handlers). */
export function getEntitlements(plan: Plan): Entitlements {
  return PLANS[plan];
}

export function planLabel(plan: Plan): string {
  return plan.charAt(0).toUpperCase() + plan.slice(1);
}

export function atLimit(used: number, max: number): boolean {
  return max >= 0 && used >= max;
}
