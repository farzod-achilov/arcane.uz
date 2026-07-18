'use client';

import { useEffect, useRef } from 'react';

/* ─────────────────────────────────────────────────────────
   Cloudflare Turnstile ("я не робот") widget — hand-rolled instead of
   pulling in a React wrapper package, since it's a single <script> tag
   + one render() call. Renders nothing when siteKey is empty (Turnstile
   not configured), so forms stay usable in local/dev without keys —
   see lib/turnstile/config.ts.
───────────────────────────────────────────────────────── */

declare global {
  interface Window {
    turnstile?: {
      render: (container: HTMLElement, options: Record<string, unknown>) => string;
      reset:  (widgetId?: string) => void;
      remove: (widgetId?: string) => void;
    };
  }
}

const SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js';
const SCRIPT_ID   = 'cf-turnstile-script';

interface Props {
  siteKey:   string;
  onVerify:  (token: string) => void;
  onExpire?: () => void;
}

export default function TurnstileWidget({ siteKey, onVerify, onExpire }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef   = useRef<string | null>(null);

  useEffect(() => {
    if (!siteKey) return;
    let cancelled = false;
    let pollId: ReturnType<typeof setInterval> | null = null;

    function renderWidget() {
      if (cancelled || !containerRef.current || !window.turnstile || widgetIdRef.current) return;
      widgetIdRef.current = window.turnstile.render(containerRef.current, {
        sitekey:  siteKey,
        theme:    'dark',
        callback: (token: string) => onVerify(token),
        'expired-callback': () => onExpire?.(),
        'error-callback':   () => onExpire?.(),
      });
    }

    if (window.turnstile) {
      renderWidget();
    } else {
      if (!document.getElementById(SCRIPT_ID)) {
        const script = document.createElement('script');
        script.id    = SCRIPT_ID;
        script.src   = SCRIPT_SRC;
        script.async = true;
        script.defer = true;
        document.head.appendChild(script);
      }
      pollId = setInterval(() => {
        if (window.turnstile) {
          if (pollId) clearInterval(pollId);
          renderWidget();
        }
      }, 100);
    }

    return () => {
      cancelled = true;
      if (pollId) clearInterval(pollId);
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [siteKey]);

  if (!siteKey) return null;

  return <div ref={containerRef} />;
}
