// Placeholder seed. Real demo data (jurisdictions, sample meetings, documents)
// arrives with the Phase 2 schema and the Phase 7 reviewable-demo dataset.
async function main(): Promise<void> {
  console.log(
    "[seed] No-op for now — real seed data arrives with the Phase 2 schema and Phase 7 demo data.",
  );
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
