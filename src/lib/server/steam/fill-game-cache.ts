import { count, inArray } from 'drizzle-orm';
import { MAX_ERROR_LENGTH } from '$lib';
import { db } from '../db';
import * as schema from '../db/schema';
import { saveEventLog } from '../event-logs';
import { getSteamAppids } from '../kv';
import fetchGameInfo from './fetch-game-info';

export default async function fillGameCache(): Promise<void> {
  try {
    const countResult = await db.select({ count: count() }).from(schema.gameCache);
    const currentCount = countResult[0]?.count ?? 0;

    if (currentCount >= 100) {
      console.log(`Game cache has ${currentCount} rows. No need to fill.`);
      return;
    }

    const amountNeeded = Math.min(10, 100 - currentCount);
    console.log(
      `Game cache has ${currentCount} rows. Fetching up to ${amountNeeded} games to fill cache...`,
    );

    const appids = await getSteamAppids();
    if (appids.length === 0) {
      throw new Error('No steam appids found');
    }

    const randomAppids: number[] = [];
    const usedAppids = new Set<number>();
    const candidateFetchSize = amountNeeded * 3;

    for (let i = 0; i < candidateFetchSize; i++) {
      const appid = appids[Math.floor(Math.random() * appids.length)];
      if (!usedAppids.has(appid)) {
        usedAppids.add(appid);
        randomAppids.push(appid);
      }
    }

    if (randomAppids.length === 0) {
      console.log('No random AppIDs generated.');
      return;
    }

    const existingCacheEntries = await db
      .select({ appid: schema.gameCache.appid })
      .from(schema.gameCache)
      .where(inArray(schema.gameCache.appid, randomAppids));

    const existingAppids = new Set(existingCacheEntries.map((entry) => entry.appid));

    const candidates = randomAppids.filter((appid) => !existingAppids.has(appid));

    console.log(`Found ${candidates.length} unique candidates not currently in cache.`);

    const gamesToInsert: schema.NewGameCache[] = [];
    let subrequestCount = 2; // countResult, existingCacheEntries query

    for (const appid of candidates) {
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

      console.log(`Fetching game info for appid: ${appid}`);
      subrequestCount += 3; // fetchGameInfo calls 3 APIs
      const game = await fetchGameInfo(appid.toString());
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
      const chunkSize = 4;
      for (let i = 0; i < gamesToInsert.length; i += chunkSize) {
        const chunk = gamesToInsert.slice(i, i + chunkSize);
        await db.insert(schema.gameCache).values(chunk);
      }
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
