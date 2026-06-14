'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Eye, EyeOff, CheckCircle2, KeyRound } from 'lucide-react';
import { toast } from 'sonner';

export default function ChangePasswordForm() {
  const [open,     setOpen]     = useState(false);
  const [current,  setCurrent]  = useState('');
  const [next,     setNext]     = useState('');
  const [confirm,  setConfirm]  = useState('');
  const [showCur,  setShowCur]  = useState(false);
  const [showNew,  setShowNew]  = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');
  const [done,     setDone]     = useState(false);

  function reset() {
    setCurrent(''); setNext(''); setConfirm('');
    setError(''); setDone(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (next !== confirm)   { setError('Пароли не совпадают'); return; }
    if (next.length < 8)    { setError('Новый пароль минимум 8 символов'); return; }
    setError(''); setLoading(true);

    const res  = await fetch('/api/profile/change-password', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ currentPassword: current, newPassword: next }),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) { setError(data.error ?? 'Ошибка'); return; }

    setDone(true);
    toast.success('Пароль успешно изменён');
    setTimeout(() => { setOpen(false); reset(); }, 1500);
  }

  // Password strength
  const strength = [next.length >= 8, next.length >= 12, /[A-Z]/.test(next), /[0-9]/.test(next)].filter(Boolean).length;
  const strengthColor = ['#EF4444', '#F59E0B', '#22C55E', '#06B6D4'][strength - 1] ?? '#374151';
  const strengthLabel = ['', 'Слабый', 'Нормальный', 'Хороший', 'Сильный'][strength] ?? '';

  return (
    <div className="mt-2 mb-3">
      <button
        onClick={() => { setOpen(!open); reset(); }}
        className="flex items-center gap-1.5 rounded-lg px-2.5 py-1 transition-all duration-200"
        style={{
          background: 'rgba(245,158,11,0.06)',
          border:     '1px solid rgba(245,158,11,0.18)',
          color:      '#6B7280',
        }}
        onMouseEnter={e => {
          const el = e.currentTarget as HTMLElement;
          el.style.borderColor = 'rgba(245,158,11,0.4)';
          el.style.color       = '#F59E0B';
          el.style.background  = 'rgba(245,158,11,0.1)';
        }}
        onMouseLeave={e => {
          const el = e.currentTarget as HTMLElement;
          el.style.borderColor = 'rgba(245,158,11,0.18)';
          el.style.color       = '#6B7280';
          el.style.background  = 'rgba(245,158,11,0.06)';
        }}
      >
        <KeyRound style={{ width: '10px', height: '10px' }} />
        <span className="font-body" style={{ fontSize: '11px' }}>Сменить пароль</span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0, marginTop: 0 }}
            animate={{ opacity: 1, height: 'auto', marginTop: 10 }}
            exit={{ opacity: 0, height: 0, marginTop: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            {done ? (
              <div className="rounded-xl p-4 flex items-center gap-3"
                   style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.25)' }}>
                <CheckCircle2 style={{ width: '18px', height: '18px', color: '#4ADE80', flexShrink: 0 }} />
                <p className="font-body text-[#4ADE80]" style={{ fontSize: '13px' }}>Пароль успешно изменён!</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit}
                    className="rounded-xl p-4 space-y-3"
                    style={{ background: 'rgba(10,9,18,0.95)', border: '1px solid rgba(245,158,11,0.2)' }}>

                {/* Current password */}
                <div>
                  <label className="font-body text-[#9CA3AF] block mb-1" style={{ fontSize: '11px' }}>Текущий пароль</label>
                  <div className="flex items-center gap-2 rounded-xl px-3 py-2.5"
                       style={{ background: '#09090E', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <Lock style={{ width: '13px', height: '13px', color: '#4B5563', flexShrink: 0 }} />
                    <input
                      type={showCur ? 'text' : 'password'}
                      value={current}
                      onChange={e => { setCurrent(e.target.value); setError(''); }}
                      placeholder="••••••••"
                      className="flex-1 bg-transparent outline-none font-body text-white placeholder-[#374151]"
                      style={{ fontSize: '13px' }}
                      autoComplete="current-password"
                    />
                    <button type="button" onClick={() => setShowCur(!showCur)}
                            className="text-[#4B5563] hover:text-[#9CA3AF] transition-colors">
                      {showCur ? <EyeOff style={{ width: '13px', height: '13px' }} />
                               : <Eye   style={{ width: '13px', height: '13px' }} />}
                    </button>
                  </div>
                </div>

                {/* New password */}
                <div>
                  <label className="font-body text-[#9CA3AF] block mb-1" style={{ fontSize: '11px' }}>Новый пароль</label>
                  <div className="flex items-center gap-2 rounded-xl px-3 py-2.5"
                       style={{ background: '#09090E', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <Lock style={{ width: '13px', height: '13px', color: '#4B5563', flexShrink: 0 }} />
                    <input
                      type={showNew ? 'text' : 'password'}
                      value={next}
                      onChange={e => { setNext(e.target.value); setError(''); }}
                      placeholder="Минимум 8 символов"
                      className="flex-1 bg-transparent outline-none font-body text-white placeholder-[#374151]"
                      style={{ fontSize: '13px' }}
                      autoComplete="new-password"
                    />
                    <button type="button" onClick={() => setShowNew(!showNew)}
                            className="text-[#4B5563] hover:text-[#9CA3AF] transition-colors">
                      {showNew ? <EyeOff style={{ width: '13px', height: '13px' }} />
                               : <Eye   style={{ width: '13px', height: '13px' }} />}
                    </button>
                  </div>
                  {/* Strength bar */}
                  {next && (
                    <div className="mt-1.5 flex items-center gap-2">
                      <div className="flex-1 flex gap-1">
                        {[1,2,3,4].map(i => (
                          <div key={i} className="h-1 flex-1 rounded-full transition-all duration-300"
                               style={{ background: i <= strength ? strengthColor : 'rgba(255,255,255,0.06)' }} />
                        ))}
                      </div>
                      <span className="font-body" style={{ fontSize: '10px', color: strengthColor }}>{strengthLabel}</span>
                    </div>
                  )}
                </div>

                {/* Confirm */}
                <div>
                  <label className="font-body text-[#9CA3AF] block mb-1" style={{ fontSize: '11px' }}>Повторите новый пароль</label>
                  <div className="flex items-center gap-2 rounded-xl px-3 py-2.5"
                       style={{ background: '#09090E', border: `1px solid ${confirm && confirm !== next ? 'rgba(239,68,68,0.4)' : 'rgba(255,255,255,0.08)'}` }}>
                    <Lock style={{ width: '13px', height: '13px', color: '#4B5563', flexShrink: 0 }} />
                    <input
                      type="password"
                      value={confirm}
                      onChange={e => { setConfirm(e.target.value); setError(''); }}
                      placeholder="••••••••"
                      className="flex-1 bg-transparent outline-none font-body text-white placeholder-[#374151]"
                      style={{ fontSize: '13px' }}
                      autoComplete="new-password"
                    />
                    {confirm && confirm === next && (
                      <CheckCircle2 style={{ width: '13px', height: '13px', color: '#4ADE80', flexShrink: 0 }} />
                    )}
                  </div>
                </div>

                {/* Error */}
                <AnimatePresence>
                  {error && (
                    <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                              className="font-body rounded-xl px-3 py-2"
                              style={{ fontSize: '11.5px', color: '#F87171',
                                       background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
                      {error}
                    </motion.p>
                  )}
                </AnimatePresence>

                <div className="flex gap-2 pt-1">
                  <button type="submit"
                          disabled={loading || !current || !next || !confirm}
                          className="flex-1 rounded-xl font-heading font-semibold text-white py-2.5"
                          style={{
                            fontSize: '12.5px',
                            background: loading ? 'rgba(245,158,11,0.3)' : 'linear-gradient(135deg, #D97706, #B45309)',
                            cursor: (loading || !current || !next || !confirm) ? 'not-allowed' : 'pointer',
                            opacity: (!current || !next || !confirm) ? 0.5 : 1,
                          }}>
                    {loading ? 'Сохраняем…' : 'Сохранить пароль'}
                  </button>
                  <button type="button" onClick={() => { setOpen(false); reset(); }}
                          className="rounded-xl font-heading font-medium text-[#6B7280] px-4 py-2.5"
                          style={{ fontSize: '12.5px', background: 'rgba(255,255,255,0.04)',
                                   border: '1px solid rgba(255,255,255,0.07)' }}>
                    Отмена
                  </button>
                </div>
              </form>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
