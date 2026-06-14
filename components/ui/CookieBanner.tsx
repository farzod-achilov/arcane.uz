'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { Cookie, X, Check } from 'lucide-react';

const STORAGE_KEY = 'arcane_cookie_consent';

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(STORAGE_KEY)) setVisible(true);
    } catch { /* private browsing */ }
  }, []);

  const accept = () => {
    try { localStorage.setItem(STORAGE_KEY, 'accepted'); } catch { /* ignore */ }
    setVisible(false);
  };

  const decline = () => {
    try { localStorage.setItem(STORAGE_KEY, 'declined'); } catch { /* ignore */ }
    setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="fixed bottom-6 left-1/2 z-[9999] w-full max-w-lg px-4"
          style={{ transform: 'translateX(-50%)' }}
        >
          <div
            className="rounded-2xl p-5 relative overflow-hidden"
            style={{
              background:    'rgba(10,9,18,0.97)',
              border:        '1px solid rgba(124,58,237,0.25)',
              boxShadow:     '0 24px 60px rgba(0,0,0,0.7), 0 0 40px rgba(124,58,237,0.08)',
              backdropFilter: 'blur(20px)',
            }}
          >
            <div className="absolute top-0 left-0 right-0 h-px"
                 style={{ background: 'linear-gradient(90deg, transparent, rgba(124,58,237,0.6), rgba(6,182,212,0.4), transparent)' }} />

            <button
              onClick={decline}
              className="absolute top-3.5 right-3.5 text-[#4B5563] hover:text-[#9CA3AF] transition-colors"
            >
              <X style={{ width: '15px', height: '15px' }} />
            </button>

            <div className="flex items-start gap-4">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.2)' }}
              >
                <Cookie style={{ width: '18px', height: '18px', color: '#9D60FA' }} />
              </div>

              <div className="flex-1 min-w-0">
                <p className="font-heading font-semibold text-white mb-1" style={{ fontSize: '14px' }}>
                  Мы используем cookies
                </p>
                <p className="font-body text-[#6B7280]" style={{ fontSize: '12px', lineHeight: '1.5' }}>
                  Для корректной работы сайта, авторизации и аналитики.{' '}
                  <Link href="/privacy" className="text-[#7C3AED] hover:text-[#9D60FA] transition-colors">
                    Политика конфиденциальности
                  </Link>
                </p>
              </div>
            </div>

            <div className="flex gap-2.5 mt-4">
              <button
                onClick={accept}
                className="flex-1 flex items-center justify-center gap-1.5 rounded-xl font-heading font-semibold text-white"
                style={{
                  padding:    '10px',
                  fontSize:   '13px',
                  background: 'linear-gradient(135deg, #7C3AED, #06B6D4)',
                  boxShadow:  '0 0 20px rgba(124,58,237,0.3)',
                }}
              >
                <Check style={{ width: '13px', height: '13px' }} />
                Принять
              </button>
              <button
                onClick={decline}
                className="flex items-center justify-center rounded-xl font-heading font-semibold text-[#6B7280] hover:text-[#9CA3AF] transition-colors"
                style={{
                  padding:    '10px 16px',
                  fontSize:   '13px',
                  background: 'rgba(255,255,255,0.04)',
                  border:     '1px solid rgba(255,255,255,0.08)',
                }}
              >
                Отказаться
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
