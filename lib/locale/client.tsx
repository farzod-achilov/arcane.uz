'use client';

import { createContext, useContext, type ReactNode } from 'react';
import type { Locale } from './config';
import type { Dictionary } from './dictionaries/ru';

interface I18nValue {
  locale: Locale;
  dict:   Dictionary;
}

const I18nContext = createContext<I18nValue | null>(null);

/**
 * Provides locale + dictionary to client components. Fed from the root layout,
 * which reads the locale cookie server-side (so SSR markup is already localized,
 * no flash). The dict is a plain object → serializable across the boundary.
 */
export function LanguageProvider({
  locale,
  dict,
  children,
}: I18nValue & { children: ReactNode }) {
  return (
    <I18nContext.Provider value={{ locale, dict }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n(): I18nValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within <LanguageProvider>');
  return ctx;
}

/** Shortcut: the dictionary for the current locale. */
export function useDict(): Dictionary {
  return useI18n().dict;
}
