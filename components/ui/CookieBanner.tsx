'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { Cookie, X, Check } from 'lucide-react';
import { useDict } from '@/lib/locale/client';

const STORAGE_KEY = 'arcane_cookie_consent';

export default function CookieBanner() {
  const d = useDict();
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
        // Full-width fixed wrapper handles horizontal centering via flexbox.
        // Framer Motion animates the inner element's transform (translateY),
        // so it must NOT also own the centering transform — otherwise the
        // banner loses its translateX(-50%) and slides off the right edge.
        <div className="fixed inset-x-0 bottom-4 sm:bottom-6 z-[9999] flex justify-center px-3 sm:px-4 pointer-events-none">
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="w-full max-w-lg pointer-events-auto"
        >
          <div
            className="rounded-2xl p-4 sm:p-5 relative overflow-hidden"
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
                  {d.cookie.title}
                </p>
                <p className="font-body text-[#6B7280]" style={{ fontSize: '12px', lineHeight: '1.5' }}>
                  {d.cookie.body}{' '}
                  <Link href="/privacy" className="text-[#7C3AED] hover:text-[#9D60FA] transition-colors">
                    {d.cookie.policy}
                  </Link>
                </p>
              </div>
            </div>

            <div className="flex flex-col-reverse xs:flex-row gap-2.5 mt-4">
              <button
                onClick={accept}
                className="flex-1 flex items-center justify-center gap-1.5 rounded-xl font-heading font-semibold text-white"
                style={{
                  padding:    '11px',
                  fontSize:   '13px',
                  background: 'linear-gradient(135deg, #7C3AED, #06B6D4)',
                  boxShadow:  '0 0 20px rgba(124,58,237,0.3)',
                }}
              >
                <Check style={{ width: '13px', height: '13px' }} />
                {d.cookie.accept}
              </button>
              <button
                onClick={decline}
                className="flex items-center justify-center rounded-xl font-heading font-semibold text-[#6B7280] hover:text-[#9CA3AF] transition-colors"
                style={{
                  padding:    '11px 16px',
                  fontSize:   '13px',
                  background: 'rgba(255,255,255,0.04)',
                  border:     '1px solid rgba(255,255,255,0.08)',
                }}
              >
                {d.cookie.decline}
              </button>
            </div>
          </div>
        </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
