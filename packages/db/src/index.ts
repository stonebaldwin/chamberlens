export { createDb, getDb, type Database } from "./client";
export * as schema from "./schema";

// Re-export the Drizzle query helpers product code reaches for most often, so
// apps import them from a single place alongside the client.
export {
  and,
  or,
  not,
  eq,
  ne,
  gt,
  gte,
  lt,
  lte,
  like,
  ilike,
  between,
  inArray,
  notInArray,
  isNull,
  isNotNull,
  asc,
  desc,
  sql,
  count,
  countDistinct,
  exists,
  getTableColumns,
} from "drizzle-orm";
