import { describe, it, expect } from 'vitest';
import { pickBestBaseGameOffer, type KinguinSearchResult } from '@/lib/kinguin/basePicker';

function offer(over: Partial<KinguinSearchResult>): KinguinSearchResult {
  return {
    kinguinId: 1, name: 'Some Game PC Steam CD Key', platform: 'Steam',
    cover: null, genres: [], costUsd: 10, inStock: true,
    ...over,
  };
}

describe('pickBestBaseGameOffer', () => {
  // Регрессия на реальный инцидент: первая версия отборщика при отсутствии
  // Steam-оффера откатывалась на любую другую платформу и один раз выбрала
  // "Elden Ring - Pre-Order Bonus DLC Xbox Series X|S CD Key" как будто это
  // была сама игра. Позиция ушла в живой каталог по 199 000 сум, пока не
  // заметили и не деактивировали вручную.
  it('never falls back to a non-Steam platform (the Elden Ring incident)', () => {
    const results = [
      offer({ kinguinId: 1, name: 'Elden Ring Steam Altergift', platform: 'Steam', costUsd: 63.38, inStock: false }),
      offer({ kinguinId: 2, name: 'Elden Ring - Pre-Order Bonus DLC Steam CD Key', platform: 'Steam', costUsd: 47.38, inStock: false }),
      offer({ kinguinId: 3, name: 'Elden Ring - Pre-Order Bonus DLC Xbox Series X|S CD Key', platform: 'Xbox Series X|S', costUsd: 12.3, inStock: true }),
      offer({ kinguinId: 4, name: 'Elden Ring - Pre-Order Bonus DLC XBOX One CD Key', platform: 'Xbox One', costUsd: 17.49, inStock: true }),
    ];
    expect(pickBestBaseGameOffer(results, 'Elden Ring')).toBeNull();
  });

  it('rejects DLC/bonus/soundtrack listings even when in-stock on Steam', () => {
    const results = [
      offer({ name: 'Baldur\'s Gate - Siege of Dragonspear DLC PC Steam CD Key', costUsd: 2.6 }),
      offer({ name: 'Baldur\'s Gate: Enhanced Edition - Official Soundtrack DLC PC Steam CD Key', costUsd: 7.99 }),
    ];
    expect(pickBestBaseGameOffer(results, 'Baldur\'s Gate')).toBeNull();
  });

  it('rejects out-of-stock Steam offers rather than selling a key that cannot be delivered', () => {
    const results = [offer({ name: 'Some Game PC Steam CD Key', inStock: false })];
    expect(pickBestBaseGameOffer(results, 'Some Game')).toBeNull();
  });

  it('picks the cheapest clean in-stock Steam offer among valid candidates', () => {
    const results = [
      offer({ kinguinId: 1, name: 'Hades PC Steam Gift', costUsd: 15 }),
      offer({ kinguinId: 2, name: 'Hades PC Steam Account', costUsd: 1.16 }),
      offer({ kinguinId: 3, name: 'Hades PC Steam CD Key', costUsd: 8 }),
    ];
    const picked = pickBestBaseGameOffer(results, 'Hades');
    expect(picked?.kinguinId).toBe(2);
  });

  it('prefers a title-prefix match over a cheaper unrelated listing', () => {
    const results = [
      offer({ kinguinId: 1, name: 'Some Unrelated Cheap Game Steam CD Key', costUsd: 0.5 }),
      offer({ kinguinId: 2, name: 'Hollow Knight PC Steam CD Key', costUsd: 5 }),
    ];
    const picked = pickBestBaseGameOffer(results, 'Hollow Knight');
    expect(picked?.kinguinId).toBe(2);
  });

  it('returns null when no results are given', () => {
    expect(pickBestBaseGameOffer([], 'Anything')).toBeNull();
  });

  // Account-офферы доставляют логин/пароль Steam + почты (см.
  // lib/deliveryFormat.ts), а не простой ключ — заметно сложнее для
  // покупателя. Предпочитаем CD Key/Gift, если Account не дешевле
  // ощутимо (порог: дешевле в 0.6 раза).
  describe('Account vs CD Key/Gift preference', () => {
    it('prefers CD Key over a marginally cheaper Account offer', () => {
      const results = [
        offer({ kinguinId: 1, name: 'Some Game PC Steam Account', costUsd: 4.5 }),
        offer({ kinguinId: 2, name: 'Some Game PC Steam CD Key', costUsd: 5 }),
      ];
      expect(pickBestBaseGameOffer(results, 'Some Game')?.kinguinId).toBe(2);
    });

    it('still picks Account when it is dramatically cheaper (real Hades case: $1.16 vs $8+)', () => {
      const results = [
        offer({ kinguinId: 1, name: 'Hades PC Steam Gift', costUsd: 15 }),
        offer({ kinguinId: 2, name: 'Hades PC Steam Account', costUsd: 1.16 }),
        offer({ kinguinId: 3, name: 'Hades PC Steam CD Key', costUsd: 8 }),
      ];
      expect(pickBestBaseGameOffer(results, 'Hades')?.kinguinId).toBe(2);
    });

    it('picks Account when it is the only clean Steam offer available', () => {
      const results = [offer({ kinguinId: 1, name: 'Undertale Steam Account', costUsd: 0.96 })];
      expect(pickBestBaseGameOffer(results, 'Undertale')?.kinguinId).toBe(1);
    });
  });
});
