/**
 * Live smoke test of the Legistar adapter against the public Web API.
 * Run: pnpm --filter @repo/core exec tsx scripts/smoke-legistar.ts [client]
 */
import { legistarAdapter } from "../src/adapters/legistar";
import type { JurisdictionConfig } from "../src/adapters/types";

const client = process.argv[2] ?? "seattle";
const config: JurisdictionConfig = {
  jurisdictionId: "smoke",
  platform: "legistar",
  client,
  cadence: "daily",
  timezone: "America/Los_Angeles",
  options: { maxEvents: 3 },
};

const raws = await legistarAdapter.fetchRaw(config);
console.log(`Legistar "${client}": fetched ${raws.length} events\n`);
for (const ev of raws.slice(0, 3)) {
  const m = legistarAdapter.normalize(ev, config);
  console.log(
    `- ${m.title} | ${m.scheduledAt.toISOString()} | items=${m.agendaItems.length} docs=${m.documents.length}\n    ${m.sourceUrl}`,
  );
}
