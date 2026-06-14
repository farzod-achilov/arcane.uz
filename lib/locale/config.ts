// i18n configuration — cookie-based locale (no URL routing).
// Russian is the source/default; Uzbek (Latin) is the alternative.

export const locales = ['ru', 'uz'] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'ru';

// Cookie that stores the chosen locale (read server-side in the root layout,
// set client-side by LanguageToggle). 1 year.
export const LOCALE_COOKIE = 'NEXT_LOCALE';
export const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export const localeNames: Record<Locale, string> = {
  ru: 'Русский',
  uz: "O'zbekcha",
};

export function isLocale(value: string | undefined | null): value is Locale {
  return !!value && (locales as readonly string[]).includes(value);
}
