"use client";

import * as React from "react";
import { cn } from "../lib/cn";

export interface TranscriptSegmentView {
  startMs: number;
  endMs: number;
  text: string;
  speaker?: string | null;
}

function fmt(ms: number): string {
  const total = Math.floor(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function highlightNodes(text: string, terms: string[]): React.ReactNode {
  if (!terms.length) return text;
  const set = new Set(terms.map((t) => t.toLowerCase()));
  const re = new RegExp(`(${terms.map(escapeRe).join("|")})`, "gi");
  return text.split(re).map((part, i) =>
    set.has(part.toLowerCase()) ? (
      <mark key={i} className="rounded-sm bg-warning-tint px-0.5 text-ink">
        {part}
      </mark>
    ) : (
      <React.Fragment key={i}>{part}</React.Fragment>
    ),
  );
}

/**
 * Searchable transcript with timestamps that deep-link into the video. Clicking
 * a segment seeks the player; `initialSeekMs` (from a result deep-link) auto-
 * seeks and scrolls to the matched passage on mount.
 */
export function TranscriptViewer({
  segments,
  videoUrl,
  query,
  initialSeekMs,
}: {
  segments: TranscriptSegmentView[];
  videoUrl?: string | null;
  query?: string;
  initialSeekMs?: number | null;
}) {
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const [activeIdx, setActiveIdx] = React.useState<number | null>(null);

  const terms = React.useMemo(
    () =>
      query
        ? query
            .toLowerCase()
            .replace(/["'()]/g, " ")
            .split(/\s+/)
            .filter((t) => t.length > 2)
        : [],
    [query],
  );

  const seek = React.useCallback((ms: number, idx: number) => {
    const v = videoRef.current;
    if (v) {
      v.currentTime = ms / 1000;
      void v.play?.().catch(() => {});
    }
    setActiveIdx(idx);
  }, []);

  React.useEffect(() => {
    if (initialSeekMs == null) return;
    const idx = segments.findIndex((s) => initialSeekMs >= s.startMs && initialSeekMs < s.endMs);
    if (idx >= 0) {
      seek(initialSeekMs, idx);
      document.getElementById(`seg-${idx}`)?.scrollIntoView({ block: "center" });
    }
  }, [initialSeekMs, segments, seek]);

  return (
    <div className="flex flex-col gap-4">
      {videoUrl ? (
        <video
          ref={videoRef}
          controls
          preload="metadata"
          src={videoUrl}
          className="aspect-video w-full rounded-lg border border-border bg-ink"
        />
      ) : null}
      <ol className="flex flex-col">
        {segments.map((s, i) => (
          <li key={i} id={`seg-${i}`}>
            <button
              type="button"
              onClick={() => seek(s.startMs, i)}
              className={cn(
                "flex w-full gap-3 rounded-md px-2 py-2 text-left transition-colors hover:bg-surface-muted/60",
                activeIdx === i && "bg-primary-tint",
              )}
            >
              <span className="w-12 shrink-0 pt-0.5 font-mono text-2xs tabular-nums text-primary">
                {fmt(s.startMs)}
              </span>
              <span className="text-sm leading-relaxed text-ink">
                {s.speaker ? (
                  <span className="font-medium text-ink-muted">{s.speaker}: </span>
                ) : null}
                {highlightNodes(s.text, terms)}
              </span>
            </button>
          </li>
        ))}
      </ol>
    </div>
  );
}
