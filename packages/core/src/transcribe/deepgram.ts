import type { Transcriber, TranscriptionResult, TranscriptSegment } from "./types";

interface DeepgramUtterance {
  start: number;
  end: number;
  transcript: string;
  speaker?: number;
}
interface DeepgramWord {
  word: string;
  start: number;
  end: number;
  punctuated_word?: string;
}
export interface DeepgramResponse {
  metadata?: { duration?: number };
  results?: {
    utterances?: DeepgramUtterance[];
    channels?: { alternatives?: { transcript?: string; words?: DeepgramWord[] }[] }[];
  };
}

export const DEEPGRAM_COST_PER_MIN = 0.0043; // Nova-3 batch (approx)

function groupWords(words: DeepgramWord[], maxGapMs = 1500, maxLen = 280): TranscriptSegment[] {
  const segs: TranscriptSegment[] = [];
  let cur: { startMs: number; endMs: number; words: string[] } | null = null;
  for (const w of words) {
    const startMs = Math.round(w.start * 1000);
    const endMs = Math.round(w.end * 1000);
    const word = w.punctuated_word ?? w.word;
    if (cur && startMs - cur.endMs <= maxGapMs && cur.words.join(" ").length < maxLen) {
      cur.endMs = endMs;
      cur.words.push(word);
    } else {
      if (cur) segs.push({ startMs: cur.startMs, endMs: cur.endMs, text: cur.words.join(" ") });
      cur = { startMs, endMs, words: [word] };
    }
  }
  if (cur) segs.push({ startMs: cur.startMs, endMs: cur.endMs, text: cur.words.join(" ") });
  return segs;
}

/** Pure response → result mapping (utterances preferred, else grouped words). */
export function parseDeepgram(data: DeepgramResponse, language = "en"): TranscriptionResult {
  const alt = data.results?.channels?.[0]?.alternatives?.[0];
  const utterances = data.results?.utterances ?? [];
  const segments: TranscriptSegment[] = utterances.length
    ? utterances.map((u) => ({
        startMs: Math.round(u.start * 1000),
        endMs: Math.round(u.end * 1000),
        text: u.transcript,
        speaker: u.speaker != null ? String(u.speaker) : null,
      }))
    : groupWords(alt?.words ?? []);
  const duration = data.metadata?.duration ?? (segments.at(-1)?.endMs ?? 0) / 1000;
  const text = alt?.transcript ?? segments.map((s) => s.text).join(" ");
  return {
    text,
    segments,
    durationSeconds: duration,
    language,
    provider: "deepgram",
    costUsd: (duration / 60) * DEEPGRAM_COST_PER_MIN,
  };
}

export function createDeepgramTranscriber(apiKey: string): Transcriber {
  return {
    provider: "deepgram",
    costPerMinuteUsd: DEEPGRAM_COST_PER_MIN,
    async transcribeUrl(url, opts) {
      const params = new URLSearchParams({
        model: "nova-3",
        smart_format: "true",
        punctuate: "true",
        utterances: "true",
      });
      if (opts?.language) params.set("language", opts.language);
      const res = await fetch(`https://api.deepgram.com/v1/listen?${params.toString()}`, {
        method: "POST",
        headers: { authorization: `Token ${apiKey}`, "content-type": "application/json" },
        body: JSON.stringify({ url }),
        signal: opts?.signal,
      });
      if (!res.ok) {
        throw new Error(`Deepgram ${res.status}: ${await res.text().catch(() => "")}`);
      }
      return parseDeepgram((await res.json()) as DeepgramResponse, opts?.language);
    },
  };
}
