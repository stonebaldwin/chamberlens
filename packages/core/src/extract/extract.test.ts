import { describe, expect, it } from "vitest";
import { extractFromBuffer } from "./index";

const enc = (s: string) => new TextEncoder().encode(s).buffer as ArrayBuffer;

describe("extractFromBuffer", () => {
  it("extracts readable text from HTML, dropping scripts/styles", async () => {
    const html = `<html><head><style>.a{color:red}</style></head>
      <body><h1>Rezoning Hearing</h1><script>evil()</script><p>5th Avenue &amp; Main</p></body></html>`;
    const r = await extractFromBuffer(enc(html), "text/html", "https://x/page.html");
    expect(r.status).toBe("extracted");
    expect(r.text).toContain("Rezoning Hearing");
    expect(r.text).toContain("5th Avenue & Main");
    expect(r.text).not.toContain("evil");
  });

  it("treats empty content as empty", async () => {
    const r = await extractFromBuffer(enc("   "), "text/plain", "https://x/blank.txt");
    expect(r.status).toBe("empty");
  });
});
