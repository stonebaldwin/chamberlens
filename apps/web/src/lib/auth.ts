import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { magicLink } from "better-auth/plugins";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { createDb, schema } from "@repo/db";
import { sendMagicLinkEmail } from "./email";

/** Read a secret from process.env or the Cloudflare binding (Workers runtime). */
export function resolveEnv(name: string): string | undefined {
  if (process.env[name]) return process.env[name];
  try {
    const { env } = getCloudflareContext();
    const v = (env as Record<string, unknown>)[name];
    if (typeof v === "string" && v.length > 0) return v;
  } catch {
    // not in a Cloudflare request context
  }
  return undefined;
}

function buildAuth(databaseUrl: string) {
  const db = createDb(databaseUrl);
  return betterAuth({
    database: drizzleAdapter(db, {
      provider: "pg",
      schema: {
        user: schema.users,
        session: schema.sessions,
        account: schema.accounts,
        verification: schema.verifications,
      },
    }),
    secret: resolveEnv("BETTER_AUTH_SECRET") ?? "dev-insecure-secret-change-me",
    baseURL: resolveEnv("BETTER_AUTH_URL") ?? resolveEnv("NEXT_PUBLIC_APP_URL"),
    emailAndPassword: { enabled: true },
    user: {
      additionalFields: {
        role: { type: "string", required: false, defaultValue: "user", input: false },
        stripeCustomerId: { type: "string", required: false, input: false },
      },
    },
    plugins: [
      magicLink({
        sendMagicLink: async ({ email, url }) => {
          await sendMagicLinkEmail(email, url);
        },
      }),
    ],
  });
}

let cached: ReturnType<typeof buildAuth> | undefined;

/** True when a database is configured (auth requires one). */
export function authAvailable(): boolean {
  return Boolean(resolveEnv("DATABASE_URL"));
}

/** Lazily-built Better Auth instance (Workers populates env per request). */
export function getAuth() {
  const url = resolveEnv("DATABASE_URL");
  if (!url) throw new Error("Auth requires DATABASE_URL to be configured.");
  cached ??= buildAuth(url);
  return cached;
}
