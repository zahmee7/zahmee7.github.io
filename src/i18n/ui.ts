// UI strings live in content/site.json (copy changes happen there, never in components).
import site from "../../content/site.json";

export type UIStrings = typeof site.en;

export const ui: { ar: UIStrings; en: UIStrings } = { ar: site.ar, en: site.en };

export const links = site.links;

/**
 * True since the owner launched the site (2026-10-25). Before that every page asked search engines not to
 * index it, so a test version online stayed out of search results.
 */
export const launched = true;

/**
 * True while the owner wants visitors to see only the "Coming soon" page at the root (src/pages/index.astro).
 * Every other page sends visitors there, unless this browser opened /?preview once (the owner's own view;
 * /?public turns it off again). Turned off at launch with launched (owner, 2026-10-25).
 */
export const comingSoon = false;

/** Each language named in itself, e.g. for caption tracks. */
export const languages = site.languages;
