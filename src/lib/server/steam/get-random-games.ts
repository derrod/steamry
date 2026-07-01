import { MAX_ERROR_LENGTH } from '$lib';
import * as schema from '../db/schema';
import { saveEventLog } from '../event-logs';
import { getSteamAppids } from '../kv';
import fetchGameInfo from './fetch-game-info';

const MAX_ATTEMPTS = 300;

export default async function getRandomGames(
  amount: number,
): Promise<schema.NewGameInfoOnly[] | null> {
  try {
    const appids = await getSteamAppids();
    if (appids.length === 0) {
      throw new Error('No steam appids found');
    }

    const games: schema.NewGameInfoOnly[] = [];
    let attempts = 0;
    const usedAppids = new Set<number>();

    while (games.length < amount) {
      attempts += 1;
      if (attempts > MAX_ATTEMPTS) {
        throw new Error(`Exceeded ${MAX_ATTEMPTS} attempts`);
      }

      const appid = appids[Math.floor(Math.random() * appids.length)];
      if (usedAppids.has(appid)) {
        continue;
      }

      const game = await fetchGameInfo(appid.toString());
      if (!game) {
        continue;
      }

      games.push(game);
      usedAppids.add(appid);
    }

    return games;
  } catch (err) {
    console.error(err);
    try {
      await saveEventLog('get-random-games-failed', {
        message: String(err).substring(0, MAX_ERROR_LENGTH),
      });
    } catch (e) {
      console.error(e);
    }
    return null;
  }
}
