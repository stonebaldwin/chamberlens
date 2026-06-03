import type { ReactNode } from "react";

export function InfoPage({
  title,
  updated,
  children,
}: {
  title: string;
  updated?: string;
  children: ReactNode;
}) {
  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="text-2xl font-semibold tracking-tight text-ink">{title}</h1>
      {updated ? <p className="mt-1 text-2xs text-ink-subtle">Last updated {updated}</p> : null}
      <div className="mt-6 flex flex-col gap-4 text-sm leading-relaxed text-ink-muted [&_a]:text-primary [&_a]:underline [&_h2]:mt-4 [&_h2]:text-base [&_h2]:font-semibold [&_h2]:text-ink">
        {children}
      </div>
    </main>
  );
}
