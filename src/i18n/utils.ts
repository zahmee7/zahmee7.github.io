import { ui, type UIStrings } from "./ui";

export const locales = ["ar", "en"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "ar";

export function isLocale(value: string | undefined): value is Locale {
  return value !== undefined && (locales as readonly string[]).includes(value);
}

export function dir(lang: Locale): "rtl" | "ltr" {
  return lang === "ar" ? "rtl" : "ltr";
}

export function otherLocale(lang: Locale): Locale {
  return lang === "ar" ? "en" : "ar";
}

export function t(lang: Locale): UIStrings {
  return ui[lang];
}

const arabicIndic = "٠١٢٣٤٥٦٧٨٩";

/** Digits in the Arabic UI use Arabic-Indic numerals (CLAUDE.md > Copy style). */
export function localDigits(value: string | number, lang: Locale): string {
  const text = String(value);
  return lang === "ar" ? text.replace(/\d/g, (d) => arabicIndic[Number(d)] ?? d) : text;
}

/** Two-digit folio number, e.g. 01 or ٠١. */
export function folio(n: number, lang: Locale): string {
  return localDigits(String(n).padStart(2, "0"), lang);
}

/** Browser tab and search title of a page inside the site, e.g. "NDI readiness · Mohammed Alzahmah". */
export function pageTitle(title: string, lang: Locale): string {
  return `${title} · ${t(lang).name}`;
}
