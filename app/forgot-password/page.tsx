'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, ArrowLeft, Send, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import TurnstileWidget from '@/components/ui/TurnstileWidget';

const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? '';

export default function ForgotPasswordPage() {
  const [email,     setEmail]     = useState('');
  const [loading,   setLoading]   = useState(false);
  const [sent,      setSent]      = useState(false);
  const [error,     setError]     = useState('');
  const [turnstileToken, setTurnstileToken] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    if (TURNSTILE_SITE_KEY && !turnstileToken) { setError('Подтвердите, что вы не робот'); return; }
    setLoading(true);
    setError('');
    try {
      const res  = await fetch('/api/auth/forgot-password', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email, turnstileToken }),
      });
      const data = await res.json() as { success?: boolean; error?: string };
      if (!res.ok && data.error) { setError(data.error); return; }
      setSent(true);
    } catch {
      setError('Ошибка сети. Попробуйте снова.');
    } finally {
      setLoading(false);
    }
  };

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

          <AnimatePresence mode="wait">
            {sent ? (
              /* ── Success state ── */
              <motion.div key="sent"
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
                <h2 className="font-heading font-bold text-white mb-2" style={{ fontSize: '20px' }}>
                  Письмо отправлено!
                </h2>
                <p className="font-body text-[#6B7280] mb-6" style={{ fontSize: '13px', lineHeight: '1.6' }}>
                  Если аккаунт с адресом <span className="text-white">{email}</span> существует,
                  мы отправили ссылку для сброса пароля. Проверьте папку «Спам».
                </p>
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 font-heading font-semibold text-[#7C3AED] hover:text-[#9D60FA] transition-colors"
                  style={{ fontSize: '13px' }}
                >
                  <ArrowLeft style={{ width: '14px', height: '14px' }} />
                  Вернуться ко входу
                </Link>
              </motion.div>
            ) : (
              /* ── Form state ── */
              <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div className="px-6 pt-6 pb-5" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  <p className="font-pixel mb-1" style={{ fontSize: '8px', color: '#7C3AED', letterSpacing: '0.12em' }}>
                    БЕЗОПАСНОСТЬ
                  </p>
                  <h1 className="font-heading font-bold text-white" style={{ fontSize: '20px' }}>
                    Забыли пароль?
                  </h1>
                  <p className="font-body text-[#4B5563] mt-1" style={{ fontSize: '12.5px' }}>
                    Введите email — пришлём ссылку для сброса
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                  {/* Email field */}
                  <div>
                    <label className="block font-body text-[#9CA3AF] mb-1.5" style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                      Email
                    </label>
                    <div className="relative">
                      <Mail style={{
                        position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)',
                        width: '15px', height: '15px', color: '#374151',
                      }} />
                      <input
                        type="email"
                        value={email}
                        onChange={e => { setEmail(e.target.value); setError(''); }}
                        placeholder="your@email.com"
                        autoFocus
                        required
                        className="w-full rounded-xl pl-10 pr-4 py-3 text-white font-body outline-none placeholder:text-[#1F2937] transition-all"
                        style={{
                          background: '#09090E',
                          border: `1px solid ${error ? 'rgba(239,68,68,0.4)' : 'rgba(255,255,255,0.08)'}`,
                          fontSize: '13px',
                        }}
                        onFocus={e => { if (!error) e.currentTarget.style.borderColor = 'rgba(124,58,237,0.4)'; }}
                        onBlur={e  => { if (!error) e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; }}
                      />
                    </div>
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
                    disabled={loading || !email.trim()}
                    className="w-full flex items-center justify-center gap-2 rounded-xl py-3 font-heading font-semibold text-white transition-all disabled:opacity-40"
                    style={{
                      background:  'linear-gradient(135deg, #7C3AED 0%, #5B21B6 60%, #06B6D4 130%)',
                      fontSize:    '14px',
                      boxShadow:   email.trim() ? '0 0 20px rgba(124,58,237,0.3)' : 'none',
                    }}
                  >
                    {loading
                      ? <Loader2 style={{ width: '16px', height: '16px' }} className="animate-spin" />
                      : <Send style={{ width: '15px', height: '15px' }} />}
                    {loading ? 'Отправляем...' : 'Отправить ссылку'}
                  </button>

                  <div className="text-center">
                    <Link
                      href="/login"
                      className="inline-flex items-center gap-1.5 font-body text-[#4B5563] hover:text-[#9CA3AF] transition-colors"
                      style={{ fontSize: '12.5px' }}
                    >
                      <ArrowLeft style={{ width: '13px', height: '13px' }} />
                      Вернуться ко входу
                    </Link>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
