import { MAX_ERROR_LENGTH } from '$lib';
import { saveEventLog } from '../event-logs';
import { getSteamAppids, saveSteamAppids } from '../kv';

const APP_LIST_URL = 'https://api.steampowered.com/IStoreService/GetAppList/v1/';
const FETCH_CHUNK_SIZE = 20_000;
const RETRY_ATTEMPTS = 15;

export default async function fetchApps(onlyIfEmpty: boolean = false) {
  try {
    if (onlyIfEmpty) {
      const existing = await getSteamAppids();
      if (existing && existing.length > 0) {
        console.log('Steam apps already fetched!');
        return;
      }
    }

    let attempts = 0;
    let finished = false;
    let lastAppid = 0;
    let steamApps: AppListResponse['response']['apps'] = [];

    while (!finished) {
      attempts++;
      console.log(`Fetching ${FETCH_CHUNK_SIZE} starting from ${lastAppid}`);
      const detailsUrl = new URL(APP_LIST_URL);
      detailsUrl.searchParams.set('key', process.env.STEAM_API_KEY!);
      detailsUrl.searchParams.set('last_appid', lastAppid.toString());
      detailsUrl.searchParams.set('max_results', FETCH_CHUNK_SIZE.toString());
      detailsUrl.searchParams.set('include_games', true.toString());
      detailsUrl.searchParams.set('include_software', true.toString());

      const response = await fetch(detailsUrl);
      if (!response.ok) {
        throw new Error(`${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      if (!isAppListResponse(result)) {
        console.log(detailsUrl.href);
        console.log(result);
        if (attempts <= RETRY_ATTEMPTS) {
          console.log('Unexpected response data. Retrying...');
          await new Promise((resolve) => setTimeout(resolve, 1000));
          continue;
        } else {
          throw new Error('Unexpected response data');
        }
      }

      attempts = 0;
      steamApps = steamApps.concat(result.response.apps);
      finished = !result.response.have_more_results;
      if (!finished && result.response.last_appid) {
        lastAppid = result.response.last_appid;
      }
    }

    console.log(`Total apps fetched: ${steamApps.length}\n`);

    const appids = steamApps.map((app) => app.appid);
    await saveSteamAppids(appids);

    await saveEventLog('fetch-apps-finished', { appsTotal: appids.length });

    console.log('Done!');
  } catch (err) {
    console.error(err);
    try {
      await saveEventLog('fetch-apps-failed', {
        message: String(err).substring(0, MAX_ERROR_LENGTH),
      });
    } catch (e) {
      console.error(e);
    }
  }
}

type AppListResponse = {
  response: {
    apps: { appid: number; name: string; last_modified: number; price_change_number: number }[];
    have_more_results?: boolean;
    last_appid?: number;
  };
};

function isAppListResponse(data: unknown): data is AppListResponse {
  return (
    typeof data === 'object' &&
    data !== null &&
    'response' in data &&
    typeof data.response === 'object' &&
    data.response !== null &&
    (!('have_more_results' in data.response) ||
      ('have_more_results' in data.response &&
        typeof data.response.have_more_results === 'boolean' &&
        'last_appid' in data.response &&
        typeof data.response.last_appid === 'number')) &&
    'apps' in data.response &&
    typeof data.response.apps === 'object' &&
    data.response.apps !== null &&
    Array.isArray(data.response.apps)
  );
}
