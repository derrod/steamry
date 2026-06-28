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
        TURSO_CONNECTION_URL: string;
        TURSO_AUTH_TOKEN?: string;
        STEAM_API_KEY?: string;
        SECRET_KEY?: string;
        ORIGIN?: string;
        REMOTE_CONTROL_KEY?: string;
      };
    }
  }
}

export {};
