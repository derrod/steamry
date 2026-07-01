import { drizzle as drizzleD1, type DrizzleD1Database } from 'drizzle-orm/d1';
import type { D1Database } from '@cloudflare/workers-types';
import { createRequire } from 'node:module';
import * as schema from './schema';

export type Database = DrizzleD1Database<typeof schema>;

let _db: any = null;

export function initDb(d1: D1Database) {
  if (_db) return;
  _db = drizzleD1(d1, { schema, casing: 'snake_case' });
}

export function initLocalDb() {
  if (_db) return;
  const require = createRequire(import.meta.url);
  const DatabaseConstructor = require('better-sqlite3');
  const { drizzle: drizzleBetterSqlite } = require('drizzle-orm/better-sqlite3');

  dotenvConfig();

  console.log('Initializing local SQLite database (local.db) for CLI tools...');
  const client = new DatabaseConstructor('local.db');
  _db = drizzleBetterSqlite(client, { schema, casing: 'snake_case' });
}

function dotenvConfig() {
  try {
    const require = createRequire(import.meta.url);
    const dotenv = require('dotenv');
    const path = require('node:path');
    const fs = require('node:fs');

    dotenv.config();

    const devVarsPath = path.resolve('.dev.vars');
    if (fs.existsSync(devVarsPath)) {
      const devVars = dotenv.parse(fs.readFileSync(devVarsPath));
      for (const key in devVars) {
        process.env[key] = devVars[key];
      }
    }
  } catch (err) {
    // Ignore if dotenv/fs/path are not available in non-Node environment
  }
}

export const db: Database = new Proxy({} as unknown as Database, {
  get(target, prop, receiver) {
    if (!_db) {
      throw new Error('Database not initialized! Call initDb(d1) or initLocalDb() first.');
    }
    return Reflect.get(_db, prop, receiver);
  },
});
