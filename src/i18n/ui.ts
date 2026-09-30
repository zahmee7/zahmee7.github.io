// UI strings live in content/site.json (copy changes happen there, never in components).
import site from "../../content/site.json";

export type UIStrings = typeof site.en;

export const ui: { ar: UIStrings; en: UIStrings } = { ar: site.ar, en: site.en };

export const links = site.links;
