// UI strings live in content/site.json (copy changes happen there, never in components).
import site from "../../content/site.json";

export type UIStrings = typeof site.en;

export const ui: { ar: UIStrings; en: UIStrings } = { ar: site.ar, en: site.en };

export const links = site.links;

/**
 * False until the owner launches the site (docs/PLAN.md, phase 8). Until then every page asks search engines
 * not to index it, so a test version online stays out of search results.
 */
export const launched = false;

/**
 * True while the owner wants visitors to see only the "Coming soon" page at the root (src/pages/index.astro).
 * Every other page sends visitors there, unless this browser opened /?preview once (the owner's own view;
 * /?public turns it off again). Set to false at launch with launched (docs/PLAN.md, phase 8).
 */
export const comingSoon = true;

/** Each language named in itself, e.g. for caption tracks. */
export const languages = site.languages;
