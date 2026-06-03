"use client";

import { useRouter } from "next/navigation";
import { AlertBuilder, useToast } from "@repo/ui";

export function NewAlertClient({ query, scopeSummary }: { query: string; scopeSummary?: string }) {
  const router = useRouter();
  const { toast } = useToast();
  return (
    <AlertBuilder
      query={query}
      scopeSummary={scopeSummary}
      onCreate={() => {
        toast({
          title: "Create a free account to save alerts",
          description: "It takes a few seconds.",
          variant: "info",
        });
        router.push("/login?intent=signup");
      }}
    />
  );
}
