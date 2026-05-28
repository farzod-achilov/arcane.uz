'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export interface Banner {
  id:         string;
  title:      string;
  subtitle:   string | null;
  buttonText: string | null;
  buttonLink: string | null;
  imageUrl:   string | null;
  badgeText:  string | null;
  colorFrom:  string;
  colorTo:    string;
}

function BannerSlide({ banner }: { banner: Banner }) {
  const gradient = `linear-gradient(135deg, ${banner.colorFrom}33, ${banner.colorTo}22)`;

  return (
    <div className="relative w-full h-full overflow-hidden rounded-2xl"
         style={{ background: gradient, border: '1px solid rgba(255,255,255,0.07)' }}>

      {/* Background image */}
      {banner.imageUrl && (
        <>
          <Image src={banner.imageUrl} alt={banner.title} fill unoptimized
                 className="object-cover opacity-30" style={{ objectPosition: 'center right' }} />
          <div className="absolute inset-0"
               style={{ background: `linear-gradient(90deg, rgba(5,4,11,0.95) 35%, rgba(5,4,11,0.4) 70%, rgba(5,4,11,0.15) 100%)` }} />
        </>
      )}

      {/* Glow orbs */}
      <div className="absolute top-0 left-0 w-64 h-64 pointer-events-none"
           style={{ background: `radial-gradient(circle, ${banner.colorFrom}25, transparent 65%)`, filter: 'blur(40px)' }} />
      <div className="absolute bottom-0 right-0 w-48 h-48 pointer-events-none"
           style={{ background: `radial-gradient(circle, ${banner.colorTo}20, transparent 65%)`, filter: 'blur(40px)' }} />

      {/* Content */}
      <div className="relative z-10 h-full flex flex-col justify-center px-8 sm:px-12 py-8 max-w-2xl">
        {banner.badgeText && (
          <motion.div
            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="inline-flex items-center gap-2 rounded-full px-3 py-1 mb-4 self-start"
            style={{ background: `${banner.colorFrom}25`, border: `1px solid ${banner.colorFrom}50` }}>
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: banner.colorFrom }} />
            <span className="font-pixel text-white" style={{ fontSize: '8px', letterSpacing: '0.1em' }}>
              {banner.badgeText.toUpperCase()}
            </span>
          </motion.div>
        )}

        <motion.h2
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="font-heading font-bold text-white leading-tight mb-3"
          style={{ fontSize: 'clamp(22px, 3.5vw, 40px)' }}>
          {banner.title}
        </motion.h2>

        {banner.subtitle && (
          <motion.p
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="font-body text-[#9CA3AF] mb-6"
            style={{ fontSize: 'clamp(13px, 1.5vw, 16px)', lineHeight: 1.6, maxWidth: '480px' }}>
            {banner.subtitle}
          </motion.p>
        )}

        {banner.buttonText && banner.buttonLink && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
            <Link href={banner.buttonLink}
                  className="inline-flex items-center gap-2 rounded-xl px-6 py-3 font-heading font-semibold text-white transition-all hover:opacity-90 hover:scale-[1.02]"
                  style={{
                    background: `linear-gradient(135deg, ${banner.colorFrom}, ${banner.colorTo})`,
                    boxShadow:  `0 0 24px ${banner.colorFrom}50`,
                    fontSize:   '14px',
                  }}>
              {banner.buttonText}
            </Link>
          </motion.div>
        )}
      </div>
    </div>
  );
}

export default function PromoBanner({ banners }: { banners: Banner[] }) {
  const [current, setCurrent] = useState(0);
  const [paused,  setPaused]  = useState(false);

  const next = useCallback(() => setCurrent(c => (c + 1) % banners.length), [banners.length]);
  const prev = useCallback(() => setCurrent(c => (c - 1 + banners.length) % banners.length), [banners.length]);

  useEffect(() => {
    if (paused || banners.length <= 1) return;
    const t = setInterval(next, 5000);
    return () => clearInterval(t);
  }, [paused, banners.length, next]);

  if (banners.length === 0) return null;

  return (
    <section className="relative max-w-7xl mx-auto px-4 sm:px-6 mb-10"
             onMouseEnter={() => setPaused(true)}
             onMouseLeave={() => setPaused(false)}>

      <div className="relative" style={{ height: 'clamp(200px, 30vw, 380px)' }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={current}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-0"
          >
            <BannerSlide banner={banners[current]} />
          </motion.div>
        </AnimatePresence>

        {/* Arrows */}
        {banners.length > 1 && (
          <>
            <button
              onClick={prev}
              className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:scale-110"
              style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(8px)' }}>
              <ChevronLeft style={{ width: '16px', height: '16px', color: '#9CA3AF' }} />
            </button>
            <button
              onClick={next}
              className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:scale-110"
              style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(8px)' }}>
              <ChevronRight style={{ width: '16px', height: '16px', color: '#9CA3AF' }} />
            </button>
          </>
        )}
      </div>

      {/* Dots */}
      {banners.length > 1 && (
        <div className="flex items-center justify-center gap-2 mt-4">
          {banners.map((b, i) => (
            <button
              key={b.id}
              onClick={() => setCurrent(i)}
              className="rounded-full transition-all duration-300"
              style={{
                width:      i === current ? '20px' : '6px',
                height:     '6px',
                background: i === current ? banners[current].colorFrom : 'rgba(255,255,255,0.15)',
              }}
            />
          ))}
        </div>
      )}
    </section>
  );
}
