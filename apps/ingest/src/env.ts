export type IngestJob =
  | { type: "browser"; configId: string }
  | { type: "transcribe"; meetingId: string; videoUrl: string };

export interface Env {
  DATABASE_URL: string;
  RESEND_API_KEY?: string;
  EMAIL_FROM?: string;
  OPERATOR_EMAIL?: string;
  NEXT_PUBLIC_APP_URL?: string;
  STT_PROVIDER?: string;
  DEEPGRAM_API_KEY?: string;
  ASSEMBLYAI_API_KEY?: string;
  STT_MONTHLY_BUDGET_USD?: string;
  INGEST_QUEUE?: Queue<IngestJob>;
  // Browser Rendering binding (added in wrangler when JS-rendered portals are enabled).
  BROWSER?: unknown;
  // Allows resolving a per-jurisdiction API token by its env-var name (apiTokenRef).
  [key: string]: unknown;
}
