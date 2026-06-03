import { parse } from "node-html-parser";

const STOPWORDS = new Set([
  "the",
  "and",
  "for",
  "with",
  "that",
  "this",
  "from",
  "are",
  "was",
  "were",
  "will",
  "have",
  "has",
  "not",
  "but",
  "you",
  "your",
  "all",
  "any",
  "can",
]);

const NBSP = String.fromCharCode(160);
const COMBINING_MARKS = new RegExp("[\\u0300-\\u036f]", "g");

/** Collapse whitespace and normalize newlines without destroying paragraphs. */
export function cleanWhitespace(s: string): string {
  return s
    .split(NBSP)
    .join(" ")
    .replace(/\r\n/g, "\n")
    .replace(/[\t ]+/g, " ")
    .replace(/ *\n */g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** Extract readable text from an HTML document, dropping scripts/styles/nav. */
export function htmlToText(html: string): string {
  const root = parse(html, { comment: false });
  root.querySelectorAll("script, style, noscript, svg, head").forEach((n) => n.remove());
  return cleanWhitespace(root.text);
}

export function truncate(s: string, maxLen: number): string {
  if (s.length <= maxLen) return s;
  return s.slice(0, maxLen).replace(/\s+\S*$/, "") + "…";
}

/**
 * Build a plain-text snippet centered on the first matching query term. Used for
 * alert emails and non-DB contexts; the search UI uses Postgres ts_headline.
 */
export function makeSnippet(text: string, query: string, maxLen = 240): string {
  const clean = cleanWhitespace(text).replace(/\n/g, " ");
  if (!query.trim()) return truncate(clean, maxLen);

  const terms = query
    .toLowerCase()
    .replace(/["'()]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 2 && !STOPWORDS.has(t));

  const lower = clean.toLowerCase();
  let idx = -1;
  for (const term of terms) {
    const i = lower.indexOf(term);
    if (i >= 0 && (idx < 0 || i < idx)) idx = i;
  }
  if (idx < 0) return truncate(clean, maxLen);

  const start = Math.max(0, idx - Math.floor(maxLen / 3));
  const slice = clean.slice(start, start + maxLen).trim();
  return (start > 0 ? "…" : "") + slice + (start + maxLen < clean.length ? "…" : "");
}

/** URL/slug-safe identifier from a name. */
export function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(COMBINING_MARKS, "")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-");
}
