/**
 * Generic entity resolution / dedup. Blocking + fuzzy scoring + a confidence
 * score: exact platform-id match is certain (1.0); otherwise we block by meeting
 * day and fuzzily match the body name. Above `mergeThreshold` → same entity;
 * between thresholds → ambiguous (flag for review); below → new.
 */

export function normalizeForMatch(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Jaro-Winkler string similarity in [0,1]. */
export function jaroWinkler(a: string, b: string): number {
  if (a === b) return 1;
  if (!a.length || !b.length) return 0;
  const matchDistance = Math.max(0, Math.floor(Math.max(a.length, b.length) / 2) - 1);
  const aMatches = new Array<boolean>(a.length).fill(false);
  const bMatches = new Array<boolean>(b.length).fill(false);
  let matches = 0;
  for (let i = 0; i < a.length; i++) {
    const start = Math.max(0, i - matchDistance);
    const end = Math.min(i + matchDistance + 1, b.length);
    for (let j = start; j < end; j++) {
      if (bMatches[j] || a[i] !== b[j]) continue;
      aMatches[i] = true;
      bMatches[j] = true;
      matches++;
      break;
    }
  }
  if (matches === 0) return 0;
  let t = 0;
  let k = 0;
  for (let i = 0; i < a.length; i++) {
    if (!aMatches[i]) continue;
    while (!bMatches[k]) k++;
    if (a[i] !== b[k]) t++;
    k++;
  }
  t /= 2;
  const m = matches;
  const jaro = (m / a.length + m / b.length + (m - t) / m) / 3;
  let prefix = 0;
  for (let i = 0; i < Math.min(4, a.length, b.length); i++) {
    if (a[i] === b[i]) prefix++;
    else break;
  }
  return jaro + prefix * 0.1 * (1 - jaro);
}

export function dayKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export interface MeetingCandidate {
  id: string;
  externalId?: string | null;
  bodyName: string;
  scheduledAt: Date;
}

export interface MeetingIdentity {
  externalId?: string | null;
  bodyName: string;
  scheduledAt: Date;
}

export interface ResolveResult {
  matchId: string | null;
  confidence: number;
  /** true when the score is in the ambiguous band → flag for human review. */
  ambiguous: boolean;
}

export interface ResolveThresholds {
  /** ≥ this → confident merge. */
  merge?: number;
  /** ≥ this (and < merge) → ambiguous. */
  review?: number;
}

export function resolveMeetingIdentity(
  incoming: MeetingIdentity,
  candidates: MeetingCandidate[],
  thresholds: ResolveThresholds = {},
): ResolveResult {
  const merge = thresholds.merge ?? 0.92;
  const review = thresholds.review ?? 0.78;

  // 1) Exact platform id is authoritative.
  if (incoming.externalId) {
    const exact = candidates.find((c) => c.externalId && c.externalId === incoming.externalId);
    if (exact) return { matchId: exact.id, confidence: 1, ambiguous: false };
  }

  // 2) Block by meeting day, then fuzzy-match the body name.
  const day = dayKey(incoming.scheduledAt);
  const incomingBody = normalizeForMatch(incoming.bodyName);
  let best: { id: string; score: number } | null = null;
  for (const c of candidates) {
    if (dayKey(c.scheduledAt) !== day) continue;
    const score = jaroWinkler(incomingBody, normalizeForMatch(c.bodyName));
    if (!best || score > best.score) best = { id: c.id, score };
  }
  if (!best) return { matchId: null, confidence: 0, ambiguous: false };
  if (best.score >= merge) return { matchId: best.id, confidence: best.score, ambiguous: false };
  if (best.score >= review) return { matchId: best.id, confidence: best.score, ambiguous: true };
  return { matchId: null, confidence: best.score, ambiguous: false };
}
