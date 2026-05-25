'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { X, ChevronLeft, ChevronRight, Play, Volume2, VolumeX, Maximize } from 'lucide-react';
import { useHls, isHlsUrl } from '@/hooks/useHls';
import { parseMedia, isVideoMedia, isYouTubeMedia } from '@/lib/media';

interface FullscreenGalleryProps {
  media: string[];
  startIndex: number;
  onClose: () => void;
}

function isVideo(url: string) { return isVideoMedia(url); }
function isYouTube(url: string) { return isYouTubeMedia(url); }

/* ── Inline video player inside fullscreen ── */
function FsVideoPlayer({ encoded }: { encoded: string }) {
  const { src } = parseMedia(encoded);
  const vidRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [muted,   setMuted]   = useState(false);

  useHls(vidRef, src);

  const togglePlay = () => {
    const v = vidRef.current;
    if (!v) return;
    if (v.paused) v.play(); else v.pause();
  };
  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    const v = vidRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setMuted(v.muted);
  };

  return (
    <div className="w-full h-full flex items-center justify-center bg-black relative"
         onClick={togglePlay}>
      <video
        ref={vidRef}
        src={isHlsUrl(src) ? undefined : src}
        playsInline
        className="max-w-full max-h-full"
        style={{ objectFit: 'contain' }}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
      />

      {/* Overlay when paused */}
      <div className="absolute inset-0 pointer-events-none transition-opacity duration-300"
           style={{ background: 'rgba(0,0,0,0.4)', opacity: playing ? 0 : 1 }} />

      {!playing && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-24 h-24 rounded-full flex items-center justify-center"
               style={{ background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(12px)', border: '2px solid rgba(255,255,255,0.25)', boxShadow: '0 0 50px rgba(124,58,237,0.5)' }}>
            <Play style={{ width: '36px', height: '36px', color: '#fff', marginLeft: '5px' }} />
          </div>
        </div>
      )}

      {/* Controls bar */}
      <div className="absolute bottom-0 left-0 right-0 flex items-center gap-3 px-5 py-3 opacity-0 hover:opacity-100 transition-opacity duration-200"
           style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.9), transparent)' }}
           onClick={e => e.stopPropagation()}>
        <button onClick={togglePlay}
          className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-white/10 transition-colors">
          {playing
            ? <span style={{ color: '#fff', fontSize: '16px' }}>⏸</span>
            : <Play style={{ width: '16px', height: '16px', color: '#fff', marginLeft: '1px' }} />}
        </button>
        <button onClick={toggleMute}
          className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-white/10 transition-colors">
          {muted
            ? <VolumeX style={{ width: '16px', height: '16px', color: '#fff' }} />
            : <Volume2 style={{ width: '16px', height: '16px', color: '#fff' }} />}
        </button>
        <div className="flex-1" />
        <span className="font-pixel text-white/40" style={{ fontSize: '8px', letterSpacing: '0.08em' }}>ТРЕЙЛЕР</span>
      </div>
    </div>
  );
}

export default function FullscreenGallery({ media, startIndex, onClose }: FullscreenGalleryProps) {
  const [idx, setIdx]       = useState(Math.max(0, Math.min(startIndex, media.length - 1)));
  const [mounted, setMounted] = useState(false);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);

  useEffect(() => { setMounted(true); return () => setMounted(false); }, []);

  useEffect(() => {
    const saved = document.body.style.overflow;
    const savedPR = document.body.style.paddingRight;
    const sw = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = 'hidden';
    document.body.style.paddingRight = sw > 0 ? `${sw}px` : '';
    return () => { document.body.style.overflow = saved; document.body.style.paddingRight = savedPR; };
  }, []);

  const prev = useCallback(() => setIdx(i => (i === 0 ? media.length - 1 : i - 1)), [media.length]);
  const next = useCallback(() => setIdx(i => (i === media.length - 1 ? 0 : i + 1)), [media.length]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape')     { e.preventDefault(); onClose(); }
      if (e.key === 'ArrowLeft')  { e.preventDefault(); prev(); }
      if (e.key === 'ArrowRight') { e.preventDefault(); next(); }
    };
    document.addEventListener('keydown', handler, { capture: true });
    return () => document.removeEventListener('keydown', handler, { capture: true });
  }, [onClose, prev, next]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  }, []);
  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dy = e.changedTouches[0].clientY - touchStartY.current;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      if (dx > 0) prev(); else next();
    }
  }, [prev, next]);

  if (!mounted) return null;

  const current = media[idx] ?? '';

  const content = (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      transition={{ duration: 0.22, ease: 'easeOut' }}
      className="fixed inset-0 flex flex-col select-none"
      style={{ zIndex: 9999, background: 'rgba(4,3,10,0.97)', backdropFilter: 'blur(14px)' }}
      onClick={onClose}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Top glow line */}
      <div className="absolute top-0 left-0 right-0 h-px pointer-events-none"
           style={{ background: 'linear-gradient(90deg, transparent, rgba(124,58,237,0.6) 30%, rgba(6,182,212,0.4) 70%, transparent)' }} />

      {/* Header */}
      <div className="flex items-center justify-between px-4 sm:px-8 py-4 flex-shrink-0"
           onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-3">
          <span className="font-body text-[#6B7280]" style={{ fontSize: '12px' }}>{idx + 1}</span>
          <div className="flex gap-1">
            {media.map((_, i) => (
              <button key={i} onClick={() => setIdx(i)}
                className="transition-all duration-200 rounded-full"
                style={{
                  width: i === idx ? '18px' : '6px', height: '6px',
                  background: i === idx ? 'linear-gradient(90deg, #7C3AED, #06B6D4)' : 'rgba(255,255,255,0.2)',
                }} />
            ))}
          </div>
          <span className="font-body text-[#374151]" style={{ fontSize: '12px' }}>/ {media.length}</span>
        </div>
        <button onClick={onClose}
          className="p-2.5 rounded-xl transition-all duration-200"
          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#6B7280' }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.15)'; (e.currentTarget as HTMLElement).style.color = '#F87171'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)'; (e.currentTarget as HTMLElement).style.color = '#6B7280'; }}
          aria-label="Закрыть (Esc)">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Main stage */}
      <div className="flex-1 flex items-center justify-center relative min-h-0 px-14 sm:px-20"
           onClick={e => e.stopPropagation()}>

        {media.length > 1 && (
          <button onClick={e => { e.stopPropagation(); prev(); }}
            className="absolute left-2 sm:left-5 z-10 w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all duration-200"
            style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(124,58,237,0.5)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.07)'; }}>
            <ChevronLeft className="w-5 h-5 text-white" />
          </button>
        )}

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
              aspectRatio: '16/9',
              maxHeight: 'calc(100vh - 180px)',
              boxShadow: '0 0 60px rgba(124,58,237,0.18), 0 40px 80px rgba(0,0,0,0.7)',
              background: '#000',
            }}
            onClick={e => e.stopPropagation()}
          >
            {isYouTube(current) ? (
              <iframe
                src={parseMedia(current).src}
                className="absolute inset-0 w-full h-full"
                allow="autoplay; fullscreen"
                allowFullScreen
                style={{ border: 'none' }}
              />
            ) : isVideo(current) ? (
              <FsVideoPlayer encoded={current} />
            ) : (
              <>
                <Image src={current} alt={`Screenshot ${idx + 1}`} fill unoptimized className="object-cover" priority />
                <div className="absolute top-0 left-0 right-0 h-px pointer-events-none"
                     style={{ background: 'linear-gradient(90deg, transparent, rgba(124,58,237,0.5) 30%, rgba(6,182,212,0.4) 70%, transparent)' }} />
              </>
            )}
          </motion.div>
        </AnimatePresence>

        {media.length > 1 && (
          <button onClick={e => { e.stopPropagation(); next(); }}
            className="absolute right-2 sm:right-5 z-10 w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all duration-200"
            style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(124,58,237,0.5)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.07)'; }}>
            <ChevronRight className="w-5 h-5 text-white" />
          </button>
        )}
      </div>

      {/* Thumbnail strip */}
      {media.length > 1 && (
        <div className="flex justify-center gap-2 px-4 py-4 overflow-x-auto flex-shrink-0"
             style={{ scrollbarWidth: 'none' }}
             onClick={e => e.stopPropagation()}>
          {media.map((encoded, i) => {
            const isVid = isVideo(encoded) || isYouTube(encoded);
            const { src: imgSrc, thumb } = parseMedia(encoded);
            const thumbSrc = isVid ? (thumb ?? null) : imgSrc;
            return (
              <button key={i} onClick={e => { e.stopPropagation(); setIdx(i); }}
                className="flex-shrink-0 relative rounded-xl overflow-hidden transition-all duration-200"
                style={{
                  width: '72px', height: '45px',
                  border: `2px solid ${i === idx ? '#7C3AED' : 'rgba(255,255,255,0.08)'}`,
                  boxShadow: i === idx ? '0 0 12px rgba(124,58,237,0.5)' : 'none',
                  opacity: i === idx ? 1 : 0.45,
                  transform: i === idx ? 'scale(1.05)' : 'scale(1)',
                  background: '#0a0a14',
                }}>
                {thumbSrc ? (
                  <>
                    <Image src={thumbSrc} alt="" fill unoptimized className="object-cover" />
                    {isVid && (
                      <div className="absolute inset-0 flex items-center justify-center"
                           style={{ background: 'rgba(0,0,0,0.35)' }}>
                        <div className="w-6 h-6 rounded-full flex items-center justify-center"
                             style={{ background: 'rgba(124,58,237,0.85)', backdropFilter: 'blur(4px)' }}>
                          <Play style={{ width: '10px', height: '10px', color: '#fff', marginLeft: '1px' }} />
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center"
                       style={{ background: 'linear-gradient(135deg, #1a0a2e, #0a1428)' }}>
                    <Play style={{ width: '16px', height: '16px', color: '#9D60FA' }} />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}

      <div className="sm:hidden text-center pb-3 flex-shrink-0" onClick={e => e.stopPropagation()}>
        <span className="font-body text-[#1F2937]" style={{ fontSize: '10px', letterSpacing: '0.06em' }}>СВАЙП ДЛЯ НАВИГАЦИИ</span>
      </div>
    </motion.div>
  );

  return createPortal(content, document.body);
}
