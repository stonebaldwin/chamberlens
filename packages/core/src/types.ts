/**
 * Canonical domain types. Every adapter normalizes its platform's messy shape
 * into these, regardless of vendor. They intentionally mirror the @repo/db enum
 * values (same string literals) so persistence is a direct mapping.
 */

export type Platform =
  | "legistar"
  | "civicplus"
  | "civicclerk"
  | "primegov"
  | "granicus"
  | "csv"
  | "browser";

export type IngestMethod = "api" | "html" | "browser";

export type GovBodyType =
  | "city_council"
  | "county_commission"
  | "school_board"
  | "planning_commission"
  | "zoning_board"
  | "special_district"
  | "committee"
  | "other";

export type MeetingStatus = "scheduled" | "in_progress" | "completed" | "cancelled" | "rescheduled";

export type DocType =
  | "agenda"
  | "minutes"
  | "packet"
  | "attachment"
  | "resolution"
  | "ordinance"
  | "presentation"
  | "other";

export interface CanonicalBodyRef {
  /** Platform's id for the body (e.g. Legistar BodyId), if available. */
  externalId?: string | null;
  name: string;
  type: GovBodyType;
}

export interface CanonicalDocument {
  docType: DocType;
  title?: string | null;
  originalUrl: string;
  mimeType?: string | null;
}

export interface CanonicalAgendaItem {
  externalId?: string | null;
  order: number;
  itemNumber?: string | null;
  title: string;
  description?: string | null;
  itemType?: string | null;
  documents?: CanonicalDocument[];
}

/** The single shape all adapters output. */
export interface CanonicalMeeting {
  /** Platform's id for the event/meeting, if available (used for dedup). */
  externalId: string | null;
  platform: Platform;
  title: string;
  meetingType?: string | null;
  status: MeetingStatus;
  /** Absolute instant (UTC). Adapters resolve local time + tz → this. */
  scheduledAt: Date;
  location?: string | null;
  videoUrl?: string | null;
  sourceUrl: string;
  govBody: CanonicalBodyRef;
  agendaItems: CanonicalAgendaItem[];
  documents: CanonicalDocument[];
}
