import type { Transcriber, TranscriptionResult, TranscriptSegment } from "./types";

interface AaiUtterance {
  start: number; // ms
  end: number; // ms
  text: string;
  speaker?: string;
}
export interface AaiTranscript {
  id: string;
  status: "queued" | "processing" | "completed" | "error";
  text?: string;
  error?: string;
  audio_duration?: number; // seconds
  utterances?: AaiUtterance[] | null;
}

export const AAI_COST_PER_MIN = 0.0025; // batch (approx)

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Pure response → result mapping (AssemblyAI timestamps are already ms). */
export function parseAssemblyAI(t: AaiTranscript, language = "en"): TranscriptionResult {
  const segments: TranscriptSegment[] = (t.utterances ?? []).map((u) => ({
    startMs: u.start,
    endMs: u.end,
    text: u.text,
    speaker: u.speaker ?? null,
  }));
  const duration = t.audio_duration ?? 0;
  return {
    text: t.text ?? "",
    segments,
    durationSeconds: duration,
    language,
    provider: "assemblyai",
    costUsd: (duration / 60) * AAI_COST_PER_MIN,
  };
}

export function createAssemblyAITranscriber(
  apiKey: string,
  opts?: { pollIntervalMs?: number; maxWaitMs?: number },
): Transcriber {
  const pollIntervalMs = opts?.pollIntervalMs ?? 5_000;
  const maxWaitMs = opts?.maxWaitMs ?? 30 * 60 * 1_000;
  return {
    provider: "assemblyai",
    costPerMinuteUsd: AAI_COST_PER_MIN,
    async transcribeUrl(url, o) {
      const submit = await fetch("https://api.assemblyai.com/v2/transcript", {
        method: "POST",
        headers: { authorization: apiKey, "content-type": "application/json" },
        body: JSON.stringify({ audio_url: url, speaker_labels: true, language_code: o?.language }),
        signal: o?.signal,
      });
      if (!submit.ok) {
        throw new Error(
          `AssemblyAI submit ${submit.status}: ${await submit.text().catch(() => "")}`,
        );
      }
      const { id } = (await submit.json()) as AaiTranscript;

      const deadline = Date.now() + maxWaitMs;
      for (;;) {
        if (o?.signal?.aborted) throw new Error("AssemblyAI transcription aborted");
        const poll = await fetch(`https://api.assemblyai.com/v2/transcript/${id}`, {
          headers: { authorization: apiKey },
          signal: o?.signal,
        });
        if (!poll.ok) throw new Error(`AssemblyAI poll ${poll.status}`);
        const t = (await poll.json()) as AaiTranscript;
        if (t.status === "completed") return parseAssemblyAI(t, o?.language);
        if (t.status === "error") throw new Error(`AssemblyAI error: ${t.error ?? "unknown"}`);
        if (Date.now() > deadline) throw new Error("AssemblyAI transcription timed out");
        await sleep(pollIntervalMs);
      }
    },
  };
}
