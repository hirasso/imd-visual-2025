import { defineConfig } from "astro/config";

import relativeLinks from "astro-relative-links";

import favicons from "astro-favicons";

import alpinejs from "@astrojs/alpinejs";

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
    alpinejs({ entrypoint: "/src/scripts/alpine.ts" }),
  ],
});
