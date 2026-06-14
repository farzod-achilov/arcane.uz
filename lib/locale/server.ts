// Server-only locale helpers. Reads the locale cookie set by LanguageToggle.
import 'server-only';
import { cookies } from 'next/headers';
import { defaultLocale, isLocale, LOCALE_COOKIE, type Locale } from './config';
import { getDictionary } from './index';

export function getLocale(): Locale {
  const value = cookies().get(LOCALE_COOKIE)?.value;
  return isLocale(value) ? value : defaultLocale;
}

/** Dictionary for the current request's locale — use in server components. */
export function getServerDict() {
  return getDictionary(getLocale());
}
