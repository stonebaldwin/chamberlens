import type { CanonicalBodyRef, CanonicalMeeting, IngestMethod, Platform } from "../types";

/**
 * Per-agency ingestion recipe. One platform adapter serves thousands of agencies
 * by being configured with a different JurisdictionConfig each — adding a city is
 * a config row (platform_configs), not code.
 */
export interface JurisdictionConfig {
  jurisdictionId: string;
  platform: Platform;
  /** Legistar {client} slug, or a portal base URL. */
  client: string;
  /** Resolved secret value (NOT the env var name). Most clients don't need one. */
  apiToken?: string | null;
  /** Restrict ingestion to these platform body ids, if set. */
  bodyExternalIds?: string[] | null;
  cadence: "daily" | "weekly";
  /** IANA tz used to resolve local meeting times → UTC. */
  timezone?: string;
  /** Adapter-specific extras (max page sizes, feature flags, …). */
  options?: Record<string, unknown>;
}

export class AdapterError extends Error {
  constructor(
    message: string,
    readonly context?: string,
    cause?: unknown,
  ) {
    super(message, cause !== undefined ? { cause } : undefined);
    this.name = "AdapterError";
  }
}

/**
 * Every government data source implements this. Keyed by vendor platform, not by
 * city. `fetchRaw` does I/O; `normalize` is a pure transform (easy to unit-test
 * against fixtures).
 */
export interface SourceAdapter<TRaw = unknown> {
  id: string;
  platform: Platform;
  method: IngestMethod;
  /** Fetch raw platform records, optionally only those changed since `since`. */
  fetchRaw(config: JurisdictionConfig, since?: Date): Promise<TRaw[]>;
  /** Pure transform of one raw record into the canonical shape. */
  normalize(raw: TRaw, config: JurisdictionConfig): CanonicalMeeting;
  /** Optional: list the agency's bodies (for jurisdiction discovery / onboarding). */
  listBodies?(config: JurisdictionConfig): Promise<CanonicalBodyRef[]>;
}
