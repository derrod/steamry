import { min, max, count, inArray } from 'drizzle-orm';
import { MAX_ERROR_LENGTH } from '$lib';
import { db } from '../db';
import * as schema from '../db/schema';
import { saveEventLog } from '../event-logs';
import fetchGameInfo from './fetch-game-info';

export default async function fillGameCache(): Promise<void> {
  try {
    const countResult = await db.select({ count: count() }).from(schema.gameCache);
    const currentCount = countResult[0]?.count ?? 0;

    if (currentCount >= 100) {
      console.log(`Game cache has ${currentCount} rows. No need to fill.`);
      return;
    }

    // Since we are limited to 50 subrequests per invocation on Cloudflare Workers,
    // and each fetchGameInfo takes 3 subrequests (Steam Store, Reviews, and SteamSpy APIs),
    // we want to fetch at most 14 successfully parsed games in one run to stay safely under the limit.
    const amountNeeded = Math.min(14, 100 - currentCount);
    console.log(
      `Game cache has ${currentCount} rows. Fetching up to ${amountNeeded} games to fill cache...`,
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

    const randomIds: number[] = [];
    const usedIds = new Set<number>();
    const candidateFetchSize = amountNeeded * 3;

    for (let i = 0; i < candidateFetchSize; i++) {
      const id = Math.floor(Math.random() * (maxId - minId + 1)) + minId;
      if (!usedIds.has(id)) {
        usedIds.add(id);
        randomIds.push(id);
      }
    }

    if (randomIds.length === 0) {
      console.log('No random IDs generated.');
      return;
    }

    const steamApps = await db
      .select()
      .from(schema.steamApps)
      .where(inArray(schema.steamApps.id, randomIds));

    if (steamApps.length === 0) {
      console.log('No steam apps found for the generated IDs.');
      return;
    }

    const appids = steamApps.map((app) => app.appid);

    const existingCacheEntries = await db
      .select({ appid: schema.gameCache.appid })
      .from(schema.gameCache)
      .where(inArray(schema.gameCache.appid, appids));

    const existingAppids = new Set(existingCacheEntries.map((entry) => entry.appid));

    // Filter candidate list to only those not in the cache
    const candidates = steamApps.filter((app) => !existingAppids.has(app.appid));

    console.log(`Found ${candidates.length} unique candidates not currently in cache.`);

    const gamesToInsert: schema.NewGameCache[] = [];
    let subrequestCount = 4; // countResult, minMaxIdResult, steamApps query, existingCacheEntries query

    for (const steamApp of candidates) {
      if (gamesToInsert.length >= amountNeeded) {
        break;
      }
      // If we are getting too close to the 50 subrequest limit (e.g. 45), stop processing.
      // fetchGameInfo takes 3 subrequests (Store details, reviews, and tags), and inserting takes 1.
      if (subrequestCount + 4 >= 50) {
        console.warn(
          `Approaching Cloudflare subrequest limit (${subrequestCount}). Stopping batch.`,
        );
        break;
      }

      console.log(`Fetching game info for appid: ${steamApp.appid} (${steamApp.name})`);
      subrequestCount += 3; // fetchGameInfo calls 3 APIs
      const game = await fetchGameInfo(steamApp.appid.toString());
      if (!game) {
        continue;
      }

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
    }

    if (gamesToInsert.length > 0) {
      console.log(`Inserting ${gamesToInsert.length} games into cache...`);
      // Batch insert the games in 1 subrequest
      await db.insert(schema.gameCache).values(gamesToInsert);
    }

    await saveEventLog('fill-game-cache-finished', {
      added: gamesToInsert.length,
      totalCount: currentCount + gamesToInsert.length,
    });
    console.log(`Successfully filled game cache with ${gamesToInsert.length} games.`);
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
