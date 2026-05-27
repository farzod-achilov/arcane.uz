'use client';

import { useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';

function TelegramCallbackInner() {
  const router = useRouter();
  const params = useSearchParams();
  const didRun = useRef(false);

  useEffect(() => {
    if (didRun.current) return;
    didRun.current = true;

    // OIDC flow returns base64url-encoded JSON in tgAuthResult
    const tgAuthResult = params.get('tgAuthResult');

    let data: Record<string, string> | null = null;

    if (tgAuthResult) {
      try {
        const json = atob(tgAuthResult.replace(/-/g, '+').replace(/_/g, '/'));
        data = JSON.parse(json);
      } catch {
        // fallthrough
      }
    } else {
      // Classic widget redirect: params come as plain query params
      const id   = params.get('id');
      const hash = params.get('hash');
      if (id && hash) {
        data = {};
        params.forEach((v, k) => { data![k] = v; });
      }
    }

    if (!data?.id || !data?.hash) {
      router.replace('/login');
      return;
    }

    // Convert all values to strings for NextAuth credentials
    const creds: Record<string, string> = {};
    for (const [k, v] of Object.entries(data)) {
      creds[k] = String(v);
    }

    signIn('telegram', { ...creds, redirect: false })
      .then(result => {
        if (result?.ok) router.replace('/library');
        else            router.replace('/login?error=telegram');
      })
      .catch(() => router.replace('/login?error=telegram'));
  }, [params, router]);

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center gap-4"
      style={{ background: '#03020A' }}
    >
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center"
        style={{
          background: 'linear-gradient(135deg, rgba(6,182,212,0.15), rgba(6,182,212,0.05))',
          border: '1px solid rgba(6,182,212,0.3)',
          boxShadow: '0 0 30px rgba(6,182,212,0.15)',
          animation: 'pulse 1.5s ease-in-out infinite',
        }}
      >
        <svg width="32" height="32" viewBox="0 0 24 24" fill="#22D3EE">
          <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
        </svg>
      </div>

      <p className="font-heading font-semibold text-white" style={{ fontSize: '18px' }}>
        Входим через Telegram…
      </p>
      <p className="font-body text-[#4B5563]" style={{ fontSize: '13px' }}>
        Пожалуйста, подождите
      </p>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.7; transform: scale(0.97); }
        }
      `}</style>
    </div>
  );
}

export default function TelegramCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#03020A' }}>
        <p className="text-white font-heading">Загрузка…</p>
      </div>
    }>
      <TelegramCallbackInner />
    </Suspense>
  );
}
