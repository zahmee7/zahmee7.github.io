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

/** Each language named in itself, e.g. for caption tracks. */
export const languages = site.languages;
