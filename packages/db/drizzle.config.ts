import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

// Scripts run from packages/db, so load the monorepo-root .env.
config({ path: "../../.env" });

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/schema/index.ts",
  out: "./drizzle",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "",
  },
  strict: true,
  verbose: true,
});
