import ru, { type Dictionary } from './dictionaries/ru';
import uz from './dictionaries/uz';
import type { Locale } from './config';

const dictionaries: Record<Locale, Dictionary> = { ru, uz };

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale] ?? ru;
}

export type { Dictionary };
