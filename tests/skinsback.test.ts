import { describe, it, expect } from 'vitest';
import { createHmac } from 'crypto';
import { buildSignature, verifySignature } from '@/lib/skinsback/signature';

// Секрет ожидается из SKINSBACK_CONFIG.clientSecret по умолчанию — задаём
// его явно вторым аргументом, чтобы тест не зависел от .env.
const SECRET = 'test_secret_123';

describe('buildSignature', () => {
  it('matches an independently computed HMAC-SHA1 over sorted key:value; pairs', () => {
    const params = { order_id: '42', method: 'create', amount: '10.50' };
    // Документация: параметры сортируются по ключу, склеиваются "key:value;"
    const expected = createHmac('sha1', SECRET)
      .update('amount:10.50;method:create;order_id:42;')
      .digest('hex');
    expect(buildSignature(params, SECRET)).toBe(expected);
  });

  it('excludes the sign field itself from the signed string', () => {
    const withSign    = buildSignature({ a: '1', sign: 'whatever' }, SECRET);
    const withoutSign = buildSignature({ a: '1' }, SECRET);
    expect(withSign).toBe(withoutSign);
  });

  it('excludes object/array values (per docs)', () => {
    const withExtra = buildSignature({ a: '1', nested: { x: 1 } }, SECRET);
    const plain      = buildSignature({ a: '1' }, SECRET);
    expect(withExtra).toBe(plain);
  });

  it('is order-independent — key order in the input object does not matter', () => {
    const a = buildSignature({ order_id: '1', status: 'success' }, SECRET);
    const b = buildSignature({ status: 'success', order_id: '1' }, SECRET);
    expect(a).toBe(b);
  });
});

describe('verifySignature', () => {
  it('accepts a correctly signed payload', () => {
    const params = { order_id: '7', status: 'success', amount: '5.00' };
    const sign   = buildSignature(params, SECRET);
    expect(verifySignature(params, sign, SECRET)).toBe(true);
  });

  it('rejects a tampered amount (attacker inflates the credited sum)', () => {
    const original = { order_id: '7', status: 'success', amount: '5.00' };
    const sign     = buildSignature(original, SECRET);
    const tampered = { ...original, amount: '500.00' };
    expect(verifySignature(tampered, sign, SECRET)).toBe(false);
  });

  it('rejects a tampered status (attacker flips fail → success)', () => {
    const original = { order_id: '7', status: 'fail', amount: '5.00' };
    const sign     = buildSignature(original, SECRET);
    const tampered = { ...original, status: 'success' };
    expect(verifySignature(tampered, sign, SECRET)).toBe(false);
  });

  it('rejects a signature produced with the wrong secret', () => {
    const params = { order_id: '7', status: 'success', amount: '5.00' };
    const sign   = buildSignature(params, 'wrong_secret');
    expect(verifySignature(params, sign, SECRET)).toBe(false);
  });

  it('rejects when signature is missing', () => {
    expect(verifySignature({ order_id: '1' }, '', SECRET)).toBe(false);
  });

  it('rejects a signature of different length without throwing', () => {
    expect(verifySignature({ order_id: '1' }, 'ab', SECRET)).toBe(false);
  });
});
