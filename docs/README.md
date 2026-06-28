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

---

## 4. Remote Control API & Debugging

The application has built-in remote control features for triggering database updates, logs, and game regeneration.

### A. Accessing Future Replays (Look-ahead Debugging)
To view future dailies that are normally locked:
1. Open your browser to `http://localhost:8787` (or your deployed URL).
2. Open the developer console (F12) and execute:
   ```javascript
   document.cookie = "RC=secret; path=/";
   ```
   *(Replace `secret` with your active `REMOTE_CONTROL_KEY` value.)*
3. You can now navigate to future dates directly, e.g., `/replay/2026-06-29`.

### B. Remote Control API Endpoints
All administrative APIs are `POST` endpoints located under `/remote-control/*`. They require a JSON body with the `key` field matching your `REMOTE_CONTROL_KEY`.

#### Trigger App Sync
```bash
curl -X POST http://localhost:8787/remote-control/refetch-apps \
  -H "Content-Type: application/json" \
  -d '{"key": "secret"}'
```

#### Regenerate Daily Challenges
Wipe and select new random games for a specific day:
```bash
curl -X POST http://localhost:8787/remote-control/regenerate-daily \
  -H "Content-Type: application/json" \
  -d '{"key": "secret", "date": "2026-06-28"}'
```

#### View System Event Logs
```bash
curl -X POST http://localhost:8787/remote-control/event-logs \
  -H "Content-Type: application/json" \
  -d '{"key": "secret"}'
```

