import dotenv from 'dotenv';
import { defineConfig } from 'drizzle-kit';
import fs from 'node:fs';
import path from 'node:path';

// Load .env and .dev.vars environment variables for CLI tooling
dotenv.config();
const devVarsPath = path.resolve('.dev.vars');
if (fs.existsSync(devVarsPath)) {
  const devVars = dotenv.parse(fs.readFileSync(devVarsPath));
  for (const key in devVars) {
    process.env[key] = devVars[key];
  }
}

const url = process.env.TURSO_CONNECTION_URL || 'file:local.db';
const authToken = process.env.TURSO_AUTH_TOKEN;

const isTurso = url.startsWith('libsql://') || url.startsWith('https://');
const dialect = isTurso ? 'turso' : 'sqlite';

export default defineConfig({
  schema: './src/lib/server/db/schema.ts',
  out: './drizzle',
  dialect: dialect as 'turso' | 'sqlite',
  dbCredentials: {
    url: url,
    authToken: authToken,
  },
  verbose: true,
  strict: true,
  casing: 'snake_case',
});
