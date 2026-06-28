# Steamry Developer Guide

Simple and short instructions on how to run development, migrations, and deployment.

---

## 1. Local Development

### Setup environment variables
Copy the template file to create your local secrets file:
```bash
cp .dev.vars.example .dev.vars
```
Open `.dev.vars` and fill in your keys (`STEAM_API_KEY`, `SECRET_KEY`, `TURSO_CONNECTION_URL`, `TURSO_AUTH_TOKEN`).

### Run the Dev Server
To start the local SvelteKit Cloudflare development server:
```bash
npx wrangler dev
```
The server will run on [http://localhost:8787](http://localhost:8787).

---

## 2. Database Migrations (Drizzle + Turso)

* **Generate Migrations** (when you update schemas in `src/lib/server/db/schema.ts`):
  ```bash
  npx drizzle-kit generate
  ```
* **Apply Migrations** (pushed to your Turso database):
  ```bash
  npm run db:migrate
  ```
* **Local Fallback**: If `TURSO_CONNECTION_URL` is omitted, commands automatically run against a local `file:local.db` file.

---

## 3. Production Deployment

### Add Production Secrets
Before your first deployment, configure your secrets on Cloudflare:
```bash
npx wrangler secret put STEAM_API_KEY
npx wrangler secret put SECRET_KEY
npx wrangler secret put REMOTE_CONTROL_KEY
npx wrangler secret put TURSO_CONNECTION_URL
npx wrangler secret put TURSO_AUTH_TOKEN
```

### Build & Deploy
Compile the SvelteKit application and deploy the worker:
```bash
npm run build
npx wrangler deploy
```
