import { describe, it, expect } from 'vitest';
import { extractAmountCandidates, extractSmsTimestamp } from '@/lib/deposits/p2p';

describe('extractAmountCandidates', () => {
  it('parses plain integer amounts', () => {
    expect(extractAmountCandidates('Пополнение 100347 UZS')).toEqual([100347]);
  });

  it('parses amounts with space thousand separators', () => {
    expect(extractAmountCandidates('Перевод 1 250 500 сум')).toEqual([1250500]);
  });

  it('drops kopeyka/decimal tails', () => {
    expect(extractAmountCandidates('100 347.00 UZS')).toEqual([100347]);
    expect(extractAmountCandidates('100347,50')).toEqual([100347]);
  });

  it('ignores numbers below the 10 000 deposit minimum (dates, card digits)', () => {
    expect(extractAmountCandidates('09.07.26 13:42 карта *1234 баланс 5000')).toEqual([]);
  });

  it('does not merge numbers across line breaks', () => {
    const sms = 'Приход: 150000\n09.07.26 13:42\nБаланс: 2750000';
    expect(extractAmountCandidates(sms)).toEqual([150000, 2750000]);
  });

  it('deduplicates repeated amounts', () => {
    expect(extractAmountCandidates('150000 сум (150000)')).toEqual([150000]);
  });
});

describe('extractSmsTimestamp', () => {
  it('parses dd.MM.yy HH:mm as Tashkent time (UTC+5 by default)', () => {
    const d = extractSmsTimestamp('Оплата 100000 09.07.26 13:42');
    expect(d?.toISOString()).toBe('2026-07-09T08:42:00.000Z');
  });

  it('parses 4-digit years', () => {
    const d = extractSmsTimestamp('Оплата 09.07.2026 13:42');
    expect(d?.toISOString()).toBe('2026-07-09T08:42:00.000Z');
  });

  it('returns null when no date present', () => {
    expect(extractSmsTimestamp('Пополнение 100000 сум')).toBeNull();
  });
});
