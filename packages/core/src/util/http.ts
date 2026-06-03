/** Polite, resilient HTTP helpers shared by every adapter. */

export const USER_AGENT =
  "ChamberLensBot/0.1 (+https://example.com/about/crawler; public civic-records aggregator)";

export class HttpError extends Error {
  constructor(
    message: string,
    readonly status?: number,
    readonly url?: string,
  ) {
    super(message);
    this.name = "HttpError";
  }
}

export interface HttpOptions {
  timeoutMs?: number;
  retries?: number;
  retryDelayMs?: number;
  headers?: Record<string, string>;
  signal?: AbortSignal;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function retryDelay(base: number, attempt: number, res?: Response): number {
  // Honor Retry-After when present, else exponential backoff with light jitter.
  const retryAfter = res?.headers.get("retry-after");
  if (retryAfter) {
    const secs = Number(retryAfter);
    if (Number.isFinite(secs)) return secs * 1000;
  }
  return base * 2 ** attempt + attempt * 50;
}

/**
 * fetch() with timeout, bounded retries (on network errors, 429, and 5xx),
 * exponential backoff, and a polite default User-Agent.
 */
export async function fetchWithRetry(url: string, opts: HttpOptions = {}): Promise<Response> {
  const { timeoutMs = 20_000, retries = 3, retryDelayMs = 500, headers, signal } = opts;
  let lastErr: unknown;

  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const onAbort = () => controller.abort();
    if (signal) signal.addEventListener("abort", onAbort, { once: true });
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, {
        headers: { "user-agent": USER_AGENT, accept: "application/json, */*", ...headers },
        signal: controller.signal,
      });
      if ((res.status === 429 || res.status >= 500) && attempt < retries) {
        await sleep(retryDelay(retryDelayMs, attempt, res));
        continue;
      }
      return res;
    } catch (err) {
      lastErr = err;
      if (attempt < retries) {
        await sleep(retryDelay(retryDelayMs, attempt));
        continue;
      }
    } finally {
      clearTimeout(timer);
      if (signal) signal.removeEventListener("abort", onAbort);
    }
  }
  throw new HttpError(
    `Request failed after ${retries + 1} attempt(s): ${String(lastErr)}`,
    undefined,
    url,
  );
}

export async function fetchJson<T>(url: string, opts?: HttpOptions): Promise<T> {
  const res = await fetchWithRetry(url, opts);
  if (!res.ok) throw new HttpError(`HTTP ${res.status} for ${url}`, res.status, url);
  return (await res.json()) as T;
}

export async function fetchText(url: string, opts?: HttpOptions): Promise<string> {
  const res = await fetchWithRetry(url, opts);
  if (!res.ok) throw new HttpError(`HTTP ${res.status} for ${url}`, res.status, url);
  return res.text();
}

/** Minimum-interval throttle for polite per-host request spacing. */
export class Throttle {
  private last = 0;
  constructor(private readonly minIntervalMs: number) {}
  async wait(): Promise<void> {
    const now = Date.now();
    const waitMs = Math.max(0, this.last + this.minIntervalMs - now);
    if (waitMs > 0) await sleep(waitMs);
    this.last = Date.now();
  }
}
