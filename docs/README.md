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

- **Generate Migrations** (when you update schemas in `src/lib/server/db/schema.ts`):
  ```bash
  npx drizzle-kit generate
  ```
- **Apply Migrations** (pushed to your Turso database):
  ```bash
  npm run db:migrate
  ```
- **Local Fallback**: If `TURSO_CONNECTION_URL` is omitted, commands automatically run against a local `file:local.db` file.

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
   document.cookie = 'RC=secret; path=/';
   ```
   _(Replace `secret` with your active `REMOTE_CONTROL_KEY` value.)_
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

#### Create Hand-Picked Daily

Create a specific, hand-picked daily challenge with custom Steam app IDs (10 rounds of 2 games each):

```bash
curl -X POST http://localhost:8787/remote-control/handpick-daily \
  -H "Content-Type: application/json" \
  -d '{
    "key": "secret",
    "date": "2026-06-29",
    "rounds": [
      [1245620, 1817070],
      [1145360, 2050650],
      [1056000, 1506830],
      [1151640, 1551360],
      [1172470, 1228240],
      [1067310, 1238840],
      [1225330, 1289310],
      [1196470, 1086000],
      [1127700, 1086940],
      [1116580, 1057090]
    ]
  }'
```

#### View System Event Logs

```bash
curl -X POST http://localhost:8787/remote-control/event-logs \
  -H "Content-Type: application/json" \
  -d '{"key": "secret"}'
```

---

## 5. Backfilling Previous Dates

If you need to batch-generate daily challenges for a range of past dates, you can use the CLI backfill script. It connects directly to your active database (configured in `.dev.vars`) and generates daily challenge entries day-by-day.

```bash
npm run db:backfill <start-date YYYY-MM-DD> <end-date YYYY-MM-DD>
```

Example:

```bash
npm run db:backfill 2026-06-01 2026-06-25
```
