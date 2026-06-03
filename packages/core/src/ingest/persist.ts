import { and, type Database, eq, schema } from "@repo/db";
import type { JurisdictionConfig } from "../adapters/types";
import { type ContentEventInput, emitContentEvents } from "../events";
import type { IndexableDoc, SearchIndexer } from "../search/types";
import type { CanonicalBodyRef, CanonicalMeeting } from "../types";
import { slugify } from "../util/text";

export interface PersistResult {
  meetingId: string;
  created: boolean;
  newDocuments: number;
}

/** Idempotently resolve/create the gov body within a jurisdiction. */
async function upsertGovBody(
  db: Database,
  jurisdictionId: string,
  body: CanonicalBodyRef,
): Promise<string> {
  const { govBodies } = schema;
  if (body.externalId) {
    const found = await db
      .select({ id: govBodies.id })
      .from(govBodies)
      .where(
        and(
          eq(govBodies.jurisdictionId, jurisdictionId),
          eq(govBodies.externalId, body.externalId),
        ),
      )
      .limit(1);
    if (found[0]) return found[0].id;
  }

  const slug = slugify(body.name) || "body";
  const bySlug = await db
    .select({ id: govBodies.id })
    .from(govBodies)
    .where(and(eq(govBodies.jurisdictionId, jurisdictionId), eq(govBodies.slug, slug)))
    .limit(1);
  if (bySlug[0]) {
    if (body.externalId) {
      await db
        .update(govBodies)
        .set({ externalId: body.externalId })
        .where(eq(govBodies.id, bySlug[0].id));
    }
    return bySlug[0].id;
  }

  const inserted = await db
    .insert(govBodies)
    .values({
      jurisdictionId,
      name: body.name,
      slug,
      type: body.type,
      externalId: body.externalId ?? null,
    })
    .onConflictDoNothing()
    .returning({ id: govBodies.id });
  if (inserted[0]) return inserted[0].id;

  // Lost an insert race — re-select.
  const again = await db
    .select({ id: govBodies.id })
    .from(govBodies)
    .where(and(eq(govBodies.jurisdictionId, jurisdictionId), eq(govBodies.slug, slug)))
    .limit(1);
  if (again[0]) return again[0].id;
  throw new Error(`Failed to upsert gov body "${body.name}"`);
}

/**
 * Persist one canonical meeting: upsert body + meeting, replace agenda items,
 * add new documents (extraction is lazy/separate), index searchable text, and
 * emit content events for the alert pipeline. Idempotent across re-ingests.
 */
export async function persistMeeting(
  db: Database,
  config: Pick<JurisdictionConfig, "jurisdictionId">,
  meeting: CanonicalMeeting,
  indexer?: SearchIndexer,
): Promise<PersistResult> {
  const { meetings, agendaItems, documents } = schema;
  const jurisdictionId = config.jurisdictionId;
  const govBodyId = await upsertGovBody(db, jurisdictionId, meeting.govBody);

  let meetingId: string;
  let created: boolean;

  const existing = meeting.externalId
    ? await db
        .select({ id: meetings.id })
        .from(meetings)
        .where(
          and(eq(meetings.platform, meeting.platform), eq(meetings.externalId, meeting.externalId)),
        )
        .limit(1)
    : [];

  if (existing[0]) {
    meetingId = existing[0].id;
    created = false;
    await db
      .update(meetings)
      .set({
        govBodyId,
        title: meeting.title,
        meetingType: meeting.meetingType ?? null,
        status: meeting.status,
        scheduledAt: meeting.scheduledAt,
        location: meeting.location ?? null,
        videoUrl: meeting.videoUrl ?? null,
        sourceUrl: meeting.sourceUrl,
        retrievedAt: new Date(),
      })
      .where(eq(meetings.id, meetingId));
  } else {
    const ins = await db
      .insert(meetings)
      .values({
        govBodyId,
        jurisdictionId,
        title: meeting.title,
        meetingType: meeting.meetingType ?? null,
        status: meeting.status,
        scheduledAt: meeting.scheduledAt,
        location: meeting.location ?? null,
        videoUrl: meeting.videoUrl ?? null,
        sourceUrl: meeting.sourceUrl,
        externalId: meeting.externalId,
        platform: meeting.platform,
      })
      .onConflictDoNothing()
      .returning({ id: meetings.id });
    if (ins[0]) {
      meetingId = ins[0].id;
      created = true;
    } else {
      const found = await db
        .select({ id: meetings.id })
        .from(meetings)
        .where(
          and(
            eq(meetings.platform, meeting.platform),
            eq(meetings.externalId, meeting.externalId ?? ""),
          ),
        )
        .limit(1);
      if (!found[0]) throw new Error("Failed to persist meeting");
      meetingId = found[0].id;
      created = false;
    }
  }

  // Agenda items: replace wholesale (cheap + idempotent).
  await db.delete(agendaItems).where(eq(agendaItems.meetingId, meetingId));
  const insertedItems = meeting.agendaItems.length
    ? await db
        .insert(agendaItems)
        .values(
          meeting.agendaItems.map((it) => ({
            meetingId,
            order: it.order,
            itemNumber: it.itemNumber ?? null,
            title: it.title,
            description: it.description ?? null,
            itemType: it.itemType ?? null,
            externalId: it.externalId ?? null,
          })),
        )
        .returning({
          id: agendaItems.id,
          title: agendaItems.title,
          description: agendaItems.description,
        })
    : [];

  // Documents: insert only ones we haven't seen (by URL).
  const existingDocs = await db
    .select({ url: documents.originalUrl })
    .from(documents)
    .where(eq(documents.meetingId, meetingId));
  const existingUrls = new Set(existingDocs.map((d) => d.url));
  const newDocs = meeting.documents.filter((d) => !existingUrls.has(d.originalUrl));
  if (newDocs.length) {
    await db
      .insert(documents)
      .values(
        newDocs.map((d) => ({
          meetingId,
          docType: d.docType,
          title: d.title ?? null,
          originalUrl: d.originalUrl,
          mimeType: d.mimeType ?? null,
          extractionStatus: "pending" as const,
        })),
      )
      .onConflictDoNothing();
  }

  // Index searchable text (document/transcript text is indexed post-extraction).
  if (indexer) {
    const docs: IndexableDoc[] = [
      {
        refType: "meeting",
        refId: meetingId,
        meetingId,
        govBodyId,
        jurisdictionId,
        title: meeting.title,
        body: [meeting.title, meeting.location].filter(Boolean).join(" "),
        meetingDate: meeting.scheduledAt,
      },
      ...insertedItems.map<IndexableDoc>((it) => ({
        refType: "agenda_item",
        refId: it.id,
        meetingId,
        govBodyId,
        jurisdictionId,
        title: it.title,
        body: [it.title, it.description].filter(Boolean).join("\n"),
        meetingDate: meeting.scheduledAt,
      })),
    ];
    await indexer.index(docs);
  }

  // Content events feed the alert pipeline.
  const events: ContentEventInput[] = [];
  if (created) {
    events.push({
      type: "new_meeting",
      meetingId,
      govBodyId,
      jurisdictionId,
      title: meeting.title,
      snippet:
        meeting.agendaItems
          .slice(0, 3)
          .map((i) => i.title)
          .join("; ") || meeting.title,
    });
  }
  for (const d of newDocs) {
    const type =
      d.docType === "minutes"
        ? "new_minutes"
        : d.docType === "agenda"
          ? "new_agenda"
          : "new_document";
    events.push({
      type,
      meetingId,
      govBodyId,
      jurisdictionId,
      refType: "document",
      title: d.title ?? meeting.title,
      snippet: meeting.title,
    });
  }
  if (events.length) await emitContentEvents(db, events);

  return { meetingId, created, newDocuments: newDocs.length };
}
