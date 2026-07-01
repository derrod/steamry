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

export default defineConfig({
  schema: './src/lib/server/db/schema.ts',
  out: './drizzle',
  dialect: 'sqlite',
  dbCredentials: {
    url: 'local.db',
  },
  verbose: true,
  strict: true,
  casing: 'snake_case',
});
