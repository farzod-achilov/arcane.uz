'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, Send, Gamepad2, Zap, Shield } from 'lucide-react';
import { useUser } from '@/lib/userContext';
import CheckoutInput from '@/components/checkout/CheckoutInput';

/* ── Floating particle ─────────────────────────────────── */
function Particle({ delay, x, y, size, color }: {
  delay: number; x: number; y: number; size: number; color: string;
}) {
  return (
    <motion.div
      className="absolute rounded-full pointer-events-none"
      style={{ left: `${x}%`, top: `${y}%`, width: size, height: size, background: color }}
      animate={{
        y: [-20, -60, -20],
        opacity: [0, 0.6, 0],
        scale: [0.5, 1, 0.5],
      }}
      transition={{
        duration: 4 + delay,
        repeat: Infinity,
        delay: delay,
        ease: 'easeInOut',
      }}
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
  const [email,    setEmail]   = useState('');
  const [password, setPassword]= useState('');
  const [showPw,   setShowPw]  = useState(false);
  const [loading,  setLoading] = useState(false);
  const [error,    setError]   = useState('');
  const [remember, setRemember]= useState(false);
  const [mounted,  setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email || password.length < 3) { setError('Введите email и пароль'); return; }
    setLoading(true);
    const ok = await login(email, password);
    setLoading(false);
    if (ok) router.push('/dashboard');
    else setError('Неверный email или пароль');
  };

  const handleDemo = async () => {
    setLoading(true);
    await login('demo@arcane.uz', 'demo123');
    setLoading(false);
    router.push('/dashboard');
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
        <div style={{ position: 'absolute', top: '60%', left: '50%', width: '500px', height: '200px',
                      background: 'radial-gradient(ellipse, rgba(124,58,237,0.06) 0%, transparent 70%)',
                      filter: 'blur(30px)', transform: 'translate(-50%,-50%)' }} />
      </div>

      {/* ── Grid ── */}
      <div className="fixed inset-0 pointer-events-none"
           style={{
             backgroundImage: 'linear-gradient(rgba(124,58,237,1) 1px, transparent 1px), linear-gradient(90deg, rgba(124,58,237,1) 1px, transparent 1px)',
             backgroundSize: '52px 52px', opacity: 0.022,
           }} />

      {/* ── Scanlines ── */}
      <div className="fixed inset-0 pointer-events-none"
           style={{ backgroundImage: 'repeating-linear-gradient(to bottom, transparent 0px, transparent 3px, rgba(0,0,0,0.04) 3px, rgba(0,0,0,0.04) 4px)' }} />

      {/* ── Particles ── */}
      {mounted && PARTICLES.map((p, i) => <Particle key={i} {...p} />)}

      {/* ── Corner decorations ── */}
      <div className="fixed top-24 left-6 pointer-events-none hidden lg:block">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            animate={{ opacity: [0.15, 0.4, 0.15] }}
            transition={{ duration: 2.5 + i, repeat: Infinity, delay: i * 0.8 }}
            style={{
              width: '1px', height: '30px', marginBottom: '8px',
              background: 'linear-gradient(180deg, transparent, #7C3AED, transparent)',
            }}
          />
        ))}
      </div>
      <div className="fixed bottom-24 right-6 pointer-events-none hidden lg:block">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            animate={{ opacity: [0.15, 0.4, 0.15] }}
            transition={{ duration: 2 + i, repeat: Infinity, delay: i * 0.6 }}
            style={{
              width: '1px', height: '30px', marginBottom: '8px',
              background: 'linear-gradient(180deg, transparent, #06B6D4, transparent)',
            }}
          />
        ))}
      </div>

      <div className="relative z-10 w-full max-w-sm">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col items-center mb-8"
        >
          <Link href="/">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo_header.png"
              alt="ARCANE.UZ"
              className="hover:opacity-90 transition-opacity"
              style={{
                width: '180px', height: '56px', objectFit: 'cover', objectPosition: 'center 35%',
                filter: 'drop-shadow(0 0 10px rgba(124,58,237,0.7)) drop-shadow(0 0 28px rgba(124,58,237,0.3))',
              }}
            />
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
          style={{
            background: 'rgba(10,9,18,0.95)',
            border: '1px solid rgba(124,58,237,0.25)',
            boxShadow: '0 24px 80px rgba(0,0,0,0.7), 0 0 60px rgba(124,58,237,0.07)',
            backdropFilter: 'blur(20px)',
          }}
        >
          {/* Top glow line */}
          <div className="absolute top-0 left-0 right-0 h-px rounded-t-2xl"
               style={{ background: 'linear-gradient(90deg, transparent, rgba(124,58,237,0.65) 30%, rgba(6,182,212,0.45) 70%, transparent)' }} />
          {/* Inner ambient */}
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

            {/* Demo shortcut */}
            <motion.button
              whileHover={{ scale: 1.015 }}
              whileTap={{ scale: 0.985 }}
              onClick={handleDemo}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2.5 rounded-xl font-heading font-semibold text-white mb-5 relative overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, rgba(124,58,237,0.18), rgba(6,182,212,0.12))',
                border: '1px solid rgba(124,58,237,0.32)',
                padding: '11px',
                fontSize: '13px',
                boxShadow: '0 0 20px rgba(124,58,237,0.08)',
              }}
            >
              <span className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity"
                    style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.12), transparent)' }} />
              <Gamepad2 style={{ width: '15px', height: '15px', color: '#9D60FA' }} />
              <span className="relative z-10">Войти как Demo-игрок</span>
            </motion.button>

            <div className="flex items-center gap-3 mb-5">
              <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
              <span className="font-body text-[#2D2D44]" style={{ fontSize: '11px' }}>или через email</span>
              <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <CheckoutInput
                label="Email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                icon={<Mail style={{ width: '15px', height: '15px' }} />}
              />

              <div className="relative">
                <CheckoutInput
                  label="Пароль"
                  type={showPw ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  icon={<Lock style={{ width: '15px', height: '15px' }} />}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3.5 text-[#4B5563] hover:text-[#9CA3AF] transition-colors"
                  style={{ bottom: '12px' }}
                >
                  {showPw
                    ? <EyeOff style={{ width: '15px', height: '15px' }} />
                    : <Eye style={{ width: '15px', height: '15px' }} />}
                </button>
              </div>

              {/* Remember + Forgot */}
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <div
                    onClick={() => setRemember(!remember)}
                    className="w-4 h-4 rounded flex items-center justify-center transition-all duration-200 cursor-pointer"
                    style={{
                      background: remember ? '#7C3AED' : 'transparent',
                      border: `1px solid ${remember ? '#7C3AED' : 'rgba(255,255,255,0.15)'}`,
                      boxShadow: remember ? '0 0 8px rgba(124,58,237,0.5)' : 'none',
                    }}
                  >
                    {remember && <span style={{ color: '#fff', fontSize: '9px' }}>✓</span>}
                  </div>
                  <span className="font-body text-[#6B7280]" style={{ fontSize: '12.5px' }}>Запомнить</span>
                </label>
                <Link href="#"
                      className="font-body text-[#4B5563] hover:text-[#7C3AED] transition-colors"
                      style={{ fontSize: '12.5px' }}>
                  Забыли пароль?
                </Link>
              </div>

              {/* Error */}
              <AnimatePresence>
                {error && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="font-body text-[#F87171] text-center"
                    style={{ fontSize: '12.5px' }}
                  >
                    {error}
                  </motion.p>
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
                  padding: '13px',
                  fontSize: '14px',
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
                      ВХОД...
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
              {[
                { label: 'Telegram', icon: Send,     hoverBorder: 'rgba(6,182,212,0.4)',   hoverColor: '#22D3EE' },
                { label: 'Steam',    icon: Gamepad2,  hoverBorder: 'rgba(102,192,244,0.4)', hoverColor: '#66C0F4' },
              ].map(({ label, icon: Icon, hoverBorder, hoverColor }) => (
                <button
                  key={label}
                  className="flex items-center justify-center gap-2 rounded-xl font-heading font-medium transition-all duration-200"
                  style={{
                    background: '#09090E',
                    border: '1px solid rgba(255,255,255,0.07)',
                    padding: '10px',
                    fontSize: '12.5px',
                    color: '#9CA3AF',
                  }}
                  onMouseEnter={(e) => {
                    const el = e.currentTarget as HTMLElement;
                    el.style.borderColor = hoverBorder;
                    el.style.color = hoverColor;
                    el.style.boxShadow = `0 0 14px ${hoverBorder}`;
                  }}
                  onMouseLeave={(e) => {
                    const el = e.currentTarget as HTMLElement;
                    el.style.borderColor = 'rgba(255,255,255,0.07)';
                    el.style.color = '#9CA3AF';
                    el.style.boxShadow = 'none';
                  }}
                >
                  <Icon style={{ width: '14px', height: '14px' }} />
                  {label}
                </button>
              ))}
            </div>

            {/* Trust badges */}
            <div className="flex items-center justify-center gap-4 mt-5 pt-5"
                 style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
              {[
                { icon: Shield, text: 'SSL защита' },
                { icon: Zap, text: 'Мгновенный вход' },
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
