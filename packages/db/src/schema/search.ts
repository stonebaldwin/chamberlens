import { sql } from "drizzle-orm";
import { index, pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { createdAt, docTypeEnum, primaryId, searchRefTypeEnum, tsvector } from "./_shared";
import { govBodies, jurisdictions } from "./jurisdictions";
import { meetings } from "./meetings";

/**
 * Denormalized full-text search surface. We chose a unified `search_documents`
 * table (over generated tsvector columns on each source table) because search
 * spans heterogeneous rows — agenda items, minutes, transcripts, documents —
 * and unifying them lets one GIN-indexed query rank across all of them with a
 * single set of filters. Ingestion writes one row per searchable unit; `tsv` is
 * a STORED generated column so indexing/ranking need no triggers.
 */
export const searchDocuments = pgTable(
  "search_documents",
  {
    id: primaryId(),
    refType: searchRefTypeEnum("ref_type").notNull(),
    refId: text("ref_id").notNull(), // source row id
    meetingId: text("meeting_id")
      .notNull()
      .references(() => meetings.id, { onDelete: "cascade" }),
    govBodyId: text("gov_body_id")
      .notNull()
      .references(() => govBodies.id, { onDelete: "cascade" }),
    jurisdictionId: text("jurisdiction_id")
      .notNull()
      .references(() => jurisdictions.id, { onDelete: "cascade" }),
    docType: docTypeEnum("doc_type"),
    title: text("title"),
    body: text("body").notNull(),
    meetingDate: timestamp("meeting_date", { withTimezone: true }).notNull(),
    // STORED generated tsvector over title + body (weighted: title = A, body = B).
    tsv: tsvector("tsv").generatedAlwaysAs(
      sql`setweight(to_tsvector('english', coalesce(title, '')), 'A') || setweight(to_tsvector('english', body), 'B')`,
    ),
    createdAt: createdAt(),
  },
  (t) => [
    index("search_documents_tsv_idx").using("gin", t.tsv),
    index("search_documents_jurisdiction_idx").on(t.jurisdictionId),
    index("search_documents_body_idx").on(t.govBodyId),
    index("search_documents_date_idx").on(t.meetingDate),
    index("search_documents_doc_type_idx").on(t.docType),
    uniqueIndex("search_documents_ref_uniq").on(t.refType, t.refId),
  ],
);
