import { createHash } from "node:crypto";

/**
 * SHA-256 hex digest. Uses node:crypto (supported on Node and the Workers
 * runtime via nodejs_compat) — synchronous and dependency-free.
 */
export function sha256Hex(data: string | Uint8Array): string {
  return createHash("sha256").update(data).digest("hex");
}
