// @ts-check
import { defineConfig, fontProviders } from "astro/config";

const thmanyah = "./src/assets/fonts/thmanyah";

// https://astro.build/config
export default defineConfig({
  site: "https://alzahmah.com",
  trailingSlash: "always",

  i18n: {
    locales: ["ar", "en"],
    defaultLocale: "ar",
    routing: {
      prefixDefaultLocale: true,
      redirectToDefaultLocale: false, // src/pages/index.astro picks the language from the browser
    },
  },

  // thmanyah: three files, one weight each (DESIGN.md section 3). Copied as they are, never modified.
  fonts: [
    {
      provider: fontProviders.local(),
      name: "thmanyah Serif Display",
      cssVariable: "--font-thmanyah-display",
      fallbacks: ["Georgia", "serif"],
      options: {
        variants: [{ src: [`${thmanyah}/thmanyahserifdisplay-Bold.woff2`], weight: 700, style: "normal" }],
      },
    },
    {
      provider: fontProviders.local(),
      name: "thmanyah Sans",
      cssVariable: "--font-thmanyah-sans",
      fallbacks: ["system-ui", "sans-serif"],
      options: {
        variants: [{ src: [`${thmanyah}/thmanyahsans-Regular.woff2`], weight: 400, style: "normal" }],
      },
    },
    {
      provider: fontProviders.local(),
      name: "thmanyah Serif Text",
      cssVariable: "--font-thmanyah-text",
      fallbacks: ["Georgia", "serif"],
      options: {
        variants: [{ src: [`${thmanyah}/thmanyahseriftext-Regular.woff2`], weight: 400, style: "normal" }],
      },
    },
  ],
});
