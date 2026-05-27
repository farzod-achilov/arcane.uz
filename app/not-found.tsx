'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Home, Search, Gamepad2 } from 'lucide-react';

const GLITCH_CHARS = '!<>-_\\/[]{}—=+*^?#@$%&';

function useGlitch(text: string, active: boolean) {
  const [display, setDisplay] = useState(text);

  useEffect(() => {
    if (!active) { setDisplay(text); return; }
    let step = 0;
    const total = 12;
    const id = setInterval(() => {
      step++;
      if (step >= total) { setDisplay(text); clearInterval(id); return; }
      setDisplay(
        text.split('').map((ch, i) => {
          if (ch === ' ') return ' ';
          if (step / total > i / text.length) return ch;
          return GLITCH_CHARS[Math.floor(Math.random() * GLITCH_CHARS.length)];
        }).join('')
      );
    }, 40);
    return () => clearInterval(id);
  }, [text, active]);

  return display;
}

export default function NotFound() {
  const [glitching, setGlitching] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setGlitching(true), 600);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!glitching) return;
    const t = setTimeout(() => setGlitching(false), 600);
    return () => clearTimeout(t);
  }, [glitching]);

  useEffect(() => {
    const id = setInterval(() => setGlitching(true), 4500);
    return () => clearInterval(id);
  }, []);

  const heading = useGlitch('404', glitching);

  return (
    <div
      className="relative flex flex-col items-center justify-center min-h-screen overflow-hidden"
      style={{ background: '#04040A' }}
    >
      <style>{`
        @keyframes float-y {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-12px); }
        }
        @keyframes scanline {
          0%   { transform: translateY(-100%); }
          100% { transform: translateY(100vh); }
        }
        @keyframes pulse-glow {
          0%, 100% { opacity: 0.6; }
          50%       { opacity: 1; }
        }
      `}</style>

      {/* Grid overlay */}
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage: 'linear-gradient(rgba(124,58,237,1) 1px,transparent 1px),linear-gradient(90deg,rgba(124,58,237,1) 1px,transparent 1px)',
        backgroundSize: '64px 64px',
        opacity: 0.018,
      }} />

      {/* Radial glow */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: 'radial-gradient(ellipse 70% 50% at 50% 50%, rgba(124,58,237,0.12) 0%, transparent 70%)',
      }} />

      {/* Scanline effect */}
      <div className="absolute left-0 right-0 pointer-events-none overflow-hidden" style={{ top: 0, bottom: 0 }}>
        <div style={{
          position: 'absolute', left: 0, right: 0,
          height: '2px',
          background: 'linear-gradient(90deg, transparent, rgba(124,58,237,0.3), rgba(6,182,212,0.3), transparent)',
          animation: 'scanline 6s linear infinite',
        }} />
      </div>

      {/* Floating icon */}
      <div style={{ animation: 'float-y 3.5s ease-in-out infinite', marginBottom: '24px' }}>
        <div style={{
          width: '80px', height: '80px', borderRadius: '24px',
          background: 'rgba(124,58,237,0.1)',
          border: '1px solid rgba(124,58,237,0.25)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 0 40px rgba(124,58,237,0.2)',
          animation: 'pulse-glow 3s ease-in-out infinite',
        }}>
          <Gamepad2 style={{ width: '36px', height: '36px', color: '#9D60FA' }} />
        </div>
      </div>

      {/* 404 */}
      <div
        className="font-heading font-bold select-none"
        style={{
          fontSize: 'clamp(100px, 20vw, 200px)',
          lineHeight: 1,
          letterSpacing: '-0.05em',
          background: 'linear-gradient(135deg, #7C3AED 0%, #9D60FA 40%, #06B6D4 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          textShadow: 'none',
          filter: 'drop-shadow(0 0 60px rgba(124,58,237,0.4))',
          transition: 'filter 0.1s',
          marginBottom: '8px',
        }}
      >
        {heading}
      </div>

      {/* Divider */}
      <div style={{
        width: '200px', height: '1px',
        background: 'linear-gradient(90deg, transparent, rgba(124,58,237,0.6), rgba(6,182,212,0.4), transparent)',
        marginBottom: '20px',
      }} />

      {/* Title */}
      <h1
        className="font-heading font-bold text-white text-center"
        style={{ fontSize: 'clamp(20px, 4vw, 32px)', letterSpacing: '-0.02em', marginBottom: '12px' }}
      >
        Страница не найдена
      </h1>

      {/* Subtitle */}
      <p
        className="font-body text-center"
        style={{ color: '#4B5563', fontSize: '15px', maxWidth: '380px', lineHeight: '1.6', marginBottom: '40px' }}
      >
        Эта страница была удалена, перемещена или никогда не существовала.
        Возможно, вы ошиблись в адресе.
      </p>

      {/* Buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Link
          href="/"
          className="flex items-center justify-center gap-2.5 font-heading font-bold rounded-2xl text-white"
          style={{
            padding: '14px 28px',
            fontSize: '14px',
            background: 'linear-gradient(135deg, #7C3AED 0%, #5B21B6 50%, #0891B2 100%)',
            boxShadow: '0 0 40px rgba(124,58,237,0.4), 0 8px 24px rgba(0,0,0,0.4)',
            border: '1px solid rgba(255,255,255,0.08)',
            letterSpacing: '0.02em',
          }}
        >
          <Home style={{ width: '15px', height: '15px' }} />
          На главную
        </Link>

        <Link
          href="/catalog"
          className="flex items-center justify-center gap-2.5 font-heading font-semibold rounded-2xl"
          style={{
            padding: '14px 28px',
            fontSize: '14px',
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            color: '#9CA3AF',
            letterSpacing: '0.02em',
          }}
        >
          <Search style={{ width: '15px', height: '15px' }} />
          Смотреть каталог
        </Link>
      </div>

      {/* Bottom hint */}
      <p className="font-body absolute bottom-10" style={{ fontSize: '11px', color: '#1F2937', letterSpacing: '0.08em' }}>
        ARCANE.UZ · ERROR 404
      </p>
    </div>
  );
}
