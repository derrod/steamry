import { createClient } from '@libsql/client';
import { drizzle, type LibSQLDatabase } from 'drizzle-orm/libsql';
import { createRequire } from 'node:module';
import * as schema from './schema';

export type Database = LibSQLDatabase<typeof schema>;

let _db: Database | null = null;

export function initDb(url: string, authToken?: string) {
  if (_db) return;
  const client = createClient({ url, authToken });
  _db = drizzle(client, { schema, casing: 'snake_case' });
}

export function initLocalDb() {
  if (_db) return;
  const require = createRequire(import.meta.url);
  const dotenv = require('dotenv');
  const path = require('node:path');
  const fs = require('node:fs');

  dotenv.config();

  // Load from .dev.vars if it exists (standard local secrets for wrangler/workers)
  const devVarsPath = path.resolve('.dev.vars');
  if (fs.existsSync(devVarsPath)) {
    const devVars = dotenv.parse(fs.readFileSync(devVarsPath));
    for (const key in devVars) {
      process.env[key] = devVars[key];
    }
  }

  const url = process.env.TURSO_CONNECTION_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;

  if (url) {
    console.log(`Connecting to Turso database at ${url}...`);
    const client = createClient({ url, authToken });
    _db = drizzle(client, { schema, casing: 'snake_case' });
  } else {
    console.log('No TURSO_CONNECTION_URL found, falling back to local file local.db...');
    const client = createClient({ url: 'file:local.db' });
    _db = drizzle(client, { schema, casing: 'snake_case' });
  }
}

export const db: Database = new Proxy({} as unknown as Database, {
  get(target, prop, receiver) {
    if (!_db) {
      throw new Error('Database not initialized! Call initDb(url, token) or initLocalDb() first.');
    }
    return Reflect.get(_db, prop, receiver);
  },
});
