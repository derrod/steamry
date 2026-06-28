import { initLocalDb } from '../src/lib/server/db';
import fetchApps from '../src/lib/server/steam/fetch-apps';

initLocalDb();

await fetchApps();

process.exit(0);
