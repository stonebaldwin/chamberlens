/**
 * Seed the Postgres database with the bundled demo dataset, so the Postgres
 * code path (real FTS, dashboard, admin) is reviewable end-to-end. Idempotent:
 * it clears civic content first (cascade) and re-inserts.
 *
 * Run: pnpm --filter web seed   (needs DATABASE_URL in .env)
 */
import { randomUUID } from "node:crypto";
import { config } from "dotenv";

config({ path: "../../.env" });

import { createDb, schema } from "@repo/db";
import { SEED_BODIES, SEED_JURISDICTIONS, SEED_MEETINGS } from "../src/lib/seed-data";

const DEEPGRAM_PER_MIN = 0.0043;

async function main(): Promise<void> {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is required (add it to .env).");
  const db = createDb(url);

  console.log("Clearing existing civic content (cascade)…");
  await db.delete(schema.jurisdictions);

  console.log(`Inserting ${SEED_JURISDICTIONS.length} jurisdictions…`);
  await db.insert(schema.jurisdictions).values(
    SEED_JURISDICTIONS.map((j) => ({
      id: j.id,
      name: j.name,
      slug: j.slug,
      type: j.type as (typeof schema.jurisdictions.$inferInsert)["type"],
      state: j.state,
      lat: j.lat,
      lng: j.lng,
      population: j.population ?? null,
      timezone: "America/New_York",
    })),
  );

  console.log(`Inserting ${SEED_BODIES.length} gov bodies…`);
  await db.insert(schema.govBodies).values(
    SEED_BODIES.map((b) => ({
      id: b.id,
      jurisdictionId: b.jurisdictionId,
      name: b.name,
      slug: b.slug,
      type: b.type,
    })),
  );

  console.log("Inserting sample platform_configs…");
  await db.insert(schema.platformConfigs).values(
    SEED_JURISDICTIONS.map((j) => ({
      jurisdictionId: j.id,
      platform: "legistar" as const,
      method: "api" as const,
      client: j.slug.replace(/-nc$/, ""),
      cadence: "daily" as const,
      isActive: true,
      status: "active" as const,
    })),
  );

  const agendaRows: (typeof schema.agendaItems.$inferInsert)[] = [];
  const documentRows: (typeof schema.documents.$inferInsert)[] = [];
  const transcriptRows: (typeof schema.transcripts.$inferInsert)[] = [];
  const segmentRows: (typeof schema.transcriptSegments.$inferInsert)[] = [];
  const searchRows: (typeof schema.searchDocuments.$inferInsert)[] = [];
  const meetingRows: (typeof schema.meetings.$inferInsert)[] = [];

  for (const m of SEED_MEETINGS) {
    const body = SEED_BODIES.find((b) => b.id === m.bodyId);
    if (!body) continue;
    const meetingDate = new Date(m.scheduledAt);
    meetingRows.push({
      id: m.id,
      govBodyId: m.bodyId,
      jurisdictionId: body.jurisdictionId,
      title: m.title,
      meetingType: m.meetingType ?? null,
      status: m.status,
      scheduledAt: meetingDate,
      location: m.location ?? null,
      videoUrl: m.videoUrl ?? null,
      sourceUrl: m.sourceUrl,
      externalId: m.id,
      platform: "legistar",
    });

    searchRows.push({
      refType: "meeting",
      refId: m.id,
      meetingId: m.id,
      govBodyId: body.id,
      jurisdictionId: body.jurisdictionId,
      title: m.title,
      body: m.title,
      meetingDate,
    });

    m.agendaItems.forEach((it, i) => {
      const id = randomUUID();
      agendaRows.push({
        id,
        meetingId: m.id,
        order: i,
        itemNumber: it.itemNumber ?? null,
        title: it.title,
        description: it.description ?? null,
      });
      searchRows.push({
        refType: "agenda_item",
        refId: id,
        meetingId: m.id,
        govBodyId: body.id,
        jurisdictionId: body.jurisdictionId,
        title: it.title,
        body: [it.title, it.description].filter(Boolean).join("\n"),
        meetingDate,
      });
    });

    for (const d of m.documents) {
      const id = randomUUID();
      documentRows.push({
        id,
        meetingId: m.id,
        docType: d.docType,
        title: d.title,
        originalUrl: d.originalUrl,
        textContent: d.textContent ?? null,
        extractionStatus: d.textContent ? "extracted" : "pending",
      });
      if (d.textContent) {
        searchRows.push({
          refType: d.docType === "minutes" ? "minutes" : "document",
          refId: id,
          meetingId: m.id,
          govBodyId: body.id,
          jurisdictionId: body.jurisdictionId,
          docType: d.docType,
          title: d.title,
          body: [d.title, d.textContent].filter(Boolean).join("\n"),
          meetingDate,
        });
      }
    }

    if (m.transcript) {
      const id = randomUUID();
      const fullText = m.transcript.segments.map((s) => s.text).join("\n");
      const durationSec = Math.round((m.transcript.segments.at(-1)?.endMs ?? 0) / 1000);
      transcriptRows.push({
        id,
        meetingId: m.id,
        source: "stt",
        provider: m.transcript.provider as (typeof schema.transcripts.$inferInsert)["provider"],
        fullText,
        durationSeconds: durationSec,
        costUsd: (durationSec / 60) * DEEPGRAM_PER_MIN,
      });
      m.transcript.segments.forEach((s, i) => {
        segmentRows.push({
          transcriptId: id,
          meetingId: m.id,
          order: i,
          startMs: s.startMs,
          endMs: s.endMs,
          speaker: s.speaker ?? null,
          text: s.text,
        });
      });
      searchRows.push({
        refType: "transcript",
        refId: id,
        meetingId: m.id,
        govBodyId: body.id,
        jurisdictionId: body.jurisdictionId,
        title: "Transcript",
        body: fullText,
        meetingDate,
      });
    }
  }

  console.log(`Inserting ${meetingRows.length} meetings…`);
  await db.insert(schema.meetings).values(meetingRows);
  console.log(`Inserting ${agendaRows.length} agenda items…`);
  await db.insert(schema.agendaItems).values(agendaRows);
  console.log(`Inserting ${documentRows.length} documents…`);
  await db.insert(schema.documents).values(documentRows);
  if (transcriptRows.length) {
    console.log(`Inserting ${transcriptRows.length} transcripts + ${segmentRows.length} segments…`);
    await db.insert(schema.transcripts).values(transcriptRows);
    await db.insert(schema.transcriptSegments).values(segmentRows);
  }
  console.log(`Inserting ${searchRows.length} search documents…`);
  await db.insert(schema.searchDocuments).values(searchRows);

  console.log("Inserting sample coverage requests…");
  await db.insert(schema.coverageRequests).values([
    { jurisdictionName: "Greensboro", state: "NC", notes: "Council + Planning", votes: 7 },
    { jurisdictionName: "Asheville", state: "NC", status: "planned", votes: 4 },
  ]);

  console.log("Seed complete.");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
