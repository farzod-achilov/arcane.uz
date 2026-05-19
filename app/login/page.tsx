'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, Send, Gamepad2 } from 'lucide-react';
import { useUser } from '@/lib/userContext';
import CheckoutInput from '@/components/checkout/CheckoutInput';
import LogoFull from '@/components/ui/LogoFull';

export default function LoginPage() {
  const { login } = useUser();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [remember, setRemember] = useState(false);

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
    setEmail('demo@arcane.uz');
    setPassword('demo123');
    setLoading(true);
    await login('demo@arcane.uz', 'demo123');
    setLoading(false);
    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden"
         style={{ background: '#05040B', paddingTop: '80px', paddingBottom: '80px' }}>
      {/* Grid */}
      <div className="fixed inset-0 pointer-events-none"
           style={{
             backgroundImage: 'linear-gradient(rgba(124,58,237,1) 1px, transparent 1px), linear-gradient(90deg, rgba(124,58,237,1) 1px, transparent 1px)',
             backgroundSize: '52px 52px', opacity: 0.02,
           }} />
      {/* Scanlines */}
      <div className="fixed inset-0 pointer-events-none"
           style={{ backgroundImage: 'repeating-linear-gradient(to bottom, transparent 0px, transparent 3px, rgba(0,0,0,0.05) 3px, rgba(0,0,0,0.05) 4px)' }} />
      {/* Ambient */}
      <div className="fixed inset-0 pointer-events-none"
           style={{ background: 'radial-gradient(ellipse 70% 50% at 50% 40%, rgba(124,58,237,0.08) 0%, transparent 70%)' }} />

      <div className="relative z-10 w-full max-w-sm">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex justify-center mb-6"
        >
          <Link href="/">
            <LogoFull width={100} height={120} className="opacity-90 hover:opacity-100 transition-opacity" />
          </Link>
        </motion.div>

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="rounded-2xl p-6"
          style={{
            background: '#0D0D16',
            border: '1px solid rgba(124,58,237,0.22)',
            boxShadow: '0 20px 60px rgba(0,0,0,0.6), 0 0 40px rgba(124,58,237,0.06)',
          }}
        >
          {/* Top glow */}
          <div className="absolute top-0 left-0 right-0 h-px rounded-t-2xl"
               style={{ background: 'linear-gradient(90deg, transparent, rgba(124,58,237,0.55), rgba(6,182,212,0.35), transparent)' }} />

          <h1 className="font-heading font-bold text-white mb-1" style={{ fontSize: '22px' }}>Вход в аккаунт</h1>
          <p className="font-body text-[#6B7280] mb-6" style={{ fontSize: '13.5px' }}>
            Нет аккаунта?{' '}
            <Link href="/register" className="text-[#7C3AED] hover:text-[#9D60FA] transition-colors">
              Зарегистрироваться
            </Link>
          </p>

          {/* Demo shortcut */}
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={handleDemo}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2.5 rounded-xl font-heading font-semibold text-white mb-5 relative overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, rgba(124,58,237,0.2), rgba(6,182,212,0.15))',
              border: '1px solid rgba(124,58,237,0.3)',
              padding: '11px',
              fontSize: '13px',
            }}
          >
            <Gamepad2 style={{ width: '15px', height: '15px', color: '#9D60FA' }} />
            Войти как Demo-игрок
          </motion.button>

          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
            <span className="font-body text-[#2D2D44]" style={{ fontSize: '11px' }}>или войдите через email</span>
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
              <Link href="#" className="font-body text-[#4B5563] hover:text-[#7C3AED] transition-colors"
                    style={{ fontSize: '12.5px' }}>
                Забыли пароль?
              </Link>
            </div>

            {/* Error */}
            {error && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="font-body text-[#F87171] text-center"
                style={{ fontSize: '12.5px' }}
              >
                {error}
              </motion.p>
            )}

            {/* Submit */}
            <motion.button
              type="submit"
              whileHover={!loading ? { scale: 1.015 } : {}}
              whileTap={!loading ? { scale: 0.985 } : {}}
              disabled={loading}
              className="w-full relative overflow-hidden rounded-xl font-heading font-semibold text-white flex items-center justify-center gap-2"
              style={{
                background: loading ? 'rgba(124,58,237,0.4)' : 'linear-gradient(135deg, #7C3AED, #5B21B6)',
                padding: '13px',
                fontSize: '14px',
                boxShadow: loading ? 'none' : '0 0 0 1px rgba(124,58,237,0.4), 0 4px 20px rgba(124,58,237,0.3)',
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? (
                <span className="font-pixel" style={{ fontSize: '8px', letterSpacing: '0.08em' }}>
                  ВХОД...
                </span>
              ) : 'Войти'}
            </motion.button>
          </form>

          {/* Social divider */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.05)' }} />
            <span className="font-body text-[#2D2D44]" style={{ fontSize: '11px' }}>или</span>
            <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.05)' }} />
          </div>

          {/* Social buttons */}
          <div className="grid grid-cols-2 gap-2.5">
            <button
              className="flex items-center justify-center gap-2 rounded-xl font-heading font-medium transition-all duration-200"
              style={{
                background: '#09090E', border: '1px solid rgba(255,255,255,0.07)',
                padding: '10px', fontSize: '12.5px', color: '#9CA3AF',
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(6,182,212,0.35)'; (e.currentTarget as HTMLElement).style.color = '#22D3EE'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.07)'; (e.currentTarget as HTMLElement).style.color = '#9CA3AF'; }}
            >
              <Send style={{ width: '14px', height: '14px' }} />
              Telegram
            </button>
            <button
              className="flex items-center justify-center gap-2 rounded-xl font-heading font-medium transition-all duration-200"
              style={{
                background: '#09090E', border: '1px solid rgba(255,255,255,0.07)',
                padding: '10px', fontSize: '12.5px', color: '#9CA3AF',
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(102,192,244,0.35)'; (e.currentTarget as HTMLElement).style.color = '#66C0F4'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.07)'; (e.currentTarget as HTMLElement).style.color = '#9CA3AF'; }}
            >
              <Gamepad2 style={{ width: '14px', height: '14px' }} />
              Steam
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
