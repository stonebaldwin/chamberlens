import { extractText } from "unpdf";
import { fetchWithRetry } from "../util/http";
import { cleanWhitespace, htmlToText } from "../util/text";

export interface ExtractionResult {
  text: string;
  pageCount?: number;
  status: "extracted" | "ocr" | "failed" | "empty";
  mimeType?: string;
}

function looksPdf(mime?: string | null, url?: string): boolean {
  return Boolean(mime?.includes("pdf") || /\.pdf(\b|$|\?)/i.test(url ?? ""));
}
function looksHtml(mime?: string | null, url?: string): boolean {
  return Boolean(mime?.includes("html") || /\.html?(\b|$|\?)/i.test(url ?? ""));
}

/**
 * Extract clean text from a fetched document buffer. PDF text via unpdf (a
 * serverless/Workers-friendly pdf.js build); HTML via the DOM-stripping parser.
 * A PDF that yields no text is almost certainly a scanned image → status "empty"
 * (the OCR fallback hook lands in Phase 6; OCR in-Worker is intentionally
 * deferred to control cost/size).
 */
export async function extractFromBuffer(
  buf: ArrayBuffer,
  mimeType?: string | null,
  url?: string,
): Promise<ExtractionResult> {
  try {
    if (looksPdf(mimeType, url)) {
      const { totalPages, text } = await extractText(new Uint8Array(buf), { mergePages: true });
      const clean = cleanWhitespace(Array.isArray(text) ? text.join("\n") : text);
      return {
        text: clean,
        pageCount: totalPages,
        status: clean.trim() ? "extracted" : "empty",
        mimeType: "application/pdf",
      };
    }
    if (looksHtml(mimeType, url)) {
      const text = htmlToText(new TextDecoder().decode(buf));
      return { text, status: text.trim() ? "extracted" : "empty", mimeType: "text/html" };
    }
    const text = cleanWhitespace(new TextDecoder().decode(buf));
    return { text, status: text.trim() ? "extracted" : "empty" };
  } catch {
    return { text: "", status: "failed" };
  }
}

export async function extractFromUrl(
  url: string,
  mimeType?: string | null,
): Promise<ExtractionResult> {
  const res = await fetchWithRetry(url, { timeoutMs: 30_000 });
  if (!res.ok) return { text: "", status: "failed" };
  const buf = await res.arrayBuffer();
  return extractFromBuffer(buf, mimeType ?? res.headers.get("content-type"), url);
}
