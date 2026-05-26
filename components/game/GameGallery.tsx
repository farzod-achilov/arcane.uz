'use client';

import { useState, useCallback } from 'react';
import Image from 'next/image';
import { AnimatePresence } from 'framer-motion';
import { Maximize2, Package } from 'lucide-react';
import FullscreenGallery from '@/components/product/FullscreenGallery';

interface Props {
  screenshots: string[];
  cover: string | null;
  title: string;
}

export default function GameGallery({ screenshots, cover, title }: Props) {
  const [activeIdx, setActiveIdx] = useState(0);
  const [fsOpen, setFsOpen]       = useState(false);
  const openFs  = useCallback(() => setFsOpen(true),  []);
  const closeFs = useCallback(() => setFsOpen(false), []);

  if (screenshots.length === 0) {
    if (!cover) return null;
    return (
      <div
        className="relative rounded-2xl overflow-hidden"
        style={{
          aspectRatio: '16/9',
          background: '#0D0D16',
          border: '1px solid rgba(255,255,255,0.06)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
        }}
      >
        <Image src={cover} alt={title} fill unoptimized className="object-cover" />
      </div>
    );
  }

  const current = screenshots[activeIdx];

  return (
    <div>
      {/* Main viewer */}
      <div
        className="relative rounded-2xl overflow-hidden mb-3 cursor-zoom-in group"
        style={{
          aspectRatio: '16/9',
          background: '#050507',
          border: '1px solid rgba(255,255,255,0.06)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
        }}
        onClick={openFs}
      >
        <Image
          key={current}
          src={current}
          alt={`${title} screenshot ${activeIdx + 1}`}
          fill unoptimized
          className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
        />

        {/* Hover overlay */}
        <div
          className="absolute inset-0 pointer-events-none transition-opacity duration-200 opacity-0 group-hover:opacity-100 flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.25)' }}
        >
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(124,58,237,0.85)', backdropFilter: 'blur(8px)', boxShadow: '0 0 24px rgba(124,58,237,0.5)' }}
          >
            <Maximize2 className="w-5 h-5 text-white" />
          </div>
        </div>

        {/* Counter badge */}
        <div
          className="absolute bottom-3 right-3 font-pixel rounded-lg px-2.5 py-1"
          style={{ fontSize: '8px', letterSpacing: '0.06em', background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.1)' }}
        >
          {activeIdx + 1} / {screenshots.length}
        </div>
      </div>

      {/* Thumbnail strip */}
      {screenshots.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'thin' }}>
          {screenshots.map((src, i) => (
            <button
              key={i}
              onClick={() => setActiveIdx(i)}
              className="relative flex-shrink-0 rounded-xl overflow-hidden transition-all duration-200"
              style={{
                width: '88px',
                aspectRatio: '16/9',
                border: `2px solid ${i === activeIdx ? '#7C3AED' : 'rgba(255,255,255,0.06)'}`,
                boxShadow: i === activeIdx ? '0 0 12px rgba(124,58,237,0.5)' : 'none',
                opacity: i === activeIdx ? 1 : 0.5,
                transform: i === activeIdx ? 'scale(1.03)' : 'scale(1)',
                background: '#050507',
              }}
            >
              <Image src={src} alt="" fill unoptimized className="object-cover" />
            </button>
          ))}
        </div>
      )}

      {/* Fullscreen gallery */}
      <AnimatePresence>
        {fsOpen && (
          <FullscreenGallery
            media={screenshots}
            startIndex={activeIdx}
            onClose={closeFs}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
