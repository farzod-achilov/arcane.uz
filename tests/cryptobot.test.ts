import { describe, it, expect } from 'vitest';
import { createHash, createHmac } from 'crypto';
import { verifyWebhookSignature } from '@/lib/cryptobot/signature';

const TOKEN = 'test_app_token_123';

// Независимый эталон: HMAC-SHA256(SHA256(token), rawBody), точно по формуле
// из документации — не переиспользует внутренности verifyWebhookSignature.
function referenceSign(rawBody: string, token = TOKEN): string {
  const secret = createHash('sha256').update(token).digest();
  return createHmac('sha256', secret).update(rawBody).digest('hex');
}

describe('verifyWebhookSignature', () => {
  it('accepts a correctly signed raw body', () => {
    const rawBody = JSON.stringify({ update_type: 'invoice_paid', payload: { invoice_id: 1 } });
    const sign = referenceSign(rawBody);
    expect(verifyWebhookSignature(rawBody, sign, TOKEN)).toBe(true);
  });

  it('rejects if the body is re-serialized differently (byte-exact match required)', () => {
    // тот же объект, другое форматирование — имитирует ошибку "распарсили и пересобрали JSON"
    const original = '{"update_type":"invoice_paid","payload":{"invoice_id":1}}';
    const reformatted = JSON.stringify(JSON.parse(original), null, 2);
    const sign = referenceSign(original);
    expect(verifyWebhookSignature(reformatted, sign, TOKEN)).toBe(false);
  });

  it('rejects a tampered paid_amount (attacker inflates the credited sum)', () => {
    const original = JSON.stringify({ payload: { paid_amount: '5.00' } });
    const sign      = referenceSign(original);
    const tampered  = JSON.stringify({ payload: { paid_amount: '500.00' } });
    expect(verifyWebhookSignature(tampered, sign, TOKEN)).toBe(false);
  });

  it('rejects a signature produced with the wrong token', () => {
    const rawBody = JSON.stringify({ a: 1 });
    const sign = referenceSign(rawBody, 'wrong_token');
    expect(verifyWebhookSignature(rawBody, sign, TOKEN)).toBe(false);
  });

  it('rejects when signature is missing', () => {
    expect(verifyWebhookSignature('{}', '', TOKEN)).toBe(false);
  });

  it('rejects a signature of different length without throwing', () => {
    expect(verifyWebhookSignature('{}', 'ab', TOKEN)).toBe(false);
  });
});
