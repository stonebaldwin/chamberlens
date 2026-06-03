import Link from "next/link";
import { Lock } from "lucide-react";
import { buttonVariants, EmptyState } from "@repo/ui";

export function UpgradeGate({ feature, need }: { feature: string; need: string }) {
  return (
    <EmptyState
      icon={<Lock />}
      title={`${feature} is a ${need} feature`}
      description={`Upgrade to the ${need} plan to unlock ${feature.toLowerCase()}.`}
      action={
        <Link href="/pricing" className={buttonVariants({ size: "sm" })}>
          See the {need} plan
        </Link>
      }
    />
  );
}
