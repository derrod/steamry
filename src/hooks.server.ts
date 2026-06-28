import type { Handle } from '@sveltejs/kit';
import { building } from '$app/environment';
import { initDb } from '$lib/server/db';

export const handle: Handle = async ({ event, resolve }) => {
  try {
    if (!building && event.platform?.env?.TURSO_CONNECTION_URL) {
      initDb(
        event.platform.env.TURSO_CONNECTION_URL,
        event.platform.env.TURSO_AUTH_TOKEN
      );
    }
  } catch (err) {
    // Ignore error when accessing platform bindings in a prerenderable route
  }
  return resolve(event);
};
