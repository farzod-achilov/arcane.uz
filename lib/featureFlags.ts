// Feature flags. NEXT_PUBLIC_* инлайнятся в клиентский бандл при сборке,
// поэтому после смены значения нужен rebuild (npm run build / перезапуск dev).

/**
 * Кейсы «в разработке»: раздел остаётся видимым как тизер (секция на главной,
 * страницы /cases), но открыть кейс нельзя — CTA показывают «Скоро»,
 * страницы машин закрыты заглушкой, API открытия отвечает 503.
 *
 * Включено по умолчанию. Запустить кейсы: NEXT_PUBLIC_CASES_COMING_SOON=false
 */
export const CASES_COMING_SOON =
  process.env.NEXT_PUBLIC_CASES_COMING_SOON !== 'false';

/**
 * Показывать ли на /deposit способ оплаты «Скинами CS2/Dota». Выключено по
 * умолчанию — SKINSBACK_CLIENT_ID/SECRET ещё не заведены. После получения
 * учётки на skinsback.com/signup: заполнить оба секрета в .env.local И
 * поставить NEXT_PUBLIC_SKINSBACK_ENABLED=true, затем rebuild.
 */
export const SKINSBACK_ENABLED =
  process.env.NEXT_PUBLIC_SKINSBACK_ENABLED === 'true';
