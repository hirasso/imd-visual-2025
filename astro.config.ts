import { defineConfig } from "astro/config";

import relativeLinks from "astro-relative-links";

import favicons from "astro-favicons";

// https://astro.build/config
export default defineConfig({
  integrations: [relativeLinks(), favicons()],
});