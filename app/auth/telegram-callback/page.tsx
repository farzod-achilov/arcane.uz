'use client';

import { useEffect, useRef, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';

function decodeBase64Url(str: string): string {
  const base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  const pad = (4 - base64.length % 4) % 4;
  return atob(base64 + '='.repeat(pad));
}

function TelegramCallbackInner() {
  const router  = useRouter();
  const params  = useSearchParams();
  const didRun  = useRef(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [rawData,  setRawData]  = useState('');

  useEffect(() => {
    if (didRun.current) return;
    didRun.current = true;

    const tgAuthResult = params.get('tgAuthResult');
    let data: Record<string, string> | null = null;

    if (tgAuthResult) {
      try {
        const json = decodeBase64Url(tgAuthResult);
        const parsed = JSON.parse(json);
        setRawData(JSON.stringify(parsed, null, 2));
        data = {};
        for (const [k, v] of Object.entries(parsed)) {
          data[k] = String(v);
        }
      } catch (e) {
        setErrorMsg(`Ошибка декодирования tgAuthResult: ${e}`);
        return;
      }
    } else {
      const id   = params.get('id');
      const hash = params.get('hash');
      if (id && hash) {
        data = {};
        params.forEach((v, k) => { data![k] = v; });
        setRawData(JSON.stringify(data, null, 2));
      }
    }

    if (!data?.id || !data?.hash) {
      const allParams: Record<string, string> = {};
      params.forEach((v, k) => { allParams[k] = v; });
      setErrorMsg(`Нет id/hash. Params: ${JSON.stringify(allParams)}`);
      return;
    }

    signIn('telegram', { ...data, redirect: false })
      .then(result => {
        console.log('[TG callback] signIn result:', result);
        if (result?.ok) {
          router.replace('/library');
        } else {
          setErrorMsg(`signIn вернул error: ${result?.error ?? 'unknown'}`);
        }
      })
      .catch((e) => {
        setErrorMsg(`signIn throw: ${e}`);
      });
  }, [params, router]);

  if (errorMsg) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-6"
           style={{ background: '#03020A' }}>
        <p className="font-heading font-semibold text-red-400" style={{ fontSize: '16px' }}>
          Ошибка входа через Telegram
        </p>
        <pre className="text-xs text-gray-400 bg-gray-900 rounded-xl p-4 max-w-lg w-full overflow-auto">
          {errorMsg}
        </pre>
        {rawData && (
          <pre className="text-xs text-cyan-400 bg-gray-900 rounded-xl p-4 max-w-lg w-full overflow-auto">
            {rawData}
          </pre>
        )}
        <button onClick={() => router.replace('/login')}
                className="font-heading text-white rounded-xl px-6 py-2"
                style={{ background: 'rgba(124,58,237,0.3)', border: '1px solid rgba(124,58,237,0.4)' }}>
          Вернуться
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4"
         style={{ background: '#03020A' }}>
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
           style={{
             background: 'linear-gradient(135deg, rgba(6,182,212,0.15), rgba(6,182,212,0.05))',
             border: '1px solid rgba(6,182,212,0.3)',
             boxShadow: '0 0 30px rgba(6,182,212,0.15)',
             animation: 'pulse 1.5s ease-in-out infinite',
           }}>
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
