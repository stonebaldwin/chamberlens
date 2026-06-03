import { cn } from "@repo/ui";

/**
 * ChamberLens mark: a columned civic building (the "chamber") observed through
 * a lens / aperture ring (the "lens"). Strokes use `currentColor` so it adapts
 * to whatever surface it sits on.
 */
export function ChamberLensMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={className}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* lens / aperture ring */}
      <circle cx="12" cy="12" r="9.1" stroke="currentColor" strokeWidth="1.4" opacity="0.85" />
      {/* pediment roof */}
      <path d="M6.7 10.4 L12 6.7 L17.3 10.4" stroke="currentColor" strokeWidth="1.5" />
      {/* columns */}
      <path d="M8.4 10.9 V14.9" stroke="currentColor" strokeWidth="1.5" />
      <path d="M12 10.9 V14.9" stroke="currentColor" strokeWidth="1.5" />
      <path d="M15.6 10.9 V14.9" stroke="currentColor" strokeWidth="1.5" />
      {/* base */}
      <path d="M7.2 15.5 H16.8" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

/**
 * Mark in its evergreen tile + the serif wordmark. Used in the header masthead
 * and footer. `subtle` renders the wordmark in muted ink (for the footer).
 */
export function ChamberLensWordmark({
  className,
  tileClassName,
  subtle = false,
}: {
  className?: string;
  tileClassName?: string;
  subtle?: boolean;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <span
        className={cn(
          "flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground shadow-xs",
          tileClassName,
        )}
      >
        <ChamberLensMark className="size-[1.15rem]" />
      </span>
      <span
        className={cn(
          "font-serif text-[1.2rem] font-semibold leading-none tracking-tight",
          subtle ? "text-ink" : "text-ink",
        )}
      >
        Chamber<span className="text-primary">Lens</span>
      </span>
    </span>
  );
}
