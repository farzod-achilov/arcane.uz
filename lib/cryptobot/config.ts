/* ─────────────────────────────────────────────────────────
   @CryptoBot / Crypto Pay API config. Accepts USDT (and other
   crypto) via a Telegram-hosted checkout.
   Docs: https://help.send.tg/en/articles/10279948-crypto-pay-api

   Token: open @CryptoBot (@CryptoTestnetBot for testnet) → Crypto Pay
   → Create App. No business KYC — a personal Telegram account is enough.
───────────────────────────────────────────────────────── */

const TESTNET = process.env.CRYPTOBOT_TESTNET === 'true';

export const CRYPTOBOT_CONFIG = {
  token:  process.env.CRYPTOBOT_TOKEN ?? '',
  apiUrl: TESTNET ? 'https://testnet-pay.crypt.bot/api/' : 'https://pay.crypt.bot/api/',
  asset:  'USDT' as const,
};

export function isCryptobotEnabled(): boolean {
  return Boolean(CRYPTOBOT_CONFIG.token);
}
