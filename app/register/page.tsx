'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Mail, Lock, User as UserIcon, Eye, EyeOff } from 'lucide-react';
import { useUser } from '@/lib/userContext';
import CheckoutInput from '@/components/checkout/CheckoutInput';
import LogoFull from '@/components/ui/LogoFull';

export default function RegisterPage() {
  const { register } = useUser();
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!name.trim())          { setError('Введите имя'); return; }
    if (!email.includes('@'))  { setError('Введите корректный email'); return; }
    if (password.length < 6)   { setError('Пароль минимум 6 символов'); return; }
    if (!agreed)               { setError('Примите условия использования'); return; }
    setLoading(true);
    const ok = await register(name.trim(), email, password);
    setLoading(false);
    if (ok) router.push('/dashboard');
    else setError('Ошибка регистрации. Попробуйте ещё раз.');
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden"
         style={{ background: '#05040B', paddingTop: '80px', paddingBottom: '80px' }}>
      <div className="fixed inset-0 pointer-events-none"
           style={{
             backgroundImage: 'linear-gradient(rgba(124,58,237,1) 1px, transparent 1px), linear-gradient(90deg, rgba(124,58,237,1) 1px, transparent 1px)',
             backgroundSize: '52px 52px', opacity: 0.02,
           }} />
      <div className="fixed inset-0 pointer-events-none"
           style={{ background: 'radial-gradient(ellipse 70% 50% at 50% 40%, rgba(124,58,237,0.07) 0%, transparent 70%)' }} />

      <div className="relative z-10 w-full max-w-sm">
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="flex justify-center mb-6"
        >
          <Link href="/">
            <LogoFull width={100} height={120} className="opacity-90 hover:opacity-100 transition-opacity" />
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.08 }}
          className="rounded-2xl p-6 relative"
          style={{
            background: '#0D0D16',
            border: '1px solid rgba(124,58,237,0.22)',
            boxShadow: '0 20px 60px rgba(0,0,0,0.6), 0 0 40px rgba(124,58,237,0.06)',
          }}
        >
          <div className="absolute top-0 left-0 right-0 h-px rounded-t-2xl"
               style={{ background: 'linear-gradient(90deg, transparent, rgba(124,58,237,0.55), rgba(6,182,212,0.35), transparent)' }} />

          <h1 className="font-heading font-bold text-white mb-1" style={{ fontSize: '22px' }}>
            Создать аккаунт
          </h1>
          <p className="font-body text-[#6B7280] mb-6" style={{ fontSize: '13.5px' }}>
            Уже есть аккаунт?{' '}
            <Link href="/login" className="text-[#7C3AED] hover:text-[#9D60FA] transition-colors">
              Войти
            </Link>
          </p>

          {/* Welcome bonus */}
          <div className="flex items-center gap-3 rounded-xl p-3.5 mb-5"
               style={{ background: 'rgba(124,58,237,0.07)', border: '1px solid rgba(124,58,237,0.18)' }}>
            <span style={{ fontSize: '20px' }}>🎁</span>
            <div>
              <p className="font-heading font-semibold text-white" style={{ fontSize: '13px' }}>
                +500 Arcane Coins при регистрации
              </p>
              <p className="font-body text-[#6B7280]" style={{ fontSize: '11px' }}>
                Приветственный бонус для новых игроков
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <CheckoutInput
              label="Имя или никнейм"
              type="text"
              placeholder="Алишер"
              value={name}
              onChange={(e) => setName(e.target.value)}
              icon={<UserIcon style={{ width: '15px', height: '15px' }} />}
            />
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
                label="Пароль (минимум 6 символов)"
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
                {showPw ? <EyeOff style={{ width: '15px', height: '15px' }} /> : <Eye style={{ width: '15px', height: '15px' }} />}
              </button>
            </div>

            {/* Agreement */}
            <label className="flex items-start gap-2.5 cursor-pointer select-none">
              <div
                onClick={() => setAgreed(!agreed)}
                className="w-4 h-4 rounded flex items-center justify-center transition-all duration-200 cursor-pointer flex-shrink-0 mt-0.5"
                style={{
                  background: agreed ? '#7C3AED' : 'transparent',
                  border: `1px solid ${agreed ? '#7C3AED' : 'rgba(255,255,255,0.15)'}`,
                  boxShadow: agreed ? '0 0 8px rgba(124,58,237,0.5)' : 'none',
                }}
              >
                {agreed && <span style={{ color: '#fff', fontSize: '9px' }}>✓</span>}
              </div>
              <span className="font-body text-[#6B7280]" style={{ fontSize: '12px', lineHeight: '1.5' }}>
                Я принимаю{' '}
                <Link href="/terms" className="text-[#7C3AED] hover:text-[#9D60FA] transition-colors">условия использования</Link>
                {' '}и{' '}
                <Link href="/privacy" className="text-[#7C3AED] hover:text-[#9D60FA] transition-colors">политику конфиденциальности</Link>
              </span>
            </label>

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
                  СОЗДАЁМ АККАУНТ...
                </span>
              ) : 'Создать аккаунт'}
            </motion.button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
