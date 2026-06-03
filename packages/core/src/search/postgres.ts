import { and, type Database, desc, eq, gte, inArray, lte, schema, sql } from "@repo/db";
import type { DocType } from "../types";
import type {
  IndexableDoc,
  SearchHit,
  SearchIndexer,
  SearchProvider,
  SearchQuery,
  SearchResult,
} from "./types";

/** Trim/cap user input; websearch_to_tsquery handles phrases/boolean/negation. */
export function normalizeSearchInput(q: string): string {
  return q.replace(/\s+/g, " ").trim().slice(0, 200);
}

interface RankedRow {
  refType: string;
  refId: string;
  meetingId: string;
  govBodyId: string;
  jurisdictionId: string;
  docType: string | null;
  title: string | null;
  meetingDate: Date;
  rank: number;
  snippet: string | null;
}

export function toHit(row: RankedRow): SearchHit {
  return {
    refType: row.refType,
    refId: row.refId,
    meetingId: row.meetingId,
    govBodyId: row.govBodyId,
    jurisdictionId: row.jurisdictionId,
    docType: row.docType,
    title: row.title,
    snippet: row.snippet ?? "",
    rank: Number(row.rank),
    meetingDate: row.meetingDate instanceof Date ? row.meetingDate : new Date(row.meetingDate),
  };
}

const HEADLINE_OPTS =
  "StartSel=<mark>, StopSel=</mark>, MaxFragments=2, MinWords=5, MaxWords=18, FragmentDelimiter= … ";

export class PostgresSearchProvider implements SearchProvider {
  constructor(private readonly db: Database) {}

  async search(query: SearchQuery): Promise<SearchResult> {
    const q = normalizeSearchInput(query.q);
    if (!q) return { hits: [], total: 0 };

    const sd = schema.searchDocuments;
    const tsq = sql`websearch_to_tsquery('english', ${q})`;

    const conds = [sql`${sd.tsv} @@ ${tsq}`];
    const f = query.filters ?? {};
    if (f.jurisdictionIds?.length) conds.push(inArray(sd.jurisdictionId, f.jurisdictionIds));
    if (f.govBodyIds?.length) conds.push(inArray(sd.govBodyId, f.govBodyIds));
    if (f.docTypes?.length) conds.push(inArray(sd.docType, f.docTypes as DocType[]));
    if (f.dateFrom) conds.push(gte(sd.meetingDate, new Date(f.dateFrom)));
    if (f.dateTo) conds.push(lte(sd.meetingDate, new Date(f.dateTo)));
    const where = and(...conds);

    const rank = sql<number>`ts_rank_cd(${sd.tsv}, ${tsq})`;
    const snippet = sql<string>`ts_headline('english', ${sd.body}, ${tsq}, ${HEADLINE_OPTS})`;

    const rows = await this.db
      .select({
        refType: sd.refType,
        refId: sd.refId,
        meetingId: sd.meetingId,
        govBodyId: sd.govBodyId,
        jurisdictionId: sd.jurisdictionId,
        docType: sd.docType,
        title: sd.title,
        meetingDate: sd.meetingDate,
        rank,
        snippet,
      })
      .from(sd)
      .where(where)
      .orderBy(desc(rank), desc(sd.meetingDate))
      .limit(query.limit ?? 20)
      .offset(query.offset ?? 0);

    const totalRows = await this.db
      .select({ total: sql<number>`count(*)::int` })
      .from(sd)
      .where(where);

    return { hits: rows.map(toHit), total: Number(totalRows[0]?.total ?? 0) };
  }
}

export class PostgresSearchIndexer implements SearchIndexer {
  constructor(private readonly db: Database) {}

  async index(docs: IndexableDoc[]): Promise<void> {
    if (!docs.length) return;
    const sd = schema.searchDocuments;
    await this.db
      .insert(sd)
      .values(
        docs.map((d) => ({
          refType: d.refType,
          refId: d.refId,
          meetingId: d.meetingId,
          govBodyId: d.govBodyId,
          jurisdictionId: d.jurisdictionId,
          docType: d.docType ?? null,
          title: d.title ?? null,
          body: d.body,
          meetingDate: d.meetingDate,
        })),
      )
      .onConflictDoUpdate({
        target: [sd.refType, sd.refId],
        set: {
          title: sql`excluded.title`,
          body: sql`excluded.body`,
          docType: sql`excluded.doc_type`,
          meetingDate: sql`excluded.meeting_date`,
        },
      });
  }

  async removeByMeeting(meetingId: string): Promise<void> {
    await this.db
      .delete(schema.searchDocuments)
      .where(eq(schema.searchDocuments.meetingId, meetingId));
  }
}
