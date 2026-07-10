'use client';

import { useEffect, useRef, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { MailCheck, MailX, Loader2 } from 'lucide-react';

type Status = 'loading' | 'success' | 'error';

function Inner() {
  const router = useRouter();
  const params = useSearchParams();
  const didRun = useRef(false);
  const [status, setStatus] = useState<Status>('loading');
  const [error,  setError]  = useState('');

  useEffect(() => {
    if (didRun.current) return;
    didRun.current = true;

    const token = params.get('token');
    if (!token) { setStatus('error'); setError('Ссылка неполная — токен отсутствует'); return; }

    fetch('/api/auth/verify-email', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ token }),
    })
      .then(async res => {
        const data = await res.json() as { success?: boolean; error?: string };
        if (res.ok && data.success) setStatus('success');
        else { setStatus('error'); setError(data.error ?? 'Не удалось подтвердить почту'); }
      })
      .catch(() => { setStatus('error'); setError('Ошибка сети — попробуйте ещё раз'); });
  }, [params]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: '#03020A' }}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                  className="w-full max-w-sm rounded-2xl p-8 text-center"
                  style={{ background: 'rgba(10,9,18,0.95)', border: '1px solid rgba(124,58,237,0.2)',
                           boxShadow: '0 24px 80px rgba(0,0,0,0.7)' }}>
        {status === 'loading' && (
          <>
            <Loader2 className="animate-spin mx-auto mb-4" style={{ width: '32px', height: '32px', color: '#7C3AED' }} />
            <p className="font-heading text-white" style={{ fontSize: '16px' }}>Подтверждаем почту…</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
                 style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)' }}>
              <MailCheck style={{ width: '26px', height: '26px', color: '#4ADE80' }} />
            </div>
            <h1 className="font-heading font-bold text-white mb-2" style={{ fontSize: '20px' }}>
              Почта подтверждена!
            </h1>
            <p className="font-body text-[#6B7280] mb-6" style={{ fontSize: '13px' }}>
              Спасибо! Теперь на этот адрес будут приходить чеки заказов и ссылки для восстановления пароля.
            </p>
            <button onClick={() => router.replace('/catalog')}
                    className="w-full rounded-xl font-heading font-semibold text-white py-3"
                    style={{ fontSize: '13.5px',
                             background: 'linear-gradient(135deg, rgba(124,58,237,0.5), rgba(91,33,182,0.6))',
                             border: '1px solid rgba(124,58,237,0.4)' }}>
              Перейти в каталог
            </button>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
                 style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)' }}>
              <MailX style={{ width: '26px', height: '26px', color: '#F87171' }} />
            </div>
            <h1 className="font-heading font-bold text-white mb-2" style={{ fontSize: '20px' }}>
              Не получилось
            </h1>
            <p className="font-body text-[#F87171] mb-6" style={{ fontSize: '13px' }}>{error}</p>
            <button onClick={() => router.replace('/profile')}
                    className="w-full rounded-xl font-heading font-semibold text-white py-3"
                    style={{ fontSize: '13.5px', background: 'rgba(255,255,255,0.06)',
                             border: '1px solid rgba(255,255,255,0.1)' }}>
              В профиль — запросить новую ссылку
            </button>
          </>
        )}
      </motion.div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="min-h-screen" style={{ background: '#03020A' }} />}>
      <Inner />
    </Suspense>
  );
}
