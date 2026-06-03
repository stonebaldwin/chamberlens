import { defineCloudflareConfig } from "@opennextjs/cloudflare";

// Phase 0: default in-worker incremental cache is sufficient.
// Phase 7 (caching pass) wires an R2-backed incremental cache for production
// ISR at scale: `incrementalCache: r2IncrementalCache` + an r2_buckets binding
// in wrangler.jsonc.
export default defineCloudflareConfig({});
