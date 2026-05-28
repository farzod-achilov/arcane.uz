'use client';

import { useEffect, useRef, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, UserPlus, Link2 } from 'lucide-react';

function SteamIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="#66C0F4">
      <path d="M11.979 0C5.678 0 .511 4.86.022 11.037l6.432 2.658c.545-.371 1.203-.59 1.912-.59.063 0 .125.004.187.008l2.861-4.142V8.91c0-2.495 2.028-4.524 4.524-4.524 2.494 0 4.524 2.031 4.524 4.527s-2.03 4.525-4.524 4.525h-.105l-4.076 2.911c0 .052.004.105.004.159 0 1.875-1.515 3.396-3.39 3.396-1.635 0-3.016-1.173-3.331-2.727L.436 15.27C1.862 20.307 6.486 24 11.979 24c6.627 0 11.999-5.373 11.999-12S18.605 0 11.979 0z"/>
    </svg>
  );
}

type SteamData = { steamId: string; displayName: string; avatar?: string };

function LinkOrCreateScreen({ steamData }: { steamData: SteamData }) {
  const router   = useRouter();
  const [tab,        setTab]      = useState<'link' | 'new'>('link');
  const [email,      setEmail]    = useState('');
  const [password,   setPassword] = useState('');
  const [showPw,     setShowPw]   = useState(false);
  const [loading,    setLoading]  = useState(false);
  const [error,      setError]    = useState('');

  async function handleLink(e: React.FormEvent) {
    e.preventDefault();
    setError(''); setLoading(true);

    const res  = await fetch('/api/auth/steam-link', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ steamData, email, password }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error ?? 'Ошибка'); return; }

    const result = await signIn('credentials', { email, password, redirect: false });
    if (result?.ok) router.replace('/library');
    else { setError('Не удалось войти после привязки'); }
  }

  async function handleCreateNew() {
    setLoading(true);
    const res  = await fetch('/api/auth/steam-create', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ steamData }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error ?? 'Ошибка'); setLoading(false); return; }

    const result = await signIn('steam', { steamId: steamData.steamId, redirect: false });
    if (result?.ok) router.replace('/library');
    else { setError('Не удалось войти'); setLoading(false); }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4"
         style={{ background: '#03020A', paddingTop: '80px', paddingBottom: '80px' }}>
      <div className="fixed inset-0 pointer-events-none">
        <div style={{ position: 'absolute', top: '30%', left: '50%', width: '400px', height: '400px',
                      background: 'radial-gradient(circle, rgba(102,192,244,0.07) 0%, transparent 65%)',
                      filter: 'blur(40px)', transform: 'translate(-50%,-50%)' }} />
      </div>

      <div className="relative z-10 w-full max-w-sm">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-3"
               style={{ background: 'rgba(102,192,244,0.1)', border: '1px solid rgba(102,192,244,0.3)' }}>
            <SteamIcon />
          </div>
          <p className="font-heading font-bold text-white" style={{ fontSize: '20px' }}>
            Привет, {steamData.displayName}!
          </p>
          <p className="font-body text-[#6B7280] text-center mt-1" style={{ fontSize: '13px' }}>
            Вы вошли через Steam. Как продолжить?
          </p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.45, delay: 0.1 }}
                    className="rounded-2xl p-6 relative"
                    style={{ background: 'rgba(10,9,18,0.95)', border: '1px solid rgba(102,192,244,0.2)',
                             boxShadow: '0 24px 80px rgba(0,0,0,0.7)' }}>
          <div className="absolute top-0 left-0 right-0 h-px rounded-t-2xl"
               style={{ background: 'linear-gradient(90deg, transparent, rgba(102,192,244,0.5) 50%, transparent)' }} />

          {/* Tabs */}
          <div className="flex gap-1 rounded-xl p-1 mb-5"
               style={{ background: '#09090E', border: '1px solid rgba(255,255,255,0.06)' }}>
            {([
              { key: 'link' as const, label: 'Привязать к аккаунту', icon: Link2 },
              { key: 'new'  as const, label: 'Новый аккаунт',        icon: UserPlus },
            ]).map(({ key, label, icon: Icon }) => (
              <button key={key} onClick={() => { setTab(key); setError(''); }}
                      className="flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2 font-heading font-semibold transition-all duration-200"
                      style={{
                        fontSize: '11.5px', color: tab === key ? '#fff' : '#4B5563',
                        background: tab === key ? 'rgba(102,192,244,0.15)' : 'transparent',
                        border:     tab === key ? '1px solid rgba(102,192,244,0.35)' : '1px solid transparent',
                      }}>
                <Icon style={{ width: '12px', height: '12px' }} />
                {label}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {tab === 'link' ? (
              <motion.form key="link" onSubmit={handleLink}
                           initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                           exit={{ opacity: 0, x: 10 }} transition={{ duration: 0.2 }}
                           className="space-y-3">
                <p className="font-body text-[#6B7280]" style={{ fontSize: '12.5px' }}>
                  Введите email и пароль от существующего аккаунта.
                </p>
                <div className="flex items-center gap-2 rounded-xl px-3 py-3"
                     style={{ background: '#09090E', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <Mail style={{ width: '14px', height: '14px', color: '#4B5563', flexShrink: 0 }} />
                  <input type="email" value={email}
                         onChange={e => { setEmail(e.target.value); setError(''); }}
                         placeholder="your@email.com"
                         className="flex-1 bg-transparent outline-none font-body text-white placeholder-[#374151]"
                         style={{ fontSize: '13px' }} />
                </div>
                <div className="flex items-center gap-2 rounded-xl px-3 py-3"
                     style={{ background: '#09090E', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <Lock style={{ width: '14px', height: '14px', color: '#4B5563', flexShrink: 0 }} />
                  <input type={showPw ? 'text' : 'password'} value={password}
                         onChange={e => { setPassword(e.target.value); setError(''); }}
                         placeholder="Пароль" className="flex-1 bg-transparent outline-none font-body text-white placeholder-[#374151]"
                         style={{ fontSize: '13px' }} />
                  <button type="button" onClick={() => setShowPw(!showPw)}
                          className="text-[#4B5563] hover:text-[#9CA3AF] transition-colors">
                    {showPw ? <EyeOff style={{ width: '14px', height: '14px' }} />
                            : <Eye   style={{ width: '14px', height: '14px' }} />}
                  </button>
                </div>
                <AnimatePresence>
                  {error && (
                    <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                              className="font-body rounded-xl px-4 py-2.5"
                              style={{ fontSize: '12px', color: '#F87171',
                                       background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
                      {error}
                    </motion.p>
                  )}
                </AnimatePresence>
                <button type="submit" disabled={loading || !email || !password}
                        className="w-full rounded-xl font-heading font-semibold text-white py-3"
                        style={{ fontSize: '13.5px', cursor: loading ? 'not-allowed' : 'pointer',
                                 background: loading ? 'rgba(102,192,244,0.2)' : 'linear-gradient(135deg, rgba(102,192,244,0.3), rgba(26,161,214,0.4))',
                                 border: '1px solid rgba(102,192,244,0.3)', opacity: (!email || !password) ? 0.5 : 1 }}>
                  {loading ? 'Привязываем…' : 'Привязать и войти'}
                </button>
              </motion.form>
            ) : (
              <motion.div key="new" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.2 }}>
                <p className="font-body text-[#6B7280] mb-5" style={{ fontSize: '12.5px' }}>
                  Создадим новый аккаунт с вашим Steam-профилем. Получите <span style={{ color: '#66C0F4' }}>500 ARC монет</span> в подарок.
                </p>
                <AnimatePresence>
                  {error && (
                    <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                              className="font-body rounded-xl px-4 py-2.5 mb-3"
                              style={{ fontSize: '12px', color: '#F87171',
                                       background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
                      {error}
                    </motion.p>
                  )}
                </AnimatePresence>
                <button onClick={handleCreateNew} disabled={loading}
                        className="w-full rounded-xl font-heading font-semibold text-white py-3"
                        style={{ fontSize: '13.5px', cursor: loading ? 'not-allowed' : 'pointer',
                                 background: 'linear-gradient(135deg, rgba(102,192,244,0.2), rgba(26,161,214,0.25))',
                                 border: '1px solid rgba(102,192,244,0.3)' }}>
                  {loading ? 'Создаём аккаунт…' : 'Создать новый аккаунт'}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
        <p className="text-center mt-4 font-body text-[#374151] cursor-pointer hover:text-[#6B7280] transition-colors"
           style={{ fontSize: '12px' }} onClick={() => router.replace('/login')}>
          Отмена — вернуться на вход
        </p>
      </div>
    </div>
  );
}

function Inner() {
  const router  = useRouter();
  const params  = useSearchParams();
  const didRun  = useRef(false);
  const [steamData, setSteamData] = useState<SteamData | null>(null);

  useEffect(() => {
    if (didRun.current) return;
    didRun.current = true;

    const data = params.get('data');
    if (!data) { router.replace('/login?error=steam'); return; }
    try {
      const base64 = data.replace(/-/g, '+').replace(/_/g, '/');
      const pad    = (4 - base64.length % 4) % 4;
      const parsed = JSON.parse(atob(base64 + '='.repeat(pad))) as SteamData & { ts: number };
      if (!parsed.steamId || Date.now() - parsed.ts > 600_000) throw new Error('expired');
      setSteamData({ steamId: parsed.steamId, displayName: parsed.displayName, avatar: parsed.avatar });
    } catch {
      router.replace('/login?error=steam');
    }
  }, [params, router]);

  if (!steamData) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#03020A' }}>
        <p className="text-white font-heading">Загрузка…</p>
      </div>
    );
  }

  return <LinkOrCreateScreen steamData={steamData} />;
}

export default function SteamCallbackPage() {
  return (
    <Suspense fallback={<div className="min-h-screen" style={{ background: '#03020A' }} />}>
      <Inner />
    </Suspense>
  );
}
