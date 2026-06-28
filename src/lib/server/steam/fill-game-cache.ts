import { eq, min, max, count } from 'drizzle-orm';
import { MAX_ERROR_LENGTH } from '$lib';
import { db } from '../db';
import * as schema from '../db/schema';
import { saveEventLog } from '../event-logs';
import fetchGameInfo from './fetch-game-info';

const MAX_ATTEMPTS = 25;

export default async function fillGameCache(): Promise<void> {
  try {
    const countResult = await db.select({ count: count() }).from(schema.gameCache);
    const currentCount = countResult[0]?.count ?? 0;

    if (currentCount >= 100) {
      console.log(`Game cache has ${currentCount} rows. No need to fill.`);
      return;
    }

    const amountNeeded = 25;
    console.log(
      `Game cache has ${currentCount} rows. Fetching ${amountNeeded} games to fill cache...`,
    );

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
      throw new Error('minId or maxId is null');
    }

    let addedCount = 0;
    let attempts = 0;
    const usedIds: number[] = [];

    while (addedCount < amountNeeded) {
      attempts += 1;
      if (attempts > MAX_ATTEMPTS) {
        console.warn(`Exceeded ${MAX_ATTEMPTS} attempts while filling game cache`);
        break;
      }

      const id = Math.floor(Math.random() * (maxId - minId + 1)) + minId;

      if (usedIds.includes(id)) {
        continue;
      }
      usedIds.push(id);

      const steamApp = await db.query.steamApps.findFirst({ where: eq(schema.steamApps.id, id) });
      if (!steamApp) {
        continue;
      }

      // Check if appid is already in gameCache
      const existingInCache = await db.query.gameCache.findFirst({
        where: eq(schema.gameCache.appid, steamApp.appid),
      });
      if (existingInCache) {
        continue;
      }

      const game = await fetchGameInfo(steamApp.appid.toString());
      if (!game) {
        continue;
      }

      // Write to game_cache DB
      await db.insert(schema.gameCache).values({
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

      addedCount += 1;
    }

    await saveEventLog('fill-game-cache-finished', {
      added: addedCount,
      totalCount: currentCount + addedCount,
    });
    console.log(`Successfully filled game cache with ${addedCount} games.`);
  } catch (err) {
    console.error('Error filling game cache:', err);
    try {
      await saveEventLog('fill-game-cache-failed', {
        message: String(err).substring(0, MAX_ERROR_LENGTH),
      });
    } catch (e) {
      console.error(e);
    }
  }
}
