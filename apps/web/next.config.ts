import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

const nextConfig: NextConfig = {
  // Shared workspace packages ship TypeScript source; Next transpiles them.
  transpilePackages: ["@repo/core", "@repo/db", "@repo/ui"],
};

export default nextConfig;

// Make Cloudflare bindings (env vars, R2, etc.) available during `next dev`.
void initOpenNextCloudflareForDev();
