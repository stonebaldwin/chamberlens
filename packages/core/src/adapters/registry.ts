import type { Platform } from "../types";
import { civicplusAdapter } from "./civicplus";
import { legistarAdapter } from "./legistar";
import type { SourceAdapter } from "./types";

// Heterogeneous adapters (each with its own raw type) are stored behind the
// unknown-raw view; the concrete adapter handles its own raw shape at runtime.
const registry = new Map<Platform, SourceAdapter>();

export function registerAdapter(adapter: SourceAdapter<never>): void {
  registry.set(adapter.platform, adapter as unknown as SourceAdapter);
}

export function getAdapter(platform: Platform): SourceAdapter {
  const adapter = registry.get(platform);
  if (!adapter) throw new Error(`No adapter registered for platform "${platform}"`);
  return adapter;
}

export function hasAdapter(platform: Platform): boolean {
  return registry.has(platform);
}

export function listAdapters(): SourceAdapter[] {
  return [...registry.values()];
}

// Register the built-in adapters.
registerAdapter(legistarAdapter as unknown as SourceAdapter<never>);
registerAdapter(civicplusAdapter as unknown as SourceAdapter<never>);
