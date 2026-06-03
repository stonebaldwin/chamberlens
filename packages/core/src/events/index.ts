import { type Database, schema } from "@repo/db";

export type ContentEventType =
  | "new_meeting"
  | "new_agenda"
  | "new_minutes"
  | "new_transcript"
  | "new_document";

export interface ContentEventInput {
  type: ContentEventType;
  meetingId?: string | null;
  govBodyId?: string | null;
  jurisdictionId?: string | null;
  refType?: string | null;
  refId?: string | null;
  title?: string | null;
  snippet?: string | null;
}

function toRow(input: ContentEventInput) {
  return {
    type: input.type,
    meetingId: input.meetingId ?? null,
    govBodyId: input.govBodyId ?? null,
    jurisdictionId: input.jurisdictionId ?? null,
    refType: input.refType ?? null,
    refId: input.refId ?? null,
    title: input.title ?? null,
    snippet: input.snippet ?? null,
    processed: false,
  };
}

/** Emit one content event (feeds the alert pipeline; never sends email itself). */
export async function emitContentEvent(db: Database, input: ContentEventInput): Promise<void> {
  await db.insert(schema.contentEvents).values(toRow(input));
}

export async function emitContentEvents(db: Database, inputs: ContentEventInput[]): Promise<void> {
  if (!inputs.length) return;
  await db.insert(schema.contentEvents).values(inputs.map(toRow));
}
