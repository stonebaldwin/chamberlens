"use client";

import { useEffect } from "react";
import Link from "next/link";
import { buttonVariants } from "@repo/ui";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="mx-auto flex max-w-xl flex-col items-center gap-4 px-6 py-24 text-center">
      <h1 className="text-2xl font-semibold tracking-tight text-ink">Something went wrong</h1>
      <p className="text-sm text-ink-muted">
        An unexpected error occurred.{" "}
        {error.digest ? <code className="font-mono text-2xs">({error.digest})</code> : null}
      </p>
      <div className="flex gap-2">
        <button type="button" onClick={reset} className={buttonVariants({ size: "sm" })}>
          Try again
        </button>
        <Link href="/" className={buttonVariants({ variant: "secondary", size: "sm" })}>
          Go home
        </Link>
      </div>
    </main>
  );
}
