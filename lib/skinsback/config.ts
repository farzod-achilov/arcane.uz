/* ─────────────────────────────────────────────────────────
   SkinsBack merchant config — pays with CS2/Dota2/Rust skins.
   Docs: https://skinsback.com/docs/api/v1/

   Two credentials from the merchant dashboard (skinsback.com/signup):
   Client ID + Client Secret. No sandbox/production split documented —
   unlike Kinguin/Eneba, same credentials work for all traffic.
───────────────────────────────────────────────────────── */

export const SKINSBACK_CONFIG = {
  clientId:     process.env.SKINSBACK_CLIENT_ID ?? '',
  clientSecret: process.env.SKINSBACK_CLIENT_SECRET ?? '',
  apiUrl:       'https://skinsback.com/api.php',
};

export function isSkinsbackEnabled(): boolean {
  return Boolean(SKINSBACK_CONFIG.clientId && SKINSBACK_CONFIG.clientSecret);
}
