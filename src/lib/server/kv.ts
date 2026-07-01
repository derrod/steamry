import type { KVNamespace } from '@cloudflare/workers-types';

let _kv: KVNamespace | null = null;

export function initKv(kv: KVNamespace) {
  _kv = kv;
}

export function getKv(): KVNamespace | null {
  if (!_kv) {
    const g = globalThis as any;
    if (g.KV) return g.KV;
    return null;
  }
  return _kv;
}

export async function getSteamAppids(): Promise<number[]> {
  const kv = getKv();
  if (kv) {
    const data = await kv.get('steam_apps');
    if (data) {
      return JSON.parse(data) as number[];
    }
  } else {
    // Fallback to local JSON file for local scripts/dev
    try {
      const fs = await import('node:fs');
      const path = await import('node:path');
      const filePath = path.resolve('local_steam_apps.json');
      if (fs.existsSync(filePath)) {
        const data = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(data) as number[];
      }
    } catch (err) {
      console.warn('Failed to read local steam apps file:', err);
    }
  }
  return [];
}

export async function saveSteamAppids(appids: number[]): Promise<void> {
  const kv = getKv();
  if (kv) {
    await kv.put('steam_apps', JSON.stringify(appids));
  } else {
    // Fallback to local JSON file for local scripts/dev
    try {
      const fs = await import('node:fs');
      const path = await import('node:path');
      const filePath = path.resolve('local_steam_apps.json');
      fs.writeFileSync(filePath, JSON.stringify(appids), 'utf8');
      console.log(`Saved ${appids.length} AppIDs to ${filePath}`);
    } catch (err) {
      console.warn('Failed to write local steam apps file:', err);
    }
  }
}
