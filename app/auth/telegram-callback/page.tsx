'use client';

import { useEffect, useRef, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, UserPlus, Link2 } from 'lucide-react';

/* ─── helpers ─────────────────────────────────────────────── */
function decodeBase64Url(str: string): string {
  const base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  const pad = (4 - base64.length % 4) % 4;
  return atob(base64 + '='.repeat(pad));
}

type TgData = Record<string, string>;

/* ─── Loading screen ──────────────────────────────────────── */
function LoadingScreen() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4"
         style={{ background: '#03020A' }}>
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
           style={{
             background: 'linear-gradient(135deg, rgba(6,182,212,0.15), rgba(6,182,212,0.05))',
             border: '1px solid rgba(6,182,212,0.3)',
             animation: 'pulse 1.5s ease-in-out infinite',
           }}>
        <svg width="28" height="28" viewBox="0 0 24 24" fill="#22D3EE">
          <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
        </svg>
      </div>
      <p className="font-heading font-semibold text-white" style={{ fontSize: '18px' }}>
        Входим через Telegram…
      </p>
      <style>{`@keyframes pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.7;transform:scale(.97)}}`}</style>
    </div>
  );
}

/* ─── Link-or-create screen ───────────────────────────────── */
function LinkOrCreateScreen({ tgData, tgAuthResult, firstName }: { tgData: TgData; tgAuthResult: string | null; firstName: string }) {
  const router = useRouter();
  const [tab,        setTab]        = useState<'link' | 'new'>('link');
  const [email,      setEmail]      = useState('');
  const [password,   setPassword]   = useState('');
  const [showPw,     setShowPw]     = useState(false);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState('');

  async function handleLink(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Step 1: link via API
    const res = await fetch('/api/auth/telegram-link', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ telegramData: tgData, email, password }),
    });
    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? 'Ошибка привязки');
      setLoading(false);
      return;
    }

    // Step 2: sign in with existing credentials
    const result = await signIn('credentials', { email, password, redirect: false });
    if (result?.ok) {
      router.replace('/library');
    } else {
      setError('Не удалось войти после привязки');
      setLoading(false);
    }
  }

  async function handleCreateNew() {
    setLoading(true);
    const signInArgs = tgAuthResult ? { tgAuthResult } : { ...tgData };
    const result = await signIn('telegram', { ...signInArgs, redirect: false });
    if (result?.ok) {
      router.replace('/library');
    } else {
      setError('Не удалось создать аккаунт');
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4"
         style={{ background: '#03020A', paddingTop: '80px', paddingBottom: '80px' }}>

      {/* ambient glow */}
      <div className="fixed inset-0 pointer-events-none">
        <div style={{ position: 'absolute', top: '30%', left: '50%', width: '400px', height: '400px',
                      background: 'radial-gradient(circle, rgba(6,182,212,0.08) 0%, transparent 65%)',
                      filter: 'blur(40px)', transform: 'translate(-50%,-50%)' }} />
      </div>

      <div className="relative z-10 w-full max-w-sm">

        {/* Telegram avatar + greeting */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col items-center mb-8"
        >
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-3"
               style={{
                 background: 'linear-gradient(135deg, rgba(6,182,212,0.2), rgba(6,182,212,0.05))',
                 border: '1px solid rgba(6,182,212,0.35)',
                 boxShadow: '0 0 30px rgba(6,182,212,0.15)',
               }}>
            <svg width="30" height="30" viewBox="0 0 24 24" fill="#22D3EE">
              <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
            </svg>
          </div>
          <p className="font-heading font-bold text-white" style={{ fontSize: '20px' }}>
            Привет, {firstName}!
          </p>
          <p className="font-body text-[#6B7280] text-center mt-1" style={{ fontSize: '13px' }}>
            Вы вошли через Telegram.<br />Как продолжить?
          </p>
        </motion.div>

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.1 }}
          className="rounded-2xl p-6 relative"
          style={{
            background: 'rgba(10,9,18,0.95)',
            border: '1px solid rgba(124,58,237,0.2)',
            boxShadow: '0 24px 80px rgba(0,0,0,0.7)',
          }}
        >
          <div className="absolute top-0 left-0 right-0 h-px rounded-t-2xl"
               style={{ background: 'linear-gradient(90deg, transparent, rgba(6,182,212,0.5) 50%, transparent)' }} />

          {/* Tabs */}
          <div className="flex gap-1 rounded-xl p-1 mb-5"
               style={{ background: '#09090E', border: '1px solid rgba(255,255,255,0.06)' }}>
            {([
              { key: 'link' as const, label: 'Привязать к аккаунту', icon: Link2 },
              { key: 'new'  as const, label: 'Новый аккаунт',        icon: UserPlus },
            ]).map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => { setTab(key); setError(''); }}
                className="flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2 font-heading font-semibold transition-all duration-200"
                style={{
                  fontSize: '11.5px',
                  color:      tab === key ? '#fff' : '#4B5563',
                  background: tab === key ? 'rgba(124,58,237,0.25)' : 'transparent',
                  border:     tab === key ? '1px solid rgba(124,58,237,0.35)' : '1px solid transparent',
                }}
              >
                <Icon style={{ width: '12px', height: '12px' }} />
                {label}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {tab === 'link' ? (
              <motion.div key="link"
                initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }} transition={{ duration: 0.2 }}>

                <p className="font-body text-[#6B7280] mb-4" style={{ fontSize: '12.5px' }}>
                  Введите email и пароль от существующего аккаунта — Telegram будет привязан к нему.
                </p>

                <form onSubmit={handleLink} className="space-y-3">
                  {/* Email */}
                  <div>
                    <label className="font-body text-[#9CA3AF] block mb-1" style={{ fontSize: '12px' }}>Email</label>
                    <div className="flex items-center gap-2 rounded-xl px-3 py-3"
                         style={{ background: '#09090E', border: '1px solid rgba(255,255,255,0.08)' }}>
                      <Mail style={{ width: '14px', height: '14px', color: '#4B5563', flexShrink: 0 }} />
                      <input
                        type="email"
                        value={email}
                        onChange={e => { setEmail(e.target.value); setError(''); }}
                        placeholder="your@email.com"
                        className="flex-1 bg-transparent outline-none font-body text-white placeholder-[#374151]"
                        style={{ fontSize: '13px' }}
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div>
                    <label className="font-body text-[#9CA3AF] block mb-1" style={{ fontSize: '12px' }}>Пароль</label>
                    <div className="flex items-center gap-2 rounded-xl px-3 py-3"
                         style={{ background: '#09090E', border: '1px solid rgba(255,255,255,0.08)' }}>
                      <Lock style={{ width: '14px', height: '14px', color: '#4B5563', flexShrink: 0 }} />
                      <input
                        type={showPw ? 'text' : 'password'}
                        value={password}
                        onChange={e => { setPassword(e.target.value); setError(''); }}
                        placeholder="••••••••"
                        className="flex-1 bg-transparent outline-none font-body text-white placeholder-[#374151]"
                        style={{ fontSize: '13px' }}
                      />
                      <button type="button" onClick={() => setShowPw(!showPw)}
                              className="text-[#4B5563] hover:text-[#9CA3AF] transition-colors">
                        {showPw
                          ? <EyeOff style={{ width: '14px', height: '14px' }} />
                          : <Eye    style={{ width: '14px', height: '14px' }} />}
                      </button>
                    </div>
                  </div>

                  {/* Error */}
                  <AnimatePresence>
                    {error && (
                      <motion.p
                        initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                        className="font-body rounded-xl px-4 py-2.5"
                        style={{ fontSize: '12px', color: '#F87171',
                                 background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
                        {error}
                      </motion.p>
                    )}
                  </AnimatePresence>

                  <button
                    type="submit"
                    disabled={loading || !email || !password}
                    className="w-full rounded-xl font-heading font-semibold text-white py-3"
                    style={{
                      fontSize: '13.5px',
                      background: loading ? 'rgba(124,58,237,0.3)' : 'linear-gradient(135deg, #7C3AED, #5B21B6)',
                      boxShadow: loading ? 'none' : '0 0 20px rgba(124,58,237,0.3)',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      opacity: (!email || !password) ? 0.5 : 1,
                    }}
                  >
                    {loading ? 'Привязываем…' : 'Привязать и войти'}
                  </button>
                </form>
              </motion.div>
            ) : (
              <motion.div key="new"
                initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.2 }}>

                <p className="font-body text-[#6B7280] mb-5" style={{ fontSize: '12.5px' }}>
                  Будет создан новый аккаунт с вашим Telegram-профилем. Вы получите <span style={{ color: '#9D60FA' }}>500 ARC монет</span> в подарок.
                </p>

                <AnimatePresence>
                  {error && (
                    <motion.p
                      initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      className="font-body rounded-xl px-4 py-2.5 mb-3"
                      style={{ fontSize: '12px', color: '#F87171',
                               background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
                      {error}
                    </motion.p>
                  )}
                </AnimatePresence>

                <button
                  onClick={handleCreateNew}
                  disabled={loading}
                  className="w-full rounded-xl font-heading font-semibold text-white py-3"
                  style={{
                    fontSize: '13.5px',
                    background: loading
                      ? 'rgba(6,182,212,0.15)'
                      : 'linear-gradient(135deg, rgba(6,182,212,0.25), rgba(124,58,237,0.25))',
                    border: '1px solid rgba(6,182,212,0.35)',
                    cursor: loading ? 'not-allowed' : 'pointer',
                  }}
                >
                  {loading ? 'Создаём аккаунт…' : 'Создать новый аккаунт'}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        <p className="text-center mt-4 font-body text-[#374151] cursor-pointer hover:text-[#6B7280] transition-colors"
           style={{ fontSize: '12px' }}
           onClick={() => router.replace('/login')}>
          Отмена — вернуться на вход
        </p>
      </div>
    </div>
  );
}

/* ─── Main component ──────────────────────────────────────── */
function TelegramCallbackInner() {
  const router  = useRouter();
  const params  = useSearchParams();
  const didRun  = useRef(false);

  const [state, setState] = useState<
    | { phase: 'loading' }
    | { phase: 'choose'; tgData: TgData; tgAuthResult: string | null; firstName: string }
    | { phase: 'error';  msg: string }
  >({ phase: 'loading' });

  useEffect(() => {
    if (didRun.current) return;
    didRun.current = true;

    async function run() {
      // 1. Decode Telegram data
      // Telegram may pass tgAuthResult in query (?tgAuthResult=) or in hash (#tgAuthResult=)
      const hashParams = new URLSearchParams(
        typeof window !== 'undefined' ? window.location.hash.replace(/^#/, '') : ''
      );
      const tgAuthResult = params.get('tgAuthResult') || hashParams.get('tgAuthResult');
      let tgData: TgData | null = null;

      if (tgAuthResult) {
        try {
          const json = decodeBase64Url(tgAuthResult);
          const parsed = JSON.parse(json);
          tgData = {};
          for (const [k, v] of Object.entries(parsed)) tgData[k] = String(v);
        } catch {
          setState({ phase: 'error', msg: 'Не удалось декодировать ответ от Telegram' });
          return;
        }
      } else {
        // Classic redirect: id + hash as plain query params
        const id   = params.get('id')   || hashParams.get('id');
        const hash = params.get('hash') || hashParams.get('hash');
        if (id && hash) {
          tgData = {};
          // merge both query and hash params
          params.forEach((v, k)     => { tgData![k] = v; });
          hashParams.forEach((v, k) => { if (!tgData![k]) tgData![k] = v; });
        }
      }

      if (!tgData?.id || !tgData?.hash) {
        setState({ phase: 'error', msg: 'Telegram не вернул данные авторизации. Попробуйте ещё раз.' });
        return;
      }

      // 2. Check if Telegram ID already linked
      const check = await fetch(`/api/auth/check-telegram?telegramId=${tgData.id}`).then(r => r.json());

      if (check.linked) {
        // Already linked — sign in directly using raw tgAuthResult if available
        const signInArgs = tgAuthResult ? { tgAuthResult } : { ...tgData };
        const result = await signIn('telegram', { ...signInArgs, redirect: false });
        if (result?.ok) {
          router.replace('/library');
        } else {
          setState({ phase: 'error', msg: `Ошибка входа: ${result?.error ?? 'unknown'}` });
        }
        return;
      }

      // 3. Not linked — show choice screen
      setState({ phase: 'choose', tgData, tgAuthResult: tgAuthResult ?? null, firstName: tgData.first_name ?? 'пользователь' });
    }

    run().catch(e => setState({ phase: 'error', msg: String(e) }));
  }, [params, router]);

  if (state.phase === 'loading') return <LoadingScreen />;

  if (state.phase === 'error') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-6"
           style={{ background: '#03020A' }}>
        <p className="font-heading font-semibold text-red-400" style={{ fontSize: '16px' }}>
          Ошибка входа через Telegram
        </p>
        <pre className="font-body text-[#9CA3AF] rounded-xl p-4 max-w-lg w-full overflow-auto text-left"
             style={{ fontSize: '11px', background: '#09090E', border: '1px solid rgba(255,255,255,0.07)', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
          {state.msg}
        </pre>
        <button onClick={() => router.replace('/login')}
                className="font-heading text-white rounded-xl px-6 py-2.5"
                style={{ background: 'rgba(124,58,237,0.25)', border: '1px solid rgba(124,58,237,0.4)', fontSize: '13px' }}>
          Вернуться на вход
        </button>
      </div>
    );
  }

  return <LinkOrCreateScreen tgData={state.tgData} tgAuthResult={state.tgAuthResult} firstName={state.firstName} />;
}

export default function TelegramCallbackPage() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <TelegramCallbackInner />
    </Suspense>
  );
}
