'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, Send, Gamepad2, Zap, Shield } from 'lucide-react';
import { toast } from 'sonner';
import { useUser } from '@/lib/userContext';
import CheckoutInput from '@/components/checkout/CheckoutInput';
import TurnstileWidget from '@/components/ui/TurnstileWidget';

const TG_BOT_ID = process.env.NEXT_PUBLIC_TELEGRAM_BOT_ID ?? '8889652013';
const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? '';

/* ── Floating particle ─────────────────────────────────── */
function Particle({ delay, x, y, size, color }: {
  delay: number; x: number; y: number; size: number; color: string;
}) {
  return (
    <motion.div
      className="absolute rounded-full pointer-events-none"
      style={{ left: `${x}%`, top: `${y}%`, width: size, height: size, background: color }}
      animate={{ y: [-20, -60, -20], opacity: [0, 0.6, 0], scale: [0.5, 1, 0.5] }}
      transition={{ duration: 4 + delay, repeat: Infinity, delay, ease: 'easeInOut' }}
    />
  );
}

const PARTICLES = [
  { x: 10, y: 80, size: 3, color: 'rgba(124,58,237,0.7)', delay: 0   },
  { x: 25, y: 60, size: 2, color: 'rgba(6,182,212,0.6)',  delay: 1.5 },
  { x: 70, y: 75, size: 4, color: 'rgba(124,58,237,0.5)', delay: 0.8 },
  { x: 85, y: 50, size: 2, color: 'rgba(6,182,212,0.8)',  delay: 2.2 },
  { x: 50, y: 90, size: 3, color: 'rgba(245,158,11,0.5)', delay: 1.0 },
  { x: 35, y: 40, size: 2, color: 'rgba(124,58,237,0.4)', delay: 3.1 },
  { x: 90, y: 30, size: 3, color: 'rgba(6,182,212,0.5)',  delay: 1.8 },
  { x: 15, y: 20, size: 2, color: 'rgba(245,158,11,0.6)', delay: 2.7 },
];

export default function LoginPage() {
  const { login } = useUser();
  const router    = useRouter();
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [showPw,   setShowPw]   = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');
  const [remember, setRemember] = useState(false);
  const [mounted,  setMounted]  = useState(false);
  const [turnstileToken, setTurnstileToken] = useState('');

  useEffect(() => setMounted(true), []);

  function openSteamLogin() {
    const appUrl   = process.env.NEXT_PUBLIC_APP_URL ?? window.location.origin;
    const returnTo = `${appUrl}/api/auth/steam-callback`;
    window.location.href = [
      'https://steamcommunity.com/openid/login',
      '?openid.ns=http://specs.openid.net/auth/2.0',
      '&openid.mode=checkid_setup',
      `&openid.return_to=${encodeURIComponent(returnTo)}`,
      `&openid.realm=${encodeURIComponent(appUrl)}`,
      '&openid.identity=http://specs.openid.net/auth/2.0/identifier_select',
      '&openid.claimed_id=http://specs.openid.net/auth/2.0/identifier_select',
    ].join('');
  }

  function openTelegramLogin() {
    if (!TG_BOT_ID) {
      toast.error('Telegram вход не настроен');
      return;
    }
    const appUrl   = process.env.NEXT_PUBLIC_APP_URL ?? window.location.origin;
    const returnTo = `${appUrl}/auth/telegram-callback`;
    const url = [
      'https://oauth.telegram.org/auth',
      `?client_id=${TG_BOT_ID}`,
      `&origin=${encodeURIComponent(appUrl)}`,
      `&return_to=${encodeURIComponent(returnTo)}`,
      '&scope=openid+profile',
    ].join('');
    window.location.href = url;
  }

  const validate = (): string | null => {
    if (!email.trim())               return 'Введите email';
    if (!/\S+@\S+\.\S+/.test(email)) return 'Некорректный email';
    if (password.length < 6)         return 'Пароль минимум 6 символов';
    if (TURNSTILE_SITE_KEY && !turnstileToken) return 'Подтвердите, что вы не робот';
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const err = validate();
    if (err) { setError(err); return; }
    setError('');
    setLoading(true);

    const toastId = toast.loading('Выполняем вход…');
    const ok = await login(email.trim(), password, turnstileToken || undefined);
    setLoading(false);

    if (ok) {
      toast.success('Добро пожаловать!', { id: toastId });
      router.push('/library');
    } else {
      toast.error('Неверный email или пароль', { id: toastId });
      setError('Неверный email или пароль');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden"
         style={{ background: '#03020A', paddingTop: '80px', paddingBottom: '80px' }}>

      {/* ── Ambient glows ── */}
      <div className="fixed inset-0 pointer-events-none">
        <div style={{ position: 'absolute', top: '20%', left: '15%', width: '400px', height: '400px',
                      background: 'radial-gradient(circle, rgba(124,58,237,0.12) 0%, transparent 65%)',
                      filter: 'blur(40px)', transform: 'translate(-50%,-50%)' }} />
        <div style={{ position: 'absolute', bottom: '25%', right: '15%', width: '320px', height: '320px',
                      background: 'radial-gradient(circle, rgba(6,182,212,0.09) 0%, transparent 65%)',
                      filter: 'blur(40px)', transform: 'translate(50%,50%)' }} />
      </div>

      {/* ── Grid ── */}
      <div className="fixed inset-0 pointer-events-none"
           style={{ backgroundImage: 'linear-gradient(rgba(124,58,237,1) 1px, transparent 1px), linear-gradient(90deg, rgba(124,58,237,1) 1px, transparent 1px)',
                    backgroundSize: '52px 52px', opacity: 0.022 }} />
      <div className="fixed inset-0 pointer-events-none"
           style={{ backgroundImage: 'repeating-linear-gradient(to bottom, transparent 0px, transparent 3px, rgba(0,0,0,0.04) 3px, rgba(0,0,0,0.04) 4px)' }} />

      {mounted && PARTICLES.map((p, i) => <Particle key={i} {...p} />)}

      <div className="relative z-10 w-full max-w-sm min-w-0">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col items-center mb-8"
        >
          <Link href="/">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo_header.png" alt="ARCANE.UZ" className="hover:opacity-90 transition-opacity"
                 style={{ width: '180px', height: '56px', objectFit: 'cover', objectPosition: 'center 35%',
                          filter: 'drop-shadow(0 0 10px rgba(124,58,237,0.7)) drop-shadow(0 0 28px rgba(124,58,237,0.3))' }} />
          </Link>
          <p className="font-pixel mt-3"
             style={{ fontSize: '7px', color: 'rgba(124,58,237,0.5)', letterSpacing: '0.15em' }}>
            ПРЕМИАЛЬНЫЙ ИГРОВОЙ МАГАЗИН
          </p>
        </motion.div>

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="rounded-2xl p-6 relative"
          style={{ background: 'rgba(10,9,18,0.95)', border: '1px solid rgba(124,58,237,0.25)',
                   boxShadow: '0 24px 80px rgba(0,0,0,0.7), 0 0 60px rgba(124,58,237,0.07)',
                   backdropFilter: 'blur(20px)' }}
        >
          <div className="absolute top-0 left-0 right-0 h-px rounded-t-2xl"
               style={{ background: 'linear-gradient(90deg, transparent, rgba(124,58,237,0.65) 30%, rgba(6,182,212,0.45) 70%, transparent)' }} />
          <div className="absolute inset-0 rounded-2xl pointer-events-none"
               style={{ background: 'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(124,58,237,0.06) 0%, transparent 65%)' }} />

          <div className="relative z-10">
            <h1 className="font-heading font-bold text-white mb-1" style={{ fontSize: '22px' }}>
              Вход в аккаунт
            </h1>
            <p className="font-body text-[#6B7280] mb-6" style={{ fontSize: '13.5px' }}>
              Нет аккаунта?{' '}
              <Link href="/register" className="text-[#7C3AED] hover:text-[#9D60FA] transition-colors font-medium">
                Зарегистрироваться
              </Link>
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <CheckoutInput
                label="Email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(''); }}
                icon={<Mail style={{ width: '15px', height: '15px' }} />}
              />

              <div className="relative">
                <CheckoutInput
                  label="Пароль"
                  type={showPw ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(''); }}
                  icon={<Lock style={{ width: '15px', height: '15px' }} />}
                />
                <button type="button" onClick={() => setShowPw(!showPw)}
                        className="absolute right-3.5 text-[#4B5563] hover:text-[#9CA3AF] transition-colors"
                        style={{ bottom: '12px' }}>
                  {showPw ? <EyeOff style={{ width: '15px', height: '15px' }} />
                           : <Eye   style={{ width: '15px', height: '15px' }} />}
                </button>
              </div>

              {/* Remember + Forgot */}
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <div onClick={() => setRemember(!remember)}
                       className="w-4 h-4 rounded flex items-center justify-center transition-all duration-200 cursor-pointer"
                       style={{ background: remember ? '#7C3AED' : 'transparent',
                                border: `1px solid ${remember ? '#7C3AED' : 'rgba(255,255,255,0.15)'}`,
                                boxShadow: remember ? '0 0 8px rgba(124,58,237,0.5)' : 'none' }}>
                    {remember && <span style={{ color: '#fff', fontSize: '9px' }}>✓</span>}
                  </div>
                  <span className="font-body text-[#6B7280]" style={{ fontSize: '12.5px' }}>Запомнить</span>
                </label>
                <Link href="/forgot-password" className="font-body text-[#4B5563] hover:text-[#7C3AED] transition-colors"
                      style={{ fontSize: '12.5px' }}>
                  Забыли пароль?
                </Link>
              </div>

              {TURNSTILE_SITE_KEY && (
                <div className="flex justify-center">
                  <TurnstileWidget
                    siteKey={TURNSTILE_SITE_KEY}
                    onVerify={(token) => { setTurnstileToken(token); setError(''); }}
                    onExpire={() => setTurnstileToken('')}
                  />
                </div>
              )}

              {/* Inline error */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-2 rounded-xl px-4 py-3"
                    style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)' }}
                  >
                    <span style={{ color: '#F87171', fontSize: '12.5px' }} className="font-body">{error}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Submit */}
              <motion.button
                type="submit"
                whileHover={!loading ? { scale: 1.015 } : {}}
                whileTap={!loading ? { scale: 0.985 } : {}}
                disabled={loading}
                className="w-full relative overflow-hidden rounded-xl font-heading font-semibold text-white flex items-center justify-center gap-2"
                style={{
                  background: loading ? 'rgba(124,58,237,0.35)' : 'linear-gradient(135deg, #7C3AED, #5B21B6)',
                  padding: '13px', fontSize: '14px',
                  boxShadow: loading ? 'none' : '0 0 0 1px rgba(124,58,237,0.45), 0 4px 24px rgba(124,58,237,0.3)',
                  cursor: loading ? 'not-allowed' : 'pointer',
                }}
              >
                {!loading && (
                  <span className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity"
                        style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.08), transparent 55%)' }} />
                )}
                <AnimatePresence mode="wait">
                  {loading ? (
                    <motion.span key="load" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                 className="font-pixel" style={{ fontSize: '8px', letterSpacing: '0.1em' }}>
                      ВХОД…
                    </motion.span>
                  ) : (
                    <motion.span key="text" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                      Войти
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>
            </form>

            {/* Social */}
            <div className="flex items-center gap-3 my-5">
              <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.05)' }} />
              <span className="font-body text-[#2D2D44]" style={{ fontSize: '11px' }}>или войти через</span>
              <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.05)' }} />
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {/* Telegram */}
              <button
                onClick={openTelegramLogin}
                className="flex items-center justify-center gap-2 rounded-xl font-heading font-medium transition-all duration-200"
                style={{ background: '#09090E', border: '1px solid rgba(255,255,255,0.07)',
                         padding: '10px', fontSize: '12.5px', color: '#9CA3AF' }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.borderColor = 'rgba(6,182,212,0.4)'; el.style.color = '#22D3EE';
                  el.style.boxShadow = '0 0 14px rgba(6,182,212,0.4)';
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.borderColor = 'rgba(255,255,255,0.07)';
                  el.style.color = '#9CA3AF'; el.style.boxShadow = 'none';
                }}
              >
                <Send style={{ width: '14px', height: '14px' }} />
                Telegram
              </button>

              {/* Steam */}
              <button
                onClick={openSteamLogin}
                className="flex items-center justify-center gap-2 rounded-xl font-heading font-medium transition-all duration-200"
                style={{ background: '#09090E', border: '1px solid rgba(255,255,255,0.07)',
                         padding: '10px', fontSize: '12.5px', color: '#9CA3AF' }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.borderColor = 'rgba(102,192,244,0.4)'; el.style.color = '#66C0F4';
                  el.style.boxShadow = '0 0 14px rgba(102,192,244,0.4)';
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.borderColor = 'rgba(255,255,255,0.07)';
                  el.style.color = '#9CA3AF'; el.style.boxShadow = 'none';
                }}
              >
                <Gamepad2 style={{ width: '14px', height: '14px' }} />
                Steam
              </button>
            </div>

            {/* Trust badges */}
            <div className="flex items-center justify-center gap-4 mt-5 pt-5"
                 style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
              {[
                { icon: Shield, text: 'SSL защита' },
                { icon: Zap,    text: 'Мгновенный вход' },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-1.5">
                  <Icon style={{ width: '11px', height: '11px', color: '#374151' }} />
                  <span className="font-body text-[#2D2D44]" style={{ fontSize: '10.5px' }}>{text}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
