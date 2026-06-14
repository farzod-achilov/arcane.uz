'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Eye, EyeOff, Check, ArrowLeft, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';

function ResetPasswordForm() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const token        = searchParams.get('token') ?? '';

  const [password,  setPassword]  = useState('');
  const [confirm,   setConfirm]   = useState('');
  const [showPwd,   setShowPwd]   = useState(false);
  const [loading,   setLoading]   = useState(false);
  const [done,      setDone]      = useState(false);
  const [error,     setError]     = useState('');

  const pwdStrong = password.length >= 8;
  const pwdMatch  = password && confirm && password === confirm;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) { setError('Пароли не совпадают'); return; }
    if (password.length < 8)  { setError('Пароль минимум 8 символов'); return; }

    setLoading(true); setError('');
    try {
      const res  = await fetch('/api/auth/reset-password', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ token, password }),
      });
      const data = await res.json() as { success?: boolean; error?: string };
      if (!res.ok || !data.success) { setError(data.error ?? 'Ошибка'); return; }
      setDone(true);
      setTimeout(() => router.push('/login'), 3000);
    } catch {
      setError('Ошибка сети. Попробуйте снова.');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="p-8 text-center">
        <AlertCircle style={{ width: '32px', height: '32px', color: '#EF4444', margin: '0 auto 12px' }} />
        <h2 className="font-heading font-bold text-white mb-2" style={{ fontSize: '18px' }}>Ссылка недействительна</h2>
        <p className="font-body text-[#4B5563] mb-5" style={{ fontSize: '13px' }}>
          Токен отсутствует. Запросите новую ссылку.
        </p>
        <Link href="/forgot-password"
          className="inline-flex items-center gap-2 font-heading font-semibold text-[#7C3AED] hover:text-[#9D60FA] transition-colors"
          style={{ fontSize: '13px' }}>
          Запросить снова
        </Link>
      </div>
    );
  }

  return (
    <AnimatePresence mode="wait">
      {done ? (
        <motion.div key="done"
          initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
          className="p-8 text-center"
        >
          <motion.div
            initial={{ scale: 0 }} animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 300, delay: 0.1 }}
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5"
            style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.25)' }}
          >
            <CheckCircle2 style={{ width: '28px', height: '28px', color: '#22C55E' }} />
          </motion.div>
          <h2 className="font-heading font-bold text-white mb-2" style={{ fontSize: '20px' }}>Пароль изменён!</h2>
          <p className="font-body text-[#6B7280] mb-4" style={{ fontSize: '13px' }}>
            Перенаправляем на страницу входа...
          </p>
          <Link href="/login"
            className="inline-flex items-center gap-2 font-heading font-semibold text-[#7C3AED] hover:text-[#9D60FA] transition-colors"
            style={{ fontSize: '13px' }}>
            <ArrowLeft style={{ width: '14px', height: '14px' }} />
            Войти сейчас
          </Link>
        </motion.div>
      ) : (
        <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="px-6 pt-6 pb-5" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <p className="font-pixel mb-1" style={{ fontSize: '8px', color: '#7C3AED', letterSpacing: '0.12em' }}>
              БЕЗОПАСНОСТЬ
            </p>
            <h1 className="font-heading font-bold text-white" style={{ fontSize: '20px' }}>
              Новый пароль
            </h1>
            <p className="font-body text-[#4B5563] mt-1" style={{ fontSize: '12.5px' }}>
              Придумайте надёжный пароль для вашего аккаунта
            </p>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Password */}
            <div>
              <label className="block font-body text-[#9CA3AF] mb-1.5" style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                Новый пароль
              </label>
              <div className="relative">
                <Lock style={{
                  position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)',
                  width: '15px', height: '15px', color: '#374151',
                }} />
                <input
                  type={showPwd ? 'text' : 'password'}
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError(''); }}
                  placeholder="Минимум 8 символов"
                  required
                  className="w-full rounded-xl pl-10 pr-10 py-3 text-white font-body outline-none placeholder:text-[#1F2937] transition-all"
                  style={{
                    background: '#09090E',
                    border: `1px solid ${error ? 'rgba(239,68,68,0.4)' : 'rgba(255,255,255,0.08)'}`,
                    fontSize: '13px',
                  }}
                  onFocus={e => { if (!error) e.currentTarget.style.borderColor = 'rgba(124,58,237,0.4)'; }}
                  onBlur={e  => { if (!error) e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; }}
                />
                <button type="button" onClick={() => setShowPwd(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#374151] hover:text-[#9CA3AF] transition-colors">
                  {showPwd ? <EyeOff style={{ width: '15px', height: '15px' }} /> : <Eye style={{ width: '15px', height: '15px' }} />}
                </button>
              </div>
              {/* Strength hints */}
              {password && (
                <div className="flex items-center gap-2 mt-1.5">
                  <div className="flex gap-1">
                    {[6, 8, 12].map((len, i) => (
                      <div key={i} className="h-1 w-8 rounded-full transition-all"
                           style={{ background: password.length >= len ? (i === 0 ? '#EF4444' : i === 1 ? '#F59E0B' : '#22C55E') : 'rgba(255,255,255,0.08)' }} />
                    ))}
                  </div>
                  <span className="font-body text-[#4B5563]" style={{ fontSize: '10px' }}>
                    {password.length < 8 ? 'Слабый' : password.length < 12 ? 'Нормальный' : password.length < 16 ? 'Хороший' : 'Сильный'}
                  </span>
                </div>
              )}
            </div>

            {/* Confirm */}
            <div>
              <label className="block font-body text-[#9CA3AF] mb-1.5" style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                Подтвердить пароль
              </label>
              <div className="relative">
                <Lock style={{
                  position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)',
                  width: '15px', height: '15px', color: '#374151',
                }} />
                <input
                  type={showPwd ? 'text' : 'password'}
                  value={confirm}
                  onChange={e => { setConfirm(e.target.value); setError(''); }}
                  placeholder="Повторите пароль"
                  required
                  className="w-full rounded-xl pl-10 pr-10 py-3 text-white font-body outline-none placeholder:text-[#1F2937] transition-all"
                  style={{
                    background: '#09090E',
                    border: `1px solid ${
                      error           ? 'rgba(239,68,68,0.4)' :
                      pwdMatch        ? 'rgba(34,197,94,0.35)' :
                      confirm.length  ? 'rgba(239,68,68,0.25)' :
                                        'rgba(255,255,255,0.08)'
                    }`,
                    fontSize: '13px',
                  }}
                  onFocus={e => { if (!error && !pwdMatch) e.currentTarget.style.borderColor = 'rgba(124,58,237,0.4)'; }}
                  onBlur={e  => {
                    if (!error) e.currentTarget.style.borderColor = pwdMatch ? 'rgba(34,197,94,0.35)' : confirm.length ? 'rgba(239,68,68,0.25)' : 'rgba(255,255,255,0.08)';
                  }}
                />
                {pwdMatch && (
                  <Check style={{
                    position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                    width: '15px', height: '15px', color: '#22C55E',
                  }} />
                )}
              </div>
            </div>

            {/* Error */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                  className="flex items-center gap-2 rounded-xl px-3 py-2.5"
                  style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.18)' }}
                >
                  <AlertCircle style={{ width: '13px', height: '13px', color: '#EF4444', flexShrink: 0 }} />
                  <p className="font-body text-[#F87171]" style={{ fontSize: '12px' }}>{error}</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || !password || !confirm || password !== confirm}
              className="w-full flex items-center justify-center gap-2 rounded-xl py-3 font-heading font-semibold text-white transition-all disabled:opacity-40"
              style={{
                background: 'linear-gradient(135deg, #7C3AED 0%, #5B21B6 60%, #06B6D4 130%)',
                fontSize:   '14px',
                boxShadow:  pwdStrong && pwdMatch ? '0 0 20px rgba(124,58,237,0.3)' : 'none',
              }}
            >
              {loading
                ? <Loader2 style={{ width: '16px', height: '16px' }} className="animate-spin" />
                : <Lock style={{ width: '15px', height: '15px' }} />}
              {loading ? 'Сохраняем...' : 'Сохранить пароль'}
            </button>

            <div className="text-center">
              <Link href="/login"
                className="inline-flex items-center gap-1.5 font-body text-[#4B5563] hover:text-[#9CA3AF] transition-colors"
                style={{ fontSize: '12.5px' }}>
                <ArrowLeft style={{ width: '13px', height: '13px' }} />
                Вернуться ко входу
              </Link>
            </div>
          </form>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4"
         style={{ background: '#05040B' }}>
      <div className="fixed inset-0 pointer-events-none"
           style={{ background: 'radial-gradient(ellipse 60% 40% at 50% 0%, rgba(124,58,237,0.08) 0%, transparent 70%)' }} />

      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full max-w-sm"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                 style={{ background: 'linear-gradient(135deg, #7C3AED, #5B21B6)' }}>
              <span className="font-heading font-bold text-white" style={{ fontSize: '15px' }}>A</span>
            </div>
            <span className="font-heading font-bold text-white" style={{ fontSize: '18px' }}>
              ARCANE<span style={{ color: '#7C3AED' }}>.UZ</span>
            </span>
          </Link>
        </div>

        <div className="rounded-2xl overflow-hidden"
             style={{ background: '#0D0D1A', border: '1px solid rgba(255,255,255,0.07)', boxShadow: '0 24px 80px rgba(0,0,0,0.5)' }}>
          <Suspense fallback={
            <div className="p-8 flex justify-center">
              <Loader2 style={{ width: '24px', height: '24px', color: '#7C3AED' }} className="animate-spin" />
            </div>
          }>
            <ResetPasswordForm />
          </Suspense>
        </div>
      </motion.div>
    </div>
  );
}
