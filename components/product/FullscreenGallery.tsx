'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

interface FullscreenGalleryProps {
  images: string[];
  startIndex: number;
  onClose: () => void;
}

export default function FullscreenGallery({
  images,
  startIndex,
  onClose,
}: FullscreenGalleryProps) {
  const [idx, setIdx]       = useState(startIndex);
  const [mounted, setMounted] = useState(false);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);

  /* ── Portal mount ─────────────────────────────────────── */
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  /* ── Body scroll lock ──────────────────────────────────── */
  useEffect(() => {
    // Preserve existing overflow and account for scrollbar width to prevent layout shift
    const savedOverflow     = document.body.style.overflow;
    const savedPaddingRight = document.body.style.paddingRight;
    const scrollbarW        = window.innerWidth - document.documentElement.clientWidth;

    document.body.style.overflow     = 'hidden';
    document.body.style.paddingRight = scrollbarW > 0 ? `${scrollbarW}px` : '';

    return () => {
      document.body.style.overflow     = savedOverflow;
      document.body.style.paddingRight = savedPaddingRight;
    };
  }, []);

  /* ── Navigation helpers ───────────────────────────────── */
  const prev = useCallback(
    () => setIdx(i => (i === 0 ? images.length - 1 : i - 1)),
    [images.length],
  );
  const next = useCallback(
    () => setIdx(i => (i === images.length - 1 ? 0 : i + 1)),
    [images.length],
  );

  /* ── Keyboard navigation ──────────────────────────────── */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape')     { e.preventDefault(); onClose(); }
      if (e.key === 'ArrowLeft')  { e.preventDefault(); prev(); }
      if (e.key === 'ArrowRight') { e.preventDefault(); next(); }
    };
    document.addEventListener('keydown', handler, { capture: true });
    return () => document.removeEventListener('keydown', handler, { capture: true });
  }, [onClose, prev, next]);

  /* ── Touch / swipe support ────────────────────────────── */
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  }, []);

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      const dx = e.changedTouches[0].clientX - touchStartX.current;
      const dy = e.changedTouches[0].clientY - touchStartY.current;
      // Only handle if horizontal swipe > 50px and clearly horizontal
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) {
        if (dx > 0) prev();
        else next();
      }
    },
    [prev, next],
  );

  /* ── Don't render until portal target exists ──────────── */
  if (!mounted) return null;

  const content = (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.22, ease: 'easeOut' }}
      /* z-index: 9999 renders above Navbar (z-50), StickyPanel (z-[100]),
         SearchOverlay (z-[201]), and any other fixed elements */
      className="fixed inset-0 flex flex-col select-none"
      style={{
        zIndex: 9999,
        background: 'rgba(4,3,10,0.97)',
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
      }}
      /* Backdrop click → close */
      onClick={onClose}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* ── Top glow line ── */}
      <div
        className="absolute top-0 left-0 right-0 h-px pointer-events-none"
        style={{
          background:
            'linear-gradient(90deg, transparent, rgba(124,58,237,0.6) 30%, rgba(6,182,212,0.4) 70%, transparent)',
        }}
      />

      {/* ── Header: counter + close ── */}
      <div
        className="flex items-center justify-between px-4 sm:px-8 py-4 flex-shrink-0"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center gap-3">
          <span className="font-body text-[#6B7280]" style={{ fontSize: '12px' }}>
            {idx + 1}
          </span>
          <div className="flex gap-1">
            {images.map((_, i) => (
              <button
                key={i}
                onClick={() => setIdx(i)}
                className="transition-all duration-200 rounded-full"
                style={{
                  width: i === idx ? '18px' : '6px',
                  height: '6px',
                  background:
                    i === idx
                      ? 'linear-gradient(90deg, #7C3AED, #06B6D4)'
                      : 'rgba(255,255,255,0.2)',
                }}
              />
            ))}
          </div>
          <span className="font-body text-[#374151]" style={{ fontSize: '12px' }}>
            / {images.length}
          </span>
        </div>

        <button
          onClick={onClose}
          className="p-2.5 rounded-xl transition-all duration-200 flex-shrink-0"
          style={{
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.1)',
            color: '#6B7280',
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.15)';
            (e.currentTarget as HTMLElement).style.color = '#F87171';
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)';
            (e.currentTarget as HTMLElement).style.color = '#6B7280';
          }}
          aria-label="Закрыть (Esc)"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* ── Main image stage ── */}
      <div
        className="flex-1 flex items-center justify-center relative min-h-0 px-14 sm:px-20"
        onClick={e => e.stopPropagation()}
      >
        {/* Prev button */}
        {images.length > 1 && (
          <button
            onClick={e => { e.stopPropagation(); prev(); }}
            className="absolute left-2 sm:left-5 z-10 w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all duration-200 flex-shrink-0"
            style={{
              background: 'rgba(255,255,255,0.07)',
              border: '1px solid rgba(255,255,255,0.12)',
            }}
            onMouseEnter={e => {
              const el = e.currentTarget as HTMLElement;
              el.style.background = 'rgba(124,58,237,0.5)';
              el.style.boxShadow  = '0 0 14px rgba(124,58,237,0.4)';
            }}
            onMouseLeave={e => {
              const el = e.currentTarget as HTMLElement;
              el.style.background = 'rgba(255,255,255,0.07)';
              el.style.boxShadow  = 'none';
            }}
            aria-label="Предыдущий (←)"
          >
            <ChevronLeft className="w-5 h-5 text-white" />
          </button>
        )}

        {/* Animated image */}
        <AnimatePresence mode="wait">
          <motion.div
            key={idx}
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.02 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="relative w-full rounded-2xl overflow-hidden"
            style={{
              maxWidth: 'min(960px, 100%)',
              /* 16:9 but never taller than viewport minus header/footer */
              aspectRatio: '16/9',
              maxHeight: 'calc(100vh - 180px)',
              boxShadow:
                '0 0 60px rgba(124,58,237,0.18), 0 40px 80px rgba(0,0,0,0.7)',
            }}
            onClick={e => e.stopPropagation()}
          >
            <Image
              src={images[idx]}
              alt={`Screenshot ${idx + 1}`}
              fill
              unoptimized
              className="object-cover"
              priority
            />
            {/* Top chrome line */}
            <div
              className="absolute top-0 left-0 right-0 h-px pointer-events-none"
              style={{
                background:
                  'linear-gradient(90deg, transparent, rgba(124,58,237,0.5) 30%, rgba(6,182,212,0.4) 70%, transparent)',
              }}
            />
          </motion.div>
        </AnimatePresence>

        {/* Next button */}
        {images.length > 1 && (
          <button
            onClick={e => { e.stopPropagation(); next(); }}
            className="absolute right-2 sm:right-5 z-10 w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all duration-200 flex-shrink-0"
            style={{
              background: 'rgba(255,255,255,0.07)',
              border: '1px solid rgba(255,255,255,0.12)',
            }}
            onMouseEnter={e => {
              const el = e.currentTarget as HTMLElement;
              el.style.background = 'rgba(124,58,237,0.5)';
              el.style.boxShadow  = '0 0 14px rgba(124,58,237,0.4)';
            }}
            onMouseLeave={e => {
              const el = e.currentTarget as HTMLElement;
              el.style.background = 'rgba(255,255,255,0.07)';
              el.style.boxShadow  = 'none';
            }}
            aria-label="Следующий (→)"
          >
            <ChevronRight className="w-5 h-5 text-white" />
          </button>
        )}
      </div>

      {/* ── Thumbnail strip ── */}
      {images.length > 1 && (
        <div
          className="flex justify-center gap-2 px-4 py-4 overflow-x-auto flex-shrink-0"
          style={{ scrollbarWidth: 'none' }}
          onClick={e => e.stopPropagation()}
        >
          {images.map((src, i) => (
            <button
              key={i}
              onClick={e => { e.stopPropagation(); setIdx(i); }}
              className="flex-shrink-0 relative rounded-xl overflow-hidden transition-all duration-200"
              style={{
                width: '72px',
                height: '45px',
                border: `2px solid ${i === idx ? '#7C3AED' : 'rgba(255,255,255,0.08)'}`,
                boxShadow: i === idx ? '0 0 12px rgba(124,58,237,0.5)' : 'none',
                opacity: i === idx ? 1 : 0.45,
                transform: i === idx ? 'scale(1.05)' : 'scale(1)',
              }}
            >
              <Image src={src} alt="" fill unoptimized className="object-cover" />
            </button>
          ))}
        </div>
      )}

      {/* ── Mobile swipe hint ── */}
      <div
        className="sm:hidden text-center pb-3 flex-shrink-0"
        onClick={e => e.stopPropagation()}
      >
        <span className="font-body text-[#1F2937]" style={{ fontSize: '10px', letterSpacing: '0.06em' }}>
          СВАЙП ДЛЯ НАВИГАЦИИ
        </span>
      </div>
    </motion.div>
  );

  /* Render via portal → always at document.body level, above ALL elements */
  return createPortal(content, document.body);
}
