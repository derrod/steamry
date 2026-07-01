// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
  namespace App {
    // interface Error {}
    // interface Locals {}
    // interface PageData {}
    // interface PageState {}
    interface Platform {
      env: {
        DB: D1Database;
        KV: KVNamespace;
        STEAM_API_KEY?: string;
        SECRET_KEY?: string;
        ORIGIN?: string;
        REMOTE_CONTROL_KEY?: string;
      };
    }
  }
}

export {};
