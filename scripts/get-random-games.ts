import { initLocalDb } from '../src/lib/server/db';
import getRandomGames from '../src/lib/server/steam/get-random-games';

initLocalDb();

const games = await getRandomGames(10);
console.log(games);

process.exit(0);
