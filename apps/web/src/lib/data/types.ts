// View models the front end renders. Both the Postgres and demo data sources
// return these, so pages never depend on the storage backend.

export type GovBodyType =
  | "city_council"
  | "county_commission"
  | "school_board"
  | "planning_commission"
  | "zoning_board"
  | "special_district"
  | "committee"
  | "other";

export type DocType =
  | "agenda"
  | "minutes"
  | "packet"
  | "attachment"
  | "resolution"
  | "ordinance"
  | "presentation"
  | "other";

export type MeetingStatus = "scheduled" | "in_progress" | "completed" | "cancelled" | "rescheduled";

export interface JurisdictionLite {
  id: string;
  slug: string;
  name: string;
  state: string;
  type: string;
  lat?: number | null;
  lng?: number | null;
  bodyCount: number;
  meetingCount: number;
}

export interface GovBodyLite {
  id: string;
  slug: string;
  name: string;
  type: GovBodyType;
  jurisdictionId: string;
  jurisdictionName: string;
  jurisdictionSlug: string;
  state: string;
}

export interface MeetingLite {
  id: string;
  title: string;
  govBodyId: string;
  govBodyName: string;
  govBodyType: GovBodyType;
  jurisdictionId: string;
  jurisdictionName: string;
  jurisdictionSlug: string;
  state: string;
  meetingType?: string | null;
  status: MeetingStatus;
  scheduledAt: Date;
  location?: string | null;
  videoUrl?: string | null;
  sourceUrl: string;
  retrievedAt: Date;
}

export interface DocumentLite {
  id: string;
  docType: DocType;
  title: string | null;
  originalUrl: string;
  textContent?: string | null;
}

export interface AgendaItemLite {
  id: string;
  order: number;
  itemNumber?: string | null;
  title: string;
  description?: string | null;
}

export interface TranscriptSegmentLite {
  startMs: number;
  endMs: number;
  text: string;
  speaker?: string | null;
}

export interface TranscriptLite {
  source: "published_minutes" | "stt";
  provider: string;
  segments: TranscriptSegmentLite[];
  fullText: string;
}

export interface MeetingDetail extends MeetingLite {
  agendaItems: AgendaItemLite[];
  documents: DocumentLite[];
  transcript: TranscriptLite | null;
  /** AI-generated summary — always labeled as such, never authoritative. */
  aiSummary: string | null;
}

export interface SearchResultItem {
  meeting: MeetingLite;
  refType: string;
  docType: DocType | null;
  /** ts_headline / highlighted snippet with <mark>…</mark>. */
  snippet: string;
  rank: number;
}

export interface SearchResponse {
  hits: SearchResultItem[];
  total: number;
}

export interface SearchParams {
  q: string;
  jurisdictionIds?: string[];
  govBodyIds?: string[];
  docTypes?: string[];
  dateFrom?: string;
  dateTo?: string;
  limit?: number;
  offset?: number;
}

export interface CoverageStats {
  jurisdictions: number;
  bodies: number;
  meetings: number;
  documents: number;
}

export interface JurisdictionPage {
  jurisdiction: JurisdictionLite;
  bodies: GovBodyLite[];
  recentMeetings: MeetingLite[];
  upcomingMeetings: MeetingLite[];
}

export interface BodyPage {
  body: GovBodyLite;
  recentMeetings: MeetingLite[];
  upcomingMeetings: MeetingLite[];
}

export interface CoverageRequestInput {
  jurisdictionName: string;
  state?: string;
  email?: string;
  notes?: string;
}

export interface DataSource {
  /** true when serving bundled demo data (no DATABASE_URL configured). */
  readonly isDemo: boolean;
  search(params: SearchParams): Promise<SearchResponse>;
  listJurisdictions(): Promise<JurisdictionLite[]>;
  listBodies(): Promise<GovBodyLite[]>;
  getJurisdictionBySlug(slug: string): Promise<JurisdictionPage | null>;
  getBodyBySlug(jurisdictionSlug: string, bodySlug: string): Promise<BodyPage | null>;
  getMeetingById(id: string): Promise<MeetingDetail | null>;
  recentMeetings(limit?: number): Promise<MeetingLite[]>;
  stats(): Promise<CoverageStats>;
  allMeetingIds(): Promise<string[]>;
  createCoverageRequest(input: CoverageRequestInput): Promise<void>;
}
