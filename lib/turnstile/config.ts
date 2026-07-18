/* ─────────────────────────────────────────────────────────
   Cloudflare Turnstile ("я не робот") config.
   https://dash.cloudflare.com/?to=/:account/turnstile

   Both keys must be present to turn verification on — absent (local/
   dev without keys) everything gracefully no-ops: the widget doesn't
   render and lib/turnstile/verify.ts skips the server-side check, same
   fallback pattern as every other optional integration in this repo.
───────────────────────────────────────────────────────── */

export const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? '';

export function isTurnstileEnabled(): boolean {
  return Boolean(process.env.TURNSTILE_SECRET_KEY && process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY);
}
