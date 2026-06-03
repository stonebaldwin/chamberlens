"use server";

import { revalidatePath } from "next/cache";
import type { AlertFrequency } from "@/lib/data/user-store";
import { getUserStore } from "@/lib/data/user-store";
import { getEntitlements } from "@/lib/entitlements";
import { requireUser } from "@/lib/session";

export async function createSavedSearchAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const store = getUserStore();
  const name = String(formData.get("name") ?? "").trim();
  const query = String(formData.get("query") ?? "").trim();
  if (!name || !query) return;

  const ent = getEntitlements(user.plan);
  const existing = await store.listSavedSearches(user.id);
  if (ent.maxSavedSearches >= 0 && existing.length >= ent.maxSavedSearches) return;

  const wantsAlert = formData.get("isAlert") === "on";
  const requested = String(formData.get("frequency") ?? "instant") as AlertFrequency;
  await store.createSavedSearch(user.id, {
    name,
    query,
    isAlert: ent.alertsEnabled ? wantsAlert : false,
    frequency: ent.digestOnly ? "weekly" : requested,
  });
  revalidatePath("/dashboard/searches");
  revalidatePath("/dashboard");
}

export async function toggleAlert(id: string, isAlert: boolean): Promise<void> {
  const user = await requireUser();
  const ent = getEntitlements(user.plan);
  await getUserStore().updateSavedSearch(user.id, id, {
    isAlert: ent.alertsEnabled ? isAlert : false,
  });
  revalidatePath("/dashboard/searches");
  revalidatePath("/dashboard");
}

export async function setFrequency(id: string, frequency: AlertFrequency): Promise<void> {
  const user = await requireUser();
  await getUserStore().updateSavedSearch(user.id, id, { frequency });
  revalidatePath("/dashboard/searches");
}

export async function removeSavedSearch(id: string): Promise<void> {
  const user = await requireUser();
  await getUserStore().deleteSavedSearch(user.id, id);
  revalidatePath("/dashboard/searches");
  revalidatePath("/dashboard");
}
