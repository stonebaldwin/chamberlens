export type SttProvider = "deepgram" | "assemblyai" | "whisper";

export interface TranscriptSegment {
  startMs: number;
  endMs: number;
  text: string;
  speaker?: string | null;
}

export interface TranscriptionResult {
  text: string;
  segments: TranscriptSegment[];
  durationSeconds?: number;
  language?: string;
  provider: SttProvider;
  costUsd?: number;
}

export interface TranscribeOptions {
  language?: string;
  signal?: AbortSignal;
}

/**
 * Batch (async) speech-to-text behind one interface so the provider is
 * swappable. Always batch, never streaming — we never need real-time and batch
 * is ~40-50% cheaper. Transcripts are cached forever (a past meeting never
 * changes).
 */
export interface Transcriber {
  provider: SttProvider;
  costPerMinuteUsd: number;
  transcribeUrl(url: string, opts?: TranscribeOptions): Promise<TranscriptionResult>;
}
