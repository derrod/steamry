import { eq, and } from 'drizzle-orm';
import { db } from '$lib/server/db';
import * as schema from '$lib/server/db/schema';
import fetchGameInfo from '$lib/server/steam/fetch-game-info';

export async function refetchDailyInfo(games: schema.Game[]) {
  try {
    console.log(`\nRefetching game info...`);

    const updates = [];

    for (let i = 0; i < games.length; i++) {
      const gameInfo = await fetchGameInfo(games[i].appid.toString());
      if (!gameInfo) {
        throw new Error(`Could not fetch ${games[i].appid}`);
      }

      updates.push(
        db
          .update(schema.games)
          .set(gameInfo)
          .where(
            and(eq(schema.games.appid, games[i].appid), eq(schema.games.dailyId, games[i].dailyId)),
          ),
      );
    }

    if (updates.length > 0) {
      // Execute all updates in a single batch query (1 subrequest)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await db.batch(updates as any);
    }
    console.log('Done!');
  } catch (err) {
    console.error(err);
  }
}
