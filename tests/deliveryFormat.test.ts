import { describe, it, expect } from 'vitest';
import { parseDeliveredValue } from '@/lib/deliveryFormat';

// Реальная строка от Kinguin, полученная тестовой покупкой Undertale Steam
// Account ($0.96, kinguinId 154058, заказ 4L1294FF4272) 2026-07-12.
// Табуляция — как в исходном ответе API.
const REAL_ACCOUNT_SERIAL =
  'steam account dp109484452\tPassword ugzu288694\temail account VarianDevara0038@outlook.com\t' +
  'Password yhjdcn391613\temail login address outlook.com ; outlook help email owoweu@steamgameshop.cn\t' +
  'Password 145433 help email login address http://mail.steamgameshop.cn';

describe('parseDeliveredValue', () => {
  it('detects a Steam Gift claim URL as a link', () => {
    const parsed = parseDeliveredValue('https://store.steampowered.com/account/ackgift/ABC123');
    expect(parsed).toEqual({ type: 'link', url: 'https://store.steampowered.com/account/ackgift/ABC123' });
  });

  it('parses the real Kinguin Steam Account bundle into Steam + Email credential pairs', () => {
    const parsed = parseDeliveredValue(REAL_ACCOUNT_SERIAL);
    expect(parsed.type).toBe('account');
    if (parsed.type !== 'account') return;

    expect(parsed.pairs).toEqual([
      { label: 'Steam', login: 'dp109484452', password: 'ugzu288694' },
      { label: 'Email', login: 'VarianDevara0038@outlook.com', password: 'yhjdcn391613' },
    ]);
    // "help email"/recovery-info хвост не должен потеряться и не должен
    // быть ошибочно распознан как третья пара логин/пароль
    expect(parsed.extra.length).toBe(2);
  });

  it('falls back to a plain key for an ordinary CD key string', () => {
    const parsed = parseDeliveredValue('ABCDE-12345-FGHIJ');
    expect(parsed).toEqual({ type: 'key', code: 'ABCDE-12345-FGHIJ' });
  });

  it('does not misclassify a plain key that happens to contain the word "password"', () => {
    // защита от ложного срабатывания — без табуляции и "steam account" не наш формат
    const parsed = parseDeliveredValue('MY-PASSWORD-KEY-123');
    expect(parsed.type).toBe('key');
  });

  it('does not crash on empty input or an incomplete account-like fragment', () => {
    // "steam account" без значения после него не даёт ни одной валидной
    // пары логин/пароль — безопаснее откатиться на обычный вид ключа,
    // чем показать карточку аккаунта с пустыми полями
    expect(parseDeliveredValue('steam account\t').type).toBe('key');
    expect(parseDeliveredValue('').type).toBe('key');
  });
});
