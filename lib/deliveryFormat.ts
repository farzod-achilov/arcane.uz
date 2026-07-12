/* ─────────────────────────────────────────────────────────
   Parses whatever a supplier hands back into order_items.keyValue
   into a shape the UI/email/notifications can render sensibly.

   Confirmed live 2026-07-12 via a real $0.96 test purchase (Undertale
   Steam Account, kinguinId 154058) that Kinguin's "Steam Account"
   listings do NOT deliver a simple key or even a plain login:password
   pair — they deliver a tab-separated bundle of the Steam account's
   OWN credentials plus the RECOVERY EMAIL's credentials (needed for
   Steam Guard), e.g.:

     steam account dp109484452 <TAB> Password ugzu288694 <TAB>
     email account VarianDevara0038@outlook.com <TAB> Password yhjdcn391613 <TAB>
     email login address ... ; outlook help email ... <TAB> Password ... help email login address ...

   Shown raw (as the old isDeliveredValueLink-only logic did), this is
   an unreadable blob with zero explanation of what the two logins are
   for — a direct path to "you sold me garbage" support tickets.
───────────────────────────────────────────────────────── */

export interface AccountCredentialPair {
  label:    'Steam' | 'Email';
  login:    string;
  password: string | null;
}

export type DeliveredFormat =
  | { type: 'link';    url: string }
  | { type: 'account'; pairs: AccountCredentialPair[]; extra: string[] }
  | { type: 'key';     code: string };

function tryParseAccountBundle(raw: string): DeliveredFormat | null {
  if (!raw.includes('\t') || !/steam account/i.test(raw)) return null;

  const segments = raw.split('\t').map(s => s.trim()).filter(Boolean);
  const pairs: AccountCredentialPair[] = [];
  const extra: string[] = [];
  let i = 0;
  while (i < segments.length) {
    const seg = segments[i];
    const loginMatch = seg.match(/^(steam account|email account)\s+(.+)$/i);
    if (loginMatch) {
      const label: 'Steam' | 'Email' = /steam/i.test(loginMatch[1]) ? 'Steam' : 'Email';
      const login = loginMatch[2].trim();
      const next  = segments[i + 1];
      const passMatch = next?.match(/^password\s+(\S+)/i);
      if (passMatch) {
        pairs.push({ label, login, password: passMatch[1] });
        i += 2;
        continue;
      }
      pairs.push({ label, login, password: null });
      i += 1;
      continue;
    }
    extra.push(seg);
    i += 1;
  }
  // ничего похожего на логин не нашли — не наш формат, пусть уходит как обычный код
  if (pairs.length === 0) return null;
  return { type: 'account', pairs, extra };
}

export function parseDeliveredValue(value: string): DeliveredFormat {
  const trimmed = value.trim();
  if (/^https?:\/\//i.test(trimmed)) return { type: 'link', url: trimmed };

  const account = tryParseAccountBundle(trimmed);
  if (account) return account;

  return { type: 'key', code: value };
}
