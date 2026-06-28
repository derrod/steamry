import { initLocalDb } from '../src/lib/server/db';
import makeNewDaily from '../src/lib/server/daily/make-new-daily';

initLocalDb();

async function main() {
  const startStr = process.argv[2];
  const endStr = process.argv[3];

  if (!startStr || !endStr) {
    console.error("Usage: npm run db:backfill <start-date YYYY-MM-DD> <end-date YYYY-MM-DD>");
    process.exit(1);
  }

  const start = new Date(startStr);
  const end = new Date(endStr);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    console.error("Error: Invalid date format. Please use YYYY-MM-DD.");
    process.exit(1);
  }

  if (start > end) {
    console.error("Error: Start date cannot be after end date.");
    process.exit(1);
  }

  console.log(`Backfilling daily challenges from ${start.toISOString().split('T')[0]} to ${end.toISOString().split('T')[0]}...`);

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const currentDate = new Date(d);
    await makeNewDaily(currentDate);
  }

  console.log("Backfill complete!");
  process.exit(0);
}

main().catch((err) => {
  console.error("Fatal error during backfill:", err);
  process.exit(1);
});
