import worker from './../.svelte-kit/cloudflare/_worker.js';
import generateDailies from './lib/server/daily/generate-dailies.js';
import { initDb } from './lib/server/db/index.js';
import fetchApps from './lib/server/steam/fetch-apps.js';

export default {
  async fetch(req, env, ctx) {
    return worker.fetch(req, env, ctx);
  },
  async scheduled(event, env, ctx) {
    console.log(`Scheduled event triggered: ${event.cron}`);
    initDb(env.TURSO_CONNECTION_URL, env.TURSO_AUTH_TOKEN);

    globalThis.process = globalThis.process || { env: {} };
    if (env.STEAM_API_KEY) {
      globalThis.process.env.STEAM_API_KEY = env.STEAM_API_KEY;
    }
    if (env.ORIGIN) {
      globalThis.process.env.ORIGIN = env.ORIGIN;
    }
    if (env.TURSO_CONNECTION_URL) {
      globalThis.process.env.TURSO_CONNECTION_URL = env.TURSO_CONNECTION_URL;
    }
    if (env.TURSO_AUTH_TOKEN) {
      globalThis.process.env.TURSO_AUTH_TOKEN = env.TURSO_AUTH_TOKEN;
    }

    ctx.waitUntil(
      (async () => {
        if (event.cron === '0 1 * * 1' || event.cron === '00 01 00 * * mon') {
          console.log('Running fetchApps...');
          await fetchApps();
        } else if (event.cron === '0 6 * * *' || event.cron === '00 06 00 * * *') {
          console.log('Running generateDailies...');
          await generateDailies();
        } else {
          console.log('Running fallback: fetchApps(true) and generateDailies()...');
          await fetchApps(true);
          await generateDailies();
        }
      })(),
    );
  },
};
