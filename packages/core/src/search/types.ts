import type { DocType } from "../types";

export interface SearchFilters {
  jurisdictionIds?: string[];
  govBodyIds?: string[];
  docTypes?: string[];
  dateFrom?: string; // ISO date
  dateTo?: string; // ISO date
}

export interface SearchQuery {
  q: string;
  filters?: SearchFilters;
  limit?: number;
  offset?: number;
}

export interface SearchHit {
  refType: string;
  refId: string;
  meetingId: string;
  govBodyId: string;
  jurisdictionId: string;
  docType: string | null;
  title: string | null;
  /** ts_headline snippet with <mark>…</mark> around matches. */
  snippet: string;
  rank: number;
  meetingDate: Date;
}

export interface SearchResult {
  hits: SearchHit[];
  total: number;
}

/** Behind an interface so we can swap Postgres FTS for a search service later. */
export interface SearchProvider {
  search(query: SearchQuery): Promise<SearchResult>;
}

export interface IndexableDoc {
  refType: "agenda_item" | "minutes" | "transcript" | "document" | "meeting";
  refId: string;
  meetingId: string;
  govBodyId: string;
  jurisdictionId: string;
  docType?: DocType | null;
  title?: string | null;
  body: string;
  meetingDate: Date;
}

export interface SearchIndexer {
  index(docs: IndexableDoc[]): Promise<void>;
  removeByMeeting(meetingId: string): Promise<void>;
}
