/**
 * ChamberLens ingestion runners (Cloudflare Workers).
 *
 *  - scheduled(): cron triggers run due platform_configs through the Core
 *    pipeline (logging sync_runs + emitting content_events), then process
 *    instant alerts. Browser-rendered portals are offloaded to a Queue.
 *  - queue(): consumes browser-render + lazy batch-transcription jobs.
 *
 * Everything writes through @repo/db; email goes out via Resend.
 */
import {
  type AlertNotification,
  BudgetGuard,
  createTranscriber,
  ingestConfig,
  type IngestConfigInput,
  type Notifier,
  PostgresSearchIndexer,
  processInstantAlerts,
  type SpendStore,
} from "@repo/core";
import { and, createDb, type Database, eq, schema, sql } from "@repo/db";
import { emailOperator, escapeHtml, sendEmail } from "./email";
import type { Env, IngestJob } from "./env";

const ALERTS_CRON = "*/15 * * * *";

function appUrl(env: Env): string {
  return (env.NEXT_PUBLIC_APP_URL ?? "https://chamberlens.com").replace(/\/$/, "");
}

/** STT spend store backed by summing transcripts.costUsd for the month. */
function spendStore(db: Database): SpendStore {
  return {
    async getSpentUsd(period: string): Promise<number> {
      const [y, m] = period.split("-").map(Number) as [number, number];
      const start = new Date(Date.UTC(y, m - 1, 1));
      const end = new Date(Date.UTC(y, m, 1));
      const rows = await db
        .select({ total: sql<number>`coalesce(sum(${schema.transcripts.costUsd}), 0)` })
        .from(schema.transcripts)
        .where(
          and(
            sql`${schema.transcripts.createdAt} >= ${start}`,
            sql`${schema.transcripts.createdAt} < ${end}`,
          ),
        );
      return Number(rows[0]?.total ?? 0);
    },
    // Spend is recorded as transcripts.costUsd at insert time.
    async addSpendUsd(): Promise<void> {},
  };
}

async function runIngestion(db: Database, env: Env): Promise<void> {
  const indexer = new PostgresSearchIndexer(db);
  const configs = await db.query.platformConfigs.findMany({
    where: eq(schema.platformConfigs.isActive, true),
    with: { jurisdiction: true },
  });

  for (const c of configs) {
    if (c.method === "browser" && env.INGEST_QUEUE) {
      await env.INGEST_QUEUE.send({ type: "browser", configId: c.id });
      continue;
    }
    const token =
      c.apiTokenRef && typeof env[c.apiTokenRef] === "string"
        ? (env[c.apiTokenRef] as string)
        : undefined;
    const input: IngestConfigInput = {
      id: c.id,
      jurisdictionId: c.jurisdictionId,
      platform: c.platform,
      client: c.client,
      apiToken: token,
      bodyExternalIds: c.trackedBodyExternalIds,
      cadence: c.cadence,
      timezone: c.jurisdiction.timezone,
      lastSuccessAt: c.lastSuccessAt,
      options: c.config ?? undefined,
    };
    const run = await ingestConfig(input, {
      db,
      indexer,
      hooks: {
        onUnhealthy: async (r) => {
          await emailOperator(
            env,
            `Adapter unhealthy: ${c.platform}/${c.client}`,
            `<p>Run <code>${r.id}</code> — status=${r.status}, anomalous=${r.anomalous}, notes=${escapeHtml(r.notes ?? "")}</p>`,
          );
        },
      },
    });
    await db
      .update(schema.platformConfigs)
      .set({
        lastSyncedAt: new Date(),
        ...(run.status !== "failed" ? { lastSuccessAt: new Date() } : {}),
      })
      .where(eq(schema.platformConfigs.id, c.id));
  }
}

function alertHtml(n: AlertNotification, env: Env): string {
  return [
    `<h2>${escapeHtml(n.savedSearchName)}</h2>`,
    `<p>New match in <strong>${escapeHtml(n.title)}</strong>:</p>`,
    `<blockquote>${n.snippet}</blockquote>`,
    `<p><a href="${appUrl(env)}${n.deepLink}">View the passage &rarr;</a></p>`,
  ].join("");
}

function makeNotifier(db: Database, env: Env): Notifier {
  return async (n: AlertNotification) => {
    const user = await db.query.users.findFirst({ where: eq(schema.users.id, n.userId) });
    if (!user?.email) return { ok: false, error: "no email on file" };
    return sendEmail(env, user.email, `New match: ${n.savedSearchName}`, alertHtml(n, env));
  };
}

async function runAlerts(db: Database, env: Env): Promise<void> {
  const result = await processInstantAlerts({
    db,
    appUrl: appUrl(env),
    notify: makeNotifier(db, env),
  });
  if (result.failed > 0) {
    await emailOperator(
      env,
      `Alert delivery failures: ${result.failed}`,
      `<p>processed=${result.processed} sent=${result.sent} failed=${result.failed}</p>`,
    );
  }
  const cap = Number(env.STT_MONTHLY_BUDGET_USD ?? 50);
  const guard = new BudgetGuard({
    monthlyCapUsd: cap,
    store: spendStore(db),
    warnAtFraction: 0.8,
    onWarn: async (spent) => {
      await emailOperator(
        env,
        `STT spend at $${spent.toFixed(2)} of $${cap}`,
        `<p>Transcription spend is approaching the monthly cap.</p>`,
      );
    },
  });
  await guard.assertCanSpend(0).catch(() => undefined);
}

async function transcribeMeeting(
  db: Database,
  env: Env,
  meetingId: string,
  videoUrl: string,
): Promise<void> {
  const transcriber = createTranscriber({
    provider: env.STT_PROVIDER,
    deepgramKey: env.DEEPGRAM_API_KEY,
    assemblyaiKey: env.ASSEMBLYAI_API_KEY,
  });
  if (!transcriber) return;

  const existing = await db.query.transcripts.findFirst({
    where: eq(schema.transcripts.meetingId, meetingId),
  });
  if (existing) return; // cached forever — a past meeting never changes

  const cap = Number(env.STT_MONTHLY_BUDGET_USD ?? 50);
  const guard = new BudgetGuard({ monthlyCapUsd: cap, store: spendStore(db) });
  const estimate = guard.estimateUsd(2 * 3600, transcriber.costPerMinuteUsd); // worst-case 2h
  try {
    await guard.assertCanSpend(estimate);
  } catch {
    await emailOperator(
      env,
      "STT budget cap reached",
      `<p>Skipped transcription for meeting ${meetingId}.</p>`,
    );
    return;
  }

  const result = await transcriber.transcribeUrl(videoUrl);
  const inserted = await db
    .insert(schema.transcripts)
    .values({
      meetingId,
      source: "stt",
      provider: transcriber.provider,
      language: result.language ?? "en",
      fullText: result.text,
      durationSeconds: result.durationSeconds ? Math.round(result.durationSeconds) : null,
      costUsd: result.costUsd ?? null,
    })
    .returning({ id: schema.transcripts.id });
  const t = inserted[0];
  if (!t) return;

  if (result.segments.length) {
    await db.insert(schema.transcriptSegments).values(
      result.segments.map((s, i) => ({
        transcriptId: t.id,
        meetingId,
        order: i,
        startMs: s.startMs,
        endMs: s.endMs,
        speaker: s.speaker ?? null,
        text: s.text,
      })),
    );
  }

  const meeting = await db.query.meetings.findFirst({ where: eq(schema.meetings.id, meetingId) });
  if (meeting) {
    await new PostgresSearchIndexer(db).index([
      {
        refType: "transcript",
        refId: t.id,
        meetingId,
        govBodyId: meeting.govBodyId,
        jurisdictionId: meeting.jurisdictionId,
        title: "Transcript",
        body: result.text,
        meetingDate: meeting.scheduledAt,
      },
    ]);
    await db.insert(schema.contentEvents).values({
      type: "new_transcript",
      meetingId,
      govBodyId: meeting.govBodyId,
      jurisdictionId: meeting.jurisdictionId,
      title: meeting.title,
      snippet: result.text.slice(0, 200),
      processed: false,
    });
  }
}

async function handleJob(db: Database, env: Env, job: IngestJob): Promise<void> {
  if (job.type === "transcribe") {
    await transcribeMeeting(db, env, job.meetingId, job.videoUrl);
    return;
  }
  const c = await db.query.platformConfigs.findFirst({
    where: eq(schema.platformConfigs.id, job.configId),
    with: { jurisdiction: true },
  });
  if (!c) return;
  await ingestConfig(
    {
      id: c.id,
      jurisdictionId: c.jurisdictionId,
      platform: c.platform,
      client: c.client,
      cadence: c.cadence,
      timezone: c.jurisdiction.timezone,
      bodyExternalIds: c.trackedBodyExternalIds,
      lastSuccessAt: c.lastSuccessAt,
    },
    {
      db,
      indexer: new PostgresSearchIndexer(db),
      hooks: {
        onUnhealthy: async (r) =>
          emailOperator(
            env,
            `Browser adapter unhealthy: ${c.client}`,
            `<p>${escapeHtml(r.notes ?? "")}</p>`,
          ),
      },
    },
  );
}

export default {
  async scheduled(controller: ScheduledController, env: Env, ctx: ExecutionContext): Promise<void> {
    const db = createDb(env.DATABASE_URL);
    if (controller.cron === ALERTS_CRON) {
      ctx.waitUntil(runAlerts(db, env));
    } else {
      ctx.waitUntil(runIngestion(db, env).then(() => runAlerts(db, env)));
    }
  },

  async queue(batch: MessageBatch<IngestJob>, env: Env): Promise<void> {
    const db = createDb(env.DATABASE_URL);
    for (const msg of batch.messages) {
      try {
        await handleJob(db, env, msg.body);
        msg.ack();
      } catch (err) {
        console.error("[queue] job failed", err);
        msg.retry();
      }
    }
  },

  async fetch(): Promise<Response> {
    return new Response("chamberlens-ingest: ok", { status: 200 });
  },
} satisfies ExportedHandler<Env, IngestJob>;
