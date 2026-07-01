import { inArray } from 'drizzle-orm';
import { MAX_ERROR_LENGTH } from '$lib';
import { db } from '../db';
import * as schema from '../db/schema';
import { saveEventLog } from '../event-logs';
import getRandomGames from '../steam/get-random-games';
import makeRounds from './make-rounds';
import saveDaily from './save-daily';

const ROUNDS = 10;
const GAMES_PER_ROUND = 2;
const MIN_PERCENTAGE_DIFF = 5;

export default async function makeNewDaily(date: Date, useCache = false) {
  try {
    console.log(`\nMaking daily for ${date.toISOString()} (useCache: ${useCache})`);

    let gameInfos: schema.NewGameInfoOnly[] | null = null;
    let idsToDelete: number[] = [];

    if (useCache) {
      const amountNeeded = ROUNDS * GAMES_PER_ROUND;
      const cached = await db
        .select()
        .from(schema.gameCache)
        .orderBy(schema.gameCache.id)
        .limit(amountNeeded);

      if (cached.length < amountNeeded) {
        throw new Error(`Not enough games in cache! Have ${cached.length}, need ${amountNeeded}`);
      }

      idsToDelete = cached.map((c) => c.id);

      gameInfos = cached.map((c) => ({
        appid: c.appid,
        name: c.name,
        reviewsPositive: c.reviewsPositive,
        reviewsNegative: c.reviewsNegative,
        description: c.description,
        price: c.price,
        releaseDate: c.releaseDate,
        headerImage: c.headerImage,
        developers: c.developers,
        publishers: c.publishers,
        tags: c.tags,
        categories: c.categories,
        genres: c.genres,
        screenshots: c.screenshots,
        trailers: c.trailers,
        contentDescriptors: c.contentDescriptors,
        requiredAge: c.requiredAge,
        markedAsNsfw: c.markedAsNsfw,
        isHandPicked: c.isHandPicked,
      }));
    } else {
      gameInfos = await getRandomGames(ROUNDS * GAMES_PER_ROUND);
    }

    if (!gameInfos || gameInfos.length === 0) {
      throw new Error('No games!');
    }

    const rounds = makeRounds(gameInfos, GAMES_PER_ROUND, MIN_PERCENTAGE_DIFF);
    rounds.sort(() => Math.random() - 0.5);
    for (let i = 0; i < rounds.length; i++) {
      rounds[i].sort(() => Math.random() - 0.5);
    }

    const daily = await saveDaily(date, rounds);

    if (idsToDelete.length > 0) {
      await db.delete(schema.gameCache).where(inArray(schema.gameCache.id, idsToDelete));
    }

    await saveEventLog('make-new-daily-finished', daily);

    console.log('Finished!');
    return { daily: daily, rounds: rounds };
  } catch (err) {
    console.error(err);
    try {
      await saveEventLog('make-new-daily-failed', {
        message: String(err).substring(0, MAX_ERROR_LENGTH),
      });
    } catch (e) {
      console.error(e);
    }
  }
}
