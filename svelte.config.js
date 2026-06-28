import adapter from '@sveltejs/adapter-cloudflare';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import fs from 'node:fs';

// Dynamically generate a wrangler config for SvelteKit build phase to redirect
// its default worker output to .svelte-kit/cloudflare/_worker.js.
// This prevents SvelteKit from overwriting our custom src/worker.js.
if (!fs.existsSync('.svelte-kit')) {
  fs.mkdirSync('.svelte-kit', { recursive: true });
}
fs.writeFileSync(
  '.svelte-kit/wrangler.build.toml',
  `main = "cloudflare/_worker.js"

[assets]
directory = "cloudflare"
binding = "ASSETS"
`,
);

/** @type {import('@sveltejs/kit').Config} */
const config = {
  // Consult https://svelte.dev/docs/kit/integrations
  // for more information about preprocessors
  preprocess: vitePreprocess(),
  kit: {
    adapter: adapter({
      config: '.svelte-kit/wrangler.build.toml',
    }),
    paths: { relative: false },
  },
};

export default config;
