export * from "./types";
export * from "./budget";
export {
  createDeepgramTranscriber,
  parseDeepgram,
  DEEPGRAM_COST_PER_MIN,
  type DeepgramResponse,
} from "./deepgram";
export {
  createAssemblyAITranscriber,
  parseAssemblyAI,
  AAI_COST_PER_MIN,
  type AaiTranscript,
} from "./assemblyai";

import { createAssemblyAITranscriber } from "./assemblyai";
import { createDeepgramTranscriber } from "./deepgram";
import type { SttProvider, Transcriber } from "./types";

export interface TranscriberEnv {
  provider?: string;
  deepgramKey?: string;
  assemblyaiKey?: string;
}

/** Pick a transcriber from env config, or null if none is configured. */
export function createTranscriber(env: TranscriberEnv): Transcriber | null {
  const provider =
    (env.provider as SttProvider | undefined) ??
    (env.deepgramKey ? "deepgram" : env.assemblyaiKey ? "assemblyai" : undefined);
  if (provider === "deepgram" && env.deepgramKey) return createDeepgramTranscriber(env.deepgramKey);
  if (provider === "assemblyai" && env.assemblyaiKey)
    return createAssemblyAITranscriber(env.assemblyaiKey);
  return null;
}
