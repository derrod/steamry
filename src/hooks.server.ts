import type { Handle } from '@sveltejs/kit';
import { building } from '$app/environment';
import { initDb } from '$lib/server/db';
import { initKv } from '$lib/server/kv';

export const handle: Handle = async ({ event, resolve }) => {
  try {
    if (!building) {
      if (event.platform?.env?.DB) {
        initDb(event.platform.env.DB);
      }
      if (event.platform?.env?.KV) {
        initKv(event.platform.env.KV);
      }
    }
  } catch {
    // Ignore error when accessing platform bindings in a prerenderable route
  }
  return resolve(event);
};
