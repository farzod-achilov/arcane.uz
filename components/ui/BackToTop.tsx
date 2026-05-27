'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUp } from 'lucide-react';

export default function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 500);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          key="back-to-top"
          initial={{ opacity: 0, y: 16, scale: 0.85 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.85 }}
          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.92 }}
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          aria-label="Наверх"
          className="fixed bottom-6 right-6 z-[200] w-11 h-11 flex items-center justify-center rounded-2xl"
          style={{
            background: 'rgba(13,13,22,0.9)',
            border: '1px solid rgba(124,58,237,0.35)',
            backdropFilter: 'blur(12px)',
            boxShadow: '0 0 20px rgba(124,58,237,0.2), 0 4px 16px rgba(0,0,0,0.5)',
            color: '#A78BFA',
          }}
        >
          <ArrowUp style={{ width: '16px', height: '16px' }} />
        </motion.button>
      )}
    </AnimatePresence>
  );
}
