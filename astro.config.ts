import { defineConfig } from "astro/config";

import relativeLinks from "astro-relative-links";

import favicons from "astro-favicons";

function dd(...args: any[]) {
  console.log(...args);
  process.exit();
}

// https://astro.build/config
export default defineConfig({
  integrations: [
    relativeLinks(),
    favicons({
      name: "IMD Visual",
      short_name: "IMD",
      manifestRelativePaths: true,
    }),
  ],
});
