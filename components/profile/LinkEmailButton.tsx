'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, Send, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { signIn, signOut } from 'next-auth/react';

export default function LinkEmailButton() {
  const [open,     setOpen]     = useState(false);
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [showPw,   setShowPw]   = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [done,     setDone]     = useState(false);
  const [error,    setError]    = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const res  = await fetch('/api/profile/link-email', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ email, password }),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? 'Ошибка');
      return;
    }

    if (data.merged) {
      // Accounts merged — re-login with the main account credentials
      toast.success('Аккаунты объединены! Выполняем вход…');
      await signOut({ redirect: false });
      const result = await signIn('credentials', { email, password, redirect: false });
      if (result?.ok) {
        window.location.href = '/profile';
      } else {
        window.location.href = '/login';
      }
      return;
    }

    setDone(true);
    setOpen(false);
    toast.success('Email привязан! Теперь можно входить через email и Telegram.');
  }

  if (done) {
    return (
      <div className="flex items-center gap-1.5 mb-3">
        <CheckCircle2 style={{ width: '13px', height: '13px', color: '#22C55E' }} />
        <span className="font-body text-[#22C55E]" style={{ fontSize: '12px' }}>{email}</span>
      </div>
    );
  }

  return (
    <div className="mb-3">
      {/* Trigger badge */}
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 rounded-lg px-2.5 py-1 transition-all duration-200"
        style={{
          background: 'rgba(124,58,237,0.1)',
          border:     '1px solid rgba(124,58,237,0.25)',
        }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLElement).style.borderColor = 'rgba(124,58,237,0.5)';
          (e.currentTarget as HTMLElement).style.background  = 'rgba(124,58,237,0.18)';
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLElement).style.borderColor = 'rgba(124,58,237,0.25)';
          (e.currentTarget as HTMLElement).style.background  = 'rgba(124,58,237,0.1)';
        }}
      >
        <Send style={{ width: '10px', height: '10px', color: '#9D60FA' }} />
        <span className="font-body text-[#9D60FA]" style={{ fontSize: '11px' }}>
          Вход через Telegram · Привязать email
        </span>
      </button>

      {/* Inline form */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0, marginTop: 0 }}
            animate={{ opacity: 1, height: 'auto', marginTop: 10 }}
            exit={{ opacity: 0, height: 0, marginTop: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <form
              onSubmit={handleSubmit}
              className="rounded-xl p-4 space-y-3"
              style={{
                background: 'rgba(10,9,18,0.95)',
                border: '1px solid rgba(124,58,237,0.2)',
              }}
            >
              <p className="font-body text-[#6B7280]" style={{ fontSize: '12px' }}>
                Привяжите email и пароль — сможете входить двумя способами.
              </p>

              {/* Email */}
              <div className="flex items-center gap-2 rounded-xl px-3 py-2.5"
                   style={{ background: '#09090E', border: '1px solid rgba(255,255,255,0.08)' }}>
                <Mail style={{ width: '13px', height: '13px', color: '#4B5563', flexShrink: 0 }} />
                <input
                  type="email"
                  value={email}
                  onChange={e => { setEmail(e.target.value); setError(''); }}
                  placeholder="your@email.com"
                  className="flex-1 bg-transparent outline-none font-body text-white placeholder-[#374151]"
                  style={{ fontSize: '12.5px' }}
                />
              </div>

              {/* Password */}
              <div className="flex items-center gap-2 rounded-xl px-3 py-2.5"
                   style={{ background: '#09090E', border: '1px solid rgba(255,255,255,0.08)' }}>
                <Lock style={{ width: '13px', height: '13px', color: '#4B5563', flexShrink: 0 }} />
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError(''); }}
                  placeholder="Придумайте пароль (мин. 6 символов)"
                  className="flex-1 bg-transparent outline-none font-body text-white placeholder-[#374151]"
                  style={{ fontSize: '12.5px' }}
                />
                <button type="button" onClick={() => setShowPw(!showPw)}
                        className="text-[#4B5563] hover:text-[#9CA3AF] transition-colors">
                  {showPw
                    ? <EyeOff style={{ width: '13px', height: '13px' }} />
                    : <Eye    style={{ width: '13px', height: '13px' }} />}
                </button>
              </div>

              {/* Error */}
              <AnimatePresence>
                {error && (
                  <motion.p
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="font-body rounded-lg px-3 py-2"
                    style={{ fontSize: '11.5px', color: '#F87171',
                             background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
                    {error}
                  </motion.p>
                )}
              </AnimatePresence>

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={loading || !email || !password}
                  className="flex-1 rounded-xl font-heading font-semibold text-white py-2.5"
                  style={{
                    fontSize: '12.5px',
                    background: loading ? 'rgba(124,58,237,0.3)' : 'linear-gradient(135deg, #7C3AED, #5B21B6)',
                    cursor: (loading || !email || !password) ? 'not-allowed' : 'pointer',
                    opacity: (!email || !password) ? 0.5 : 1,
                  }}
                >
                  {loading ? 'Сохраняем…' : 'Привязать'}
                </button>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-xl font-heading font-medium text-[#6B7280] px-4 py-2.5"
                  style={{ fontSize: '12.5px', background: 'rgba(255,255,255,0.04)',
                           border: '1px solid rgba(255,255,255,0.07)' }}
                >
                  Отмена
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
