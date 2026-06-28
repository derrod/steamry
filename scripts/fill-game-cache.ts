import { min, max, count, inArray } from 'drizzle-orm';
import { db, initLocalDb } from '../src/lib/server/db';
import * as schema from '../src/lib/server/db/schema';
import fetchGameInfo from '../src/lib/server/steam/fetch-game-info';

initLocalDb();

async function fillCacheLocally() {
  try {
    const countResult = await db.select({ count: count() }).from(schema.gameCache);
    let currentCount = countResult[0]?.count ?? 0;

    const TARGET = 20;
    if (currentCount >= TARGET) {
      console.log(`Game cache already has ${currentCount} items. (Target: ${TARGET})`);
      return;
    }

    console.log(`Current cache size: ${currentCount}. Filling to ${TARGET} items...`);

    const minMaxIdResult = (
      await db
        .select({
          minId: min(schema.steamApps.id),
          maxId: max(schema.steamApps.id),
        })
        .from(schema.steamApps)
    )[0];

    const { minId, maxId } = minMaxIdResult;
    if (minId === null || maxId === null) {
      throw new Error('No apps found in steam_apps table. Run games:fetch first.');
    }

    while (currentCount < TARGET) {
      const needed = TARGET - currentCount;
      console.log(`Cache needs ${needed} more games.`);

      // Generate random app IDs
      const randomIds: number[] = [];
      const usedIds = new Set<number>();
      for (let i = 0; i < needed * 3; i++) {
        const id = Math.floor(Math.random() * (maxId - minId + 1)) + minId;
        if (!usedIds.has(id)) {
          usedIds.add(id);
          randomIds.push(id);
        }
      }

      if (randomIds.length === 0) {
        break;
      }

      // Fetch candidates from steamApps
      const steamApps = await db
        .select()
        .from(schema.steamApps)
        .where(inArray(schema.steamApps.id, randomIds));

      if (steamApps.length === 0) {
        continue;
      }

      const appids = steamApps.map((app) => app.appid);
      const existingCacheEntries = await db
        .select({ appid: schema.gameCache.appid })
        .from(schema.gameCache)
        .where(inArray(schema.gameCache.appid, appids));

      const existingAppids = new Set(existingCacheEntries.map((entry) => entry.appid));
      const candidates = steamApps.filter((app) => !existingAppids.has(app.appid));

      console.log(`Processing ${candidates.length} candidate apps...`);

      const gamesToInsert: schema.NewGameCache[] = [];

      for (const steamApp of candidates) {
        if (currentCount + gamesToInsert.length >= TARGET) {
          break;
        }

        console.log(`Fetching game: ${steamApp.name} (appid: ${steamApp.appid})`);
        try {
          const game = await fetchGameInfo(steamApp.appid.toString());
          if (game) {
            gamesToInsert.push({
              appid: game.appid,
              name: game.name,
              reviewsPositive: game.reviewsPositive,
              reviewsNegative: game.reviewsNegative,
              description: game.description,
              price: game.price,
              releaseDate: game.releaseDate,
              headerImage: game.headerImage,
              developers: game.developers,
              publishers: game.publishers,
              tags: game.tags,
              categories: game.categories,
              genres: game.genres,
              screenshots: game.screenshots,
              trailers: game.trailers,
              contentDescriptors: game.contentDescriptors,
              requiredAge: game.requiredAge,
              markedAsNsfw: game.markedAsNsfw,
              isHandPicked: game.isHandPicked,
            });
            console.log(`Successfully fetched and queued: ${game.name}`);
          }
        } catch (e) {
          console.error(`Failed to fetch info for appid ${steamApp.appid}:`, e);
        }

        // Wait a tiny bit between calls to be nice to Steam API
        await new Promise((resolve) => setTimeout(resolve, 200));
      }

      if (gamesToInsert.length > 0) {
        console.log(`Inserting ${gamesToInsert.length} games into local cache...`);
        await db.insert(schema.gameCache).values(gamesToInsert);
        currentCount += gamesToInsert.length;
      }
    }

    console.log(`Done! Cache successfully filled with ${currentCount} items.`);
  } catch (err) {
    console.error('Error filling local game cache:', err);
  }
}

await fillCacheLocally();
process.exit(0);
