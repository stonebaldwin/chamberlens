import { describe, expect, it } from "vitest";
import { sanitizeSnippet } from "./text";

describe("sanitizeSnippet", () => {
  it("returns empty string for nullish/empty input", () => {
    expect(sanitizeSnippet(null)).toBe("");
    expect(sanitizeSnippet(undefined)).toBe("");
    expect(sanitizeSnippet("")).toBe("");
  });

  it("preserves <mark> highlight tags", () => {
    expect(sanitizeSnippet("a <mark>rezoning</mark> hearing")).toBe(
      "a <mark>rezoning</mark> hearing",
    );
  });

  it("escapes script/markup from untrusted source text (stored XSS)", () => {
    const out = sanitizeSnippet('<img src=x onerror=alert(1)> and <script>alert(2)</script>');
    expect(out).not.toContain("<img");
    expect(out).not.toContain("<script>");
    expect(out).toContain("&lt;img");
    expect(out).toContain("&lt;script&gt;");
  });

  it("escapes a </script>-style breakout while keeping marks", () => {
    expect(sanitizeSnippet("<mark>x</mark></script><b>y</b>")).toBe(
      "<mark>x</mark>&lt;/script&gt;&lt;b&gt;y&lt;/b&gt;",
    );
  });

  it("escapes ampersands", () => {
    expect(sanitizeSnippet("Tom & Jerry")).toBe("Tom &amp; Jerry");
  });
});
