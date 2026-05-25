'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, User as UserIcon, Eye, EyeOff, Zap, Star, Gift } from 'lucide-react';
import { toast } from 'sonner';
import { useUser } from '@/lib/userContext';
import CheckoutInput from '@/components/checkout/CheckoutInput';

/* ── Floating star ─────────────────────────────────────── */
function FloatingStar({ x, y, delay, size }: { x: number; y: number; delay: number; size: number }) {
  return (
    <motion.div className="absolute pointer-events-none"
      style={{ left: `${x}%`, top: `${y}%`, fontSize: size }}
      animate={{ y: [-10, -40, -10], opacity: [0, 0.5, 0], rotate: [0, 180, 360] }}
      transition={{ duration: 5 + delay, repeat: Infinity, delay, ease: 'easeInOut' }}>
      ✦
    </motion.div>
  );
}

const STARS = [
  { x: 8,  y: 75, delay: 0,   size: 10 },
  { x: 90, y: 65, delay: 1.2, size: 8  },
  { x: 15, y: 40, delay: 2.4, size: 6  },
  { x: 80, y: 30, delay: 0.7, size: 10 },
  { x: 55, y: 85, delay: 3.1, size: 7  },
];

/* ── Password strength ─────────────────────────────────── */
function PasswordStrength({ password }: { password: string }) {
  const score = [
    password.length >= 6,
    password.length >= 8,
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
  ].filter(Boolean).length;

  const config = [
    { label: 'Слабый',     color: '#EF4444', bars: 1 },
    { label: 'Нормальный', color: '#F59E0B', bars: 2 },
    { label: 'Хороший',    color: '#22C55E', bars: 3 },
    { label: 'Сильный',    color: '#06B6D4', bars: 4 },
  ][score - 1] ?? null;

  if (!password) return null;

  return (
    <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="mt-2">
      <div className="flex gap-1 mb-1">
        {[1, 2, 3, 4].map((n) => (
          <div key={n} className="flex-1 h-1 rounded-full transition-all duration-300"
               style={{ background: config && n <= config.bars ? config.color : 'rgba(255,255,255,0.06)',
                        boxShadow: config && n <= config.bars ? `0 0 6px ${config.color}60` : 'none' }} />
        ))}
      </div>
      {config && (
        <p className="font-body" style={{ fontSize: '11px', color: config.color }}>
          {config.label} пароль
        </p>
      )}
    </motion.div>
  );
}

export default function RegisterPage() {
  const { register } = useUser();
  const router       = useRouter();
  const [name,     setName]    = useState('');
  const [email,    setEmail]   = useState('');
  const [password, setPassword]= useState('');
  const [showPw,   setShowPw]  = useState(false);
  const [agreed,   setAgreed]  = useState(false);
  const [loading,  setLoading] = useState(false);
  const [error,    setError]   = useState('');
  const [mounted,  setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const validate = (): string | null => {
    if (!name.trim() || name.trim().length < 2) return 'Имя минимум 2 символа';
    if (!email.includes('@'))                    return 'Введите корректный email';
    if (password.length < 6)                     return 'Пароль минимум 6 символов';
    if (!agreed)                                 return 'Примите условия использования';
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const err = validate();
    if (err) { setError(err); return; }
    setError('');
    setLoading(true);

    const toastId = toast.loading('Создаём аккаунт…');
    const result = await register(name.trim(), email.trim(), password);
    setLoading(false);

    if (result.ok) {
      toast.success('Аккаунт создан! +500 Arcane Coins', { id: toastId });
      router.push('/library');
    } else {
      toast.error(result.error ?? 'Ошибка регистрации', { id: toastId });
      setError(result.error ?? 'Ошибка регистрации');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden"
         style={{ background: '#03020A', paddingTop: '80px', paddingBottom: '80px' }}>

      {/* ── Ambient glows ── */}
      <div className="fixed inset-0 pointer-events-none">
        <div style={{ position: 'absolute', top: '30%', right: '10%', width: '380px', height: '380px',
                      background: 'radial-gradient(circle, rgba(6,182,212,0.1) 0%, transparent 65%)',
                      filter: 'blur(40px)', transform: 'translate(50%,-50%)' }} />
        <div style={{ position: 'absolute', bottom: '30%', left: '10%', width: '300px', height: '300px',
                      background: 'radial-gradient(circle, rgba(124,58,237,0.1) 0%, transparent 65%)',
                      filter: 'blur(40px)', transform: 'translate(-50%,50%)' }} />
      </div>

      {/* ── Grid ── */}
      <div className="fixed inset-0 pointer-events-none"
           style={{ backgroundImage: 'linear-gradient(rgba(6,182,212,1) 1px, transparent 1px), linear-gradient(90deg, rgba(6,182,212,1) 1px, transparent 1px)',
                    backgroundSize: '52px 52px', opacity: 0.015 }} />
      <div className="fixed inset-0 pointer-events-none"
           style={{ backgroundImage: 'repeating-linear-gradient(to bottom, transparent 0px, transparent 3px, rgba(0,0,0,0.04) 3px, rgba(0,0,0,0.04) 4px)' }} />

      {mounted && STARS.map((s, i) => <FloatingStar key={i} {...s} />)}

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
            <img src="/logo_header.png" alt="ARCANE.UZ" className="hover:opacity-90 transition-opacity"
                 style={{ width: '180px', height: '56px', objectFit: 'cover', objectPosition: 'center 35%',
                          filter: 'drop-shadow(0 0 10px rgba(6,182,212,0.6)) drop-shadow(0 0 28px rgba(124,58,237,0.3))' }} />
          </Link>
          <p className="font-pixel mt-3"
             style={{ fontSize: '7px', color: 'rgba(6,182,212,0.45)', letterSpacing: '0.15em' }}>
            СОЗДАТЬ АККАУНТ
          </p>
        </motion.div>

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="rounded-2xl p-6 relative"
          style={{ background: 'rgba(10,9,18,0.95)', border: '1px solid rgba(6,182,212,0.2)',
                   boxShadow: '0 24px 80px rgba(0,0,0,0.7), 0 0 60px rgba(6,182,212,0.05)',
                   backdropFilter: 'blur(20px)' }}
        >
          <div className="absolute top-0 left-0 right-0 h-px rounded-t-2xl"
               style={{ background: 'linear-gradient(90deg, transparent, rgba(6,182,212,0.55) 30%, rgba(124,58,237,0.45) 70%, transparent)' }} />
          <div className="absolute inset-0 rounded-2xl pointer-events-none"
               style={{ background: 'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(6,182,212,0.04) 0%, transparent 65%)' }} />

          <div className="relative z-10">
            <h1 className="font-heading font-bold text-white mb-1" style={{ fontSize: '22px' }}>
              Создать аккаунт
            </h1>
            <p className="font-body text-[#6B7280] mb-5" style={{ fontSize: '13.5px' }}>
              Уже есть аккаунт?{' '}
              <Link href="/login" className="text-[#7C3AED] hover:text-[#9D60FA] transition-colors font-medium">
                Войти
              </Link>
            </p>

            {/* Welcome bonus */}
            <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="flex items-center gap-3 rounded-xl p-3.5 mb-5 relative overflow-hidden"
              style={{ background: 'rgba(124,58,237,0.07)', border: '1px solid rgba(124,58,237,0.2)' }}>
              <div className="absolute inset-0 pointer-events-none"
                   style={{ background: 'radial-gradient(ellipse at left, rgba(124,58,237,0.08), transparent 60%)' }} />
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 relative z-10"
                   style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)' }}>
                <Gift style={{ width: '16px', height: '16px', color: '#F59E0B' }} />
              </div>
              <div className="relative z-10">
                <p className="font-heading font-semibold text-white" style={{ fontSize: '13px' }}>
                  +500 Arcane Coins при регистрации
                </p>
                <p className="font-body text-[#6B7280]" style={{ fontSize: '11px' }}>
                  Приветственный бонус для новых игроков
                </p>
              </div>
              <div className="relative z-10 ml-auto">
                <span className="font-pixel text-[#FCD34D]"
                      style={{ fontSize: '11px', textShadow: '0 0 8px rgba(252,211,77,0.5)' }}>
                  +500
                </span>
              </div>
            </motion.div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <CheckoutInput
                label="Имя или никнейм"
                type="text"
                placeholder="Алишер"
                value={name}
                onChange={(e) => { setName(e.target.value); setError(''); }}
                icon={<UserIcon style={{ width: '15px', height: '15px' }} />}
              />
              <CheckoutInput
                label="Email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(''); }}
                icon={<Mail style={{ width: '15px', height: '15px' }} />}
              />
              <div>
                <div className="relative">
                  <CheckoutInput
                    label="Пароль (минимум 6 символов)"
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
                <PasswordStrength password={password} />
              </div>

              {/* Agreement */}
              <label className="flex items-start gap-2.5 cursor-pointer select-none">
                <div onClick={() => setAgreed(!agreed)}
                     className="w-4 h-4 rounded flex items-center justify-center transition-all duration-200 cursor-pointer flex-shrink-0 mt-0.5"
                     style={{ background: agreed ? '#7C3AED' : 'transparent',
                              border: `1px solid ${agreed ? '#7C3AED' : 'rgba(255,255,255,0.15)'}`,
                              boxShadow: agreed ? '0 0 8px rgba(124,58,237,0.5)' : 'none' }}>
                  {agreed && <span style={{ color: '#fff', fontSize: '9px' }}>✓</span>}
                </div>
                <span className="font-body text-[#6B7280]" style={{ fontSize: '12px', lineHeight: '1.5' }}>
                  Я принимаю{' '}
                  <Link href="/terms" className="text-[#7C3AED] hover:text-[#9D60FA] transition-colors">условия</Link>
                  {' '}и{' '}
                  <Link href="/privacy" className="text-[#7C3AED] hover:text-[#9D60FA] transition-colors">политику конфиденциальности</Link>
                </span>
              </label>

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

              <motion.button
                type="submit"
                whileHover={!loading ? { scale: 1.015 } : {}}
                whileTap={!loading ? { scale: 0.985 } : {}}
                disabled={loading}
                className="w-full relative overflow-hidden rounded-xl font-heading font-semibold text-white flex items-center justify-center gap-2"
                style={{ background: loading ? 'rgba(6,182,212,0.25)' : 'linear-gradient(135deg, #06B6D4, #7C3AED)',
                         padding: '13px', fontSize: '14px',
                         boxShadow: loading ? 'none' : '0 0 0 1px rgba(6,182,212,0.4), 0 4px 24px rgba(6,182,212,0.25)',
                         cursor: loading ? 'not-allowed' : 'pointer' }}
              >
                {!loading && (
                  <span className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity"
                        style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.08), transparent 55%)' }} />
                )}
                <AnimatePresence mode="wait">
                  {loading ? (
                    <motion.span key="load" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                 className="font-pixel" style={{ fontSize: '8px', letterSpacing: '0.1em' }}>
                      СОЗДАЁМ АККАУНТ…
                    </motion.span>
                  ) : (
                    <motion.span key="text" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="relative z-10">
                      Создать аккаунт
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>
            </form>

            {/* Perks */}
            <div className="mt-5 pt-5 space-y-2" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
              {[
                { icon: Zap,  text: 'Arcane Coins с каждой покупки', color: '#F59E0B' },
                { icon: Star, text: 'Уровни и достижения',           color: '#7C3AED' },
              ].map(({ icon: Icon, text, color }) => (
                <div key={text} className="flex items-center gap-2">
                  <Icon style={{ width: '12px', height: '12px', color, flexShrink: 0 }} />
                  <span className="font-body text-[#374151]" style={{ fontSize: '11.5px' }}>{text}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
