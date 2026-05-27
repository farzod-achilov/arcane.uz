'use client';

import { useEffect } from 'react';
import { Home, RefreshCw, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[ARCANE error]', error);
  }, [error]);

  return (
    <div
      className="relative flex flex-col items-center justify-center min-h-screen overflow-hidden"
      style={{ background: '#04040A' }}
    >
      <style>{`
        @keyframes float-y {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-10px); }
        }
        @keyframes pulse-red {
          0%, 100% { box-shadow: 0 0 30px rgba(239,68,68,0.15); }
          50%       { box-shadow: 0 0 50px rgba(239,68,68,0.35); }
        }
      `}</style>

      {/* Grid */}
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage: 'linear-gradient(rgba(239,68,68,1) 1px,transparent 1px),linear-gradient(90deg,rgba(239,68,68,1) 1px,transparent 1px)',
        backgroundSize: '64px 64px',
        opacity: 0.012,
      }} />

      {/* Radial glow */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: 'radial-gradient(ellipse 60% 40% at 50% 50%, rgba(239,68,68,0.07) 0%, transparent 70%)',
      }} />

      {/* Icon */}
      <div style={{ animation: 'float-y 3s ease-in-out infinite', marginBottom: '28px' }}>
        <div style={{
          width: '80px', height: '80px', borderRadius: '24px',
          background: 'rgba(239,68,68,0.08)',
          border: '1px solid rgba(239,68,68,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          animation: 'pulse-red 3s ease-in-out infinite',
        }}>
          <AlertTriangle style={{ width: '36px', height: '36px', color: '#F87171' }} />
        </div>
      </div>

      {/* Heading */}
      <h1
        className="font-heading font-bold text-white text-center"
        style={{ fontSize: 'clamp(28px, 5vw, 44px)', letterSpacing: '-0.025em', marginBottom: '10px' }}
      >
        Что-то пошло не так
      </h1>

      {/* Divider */}
      <div style={{
        width: '160px', height: '1px',
        background: 'linear-gradient(90deg, transparent, rgba(239,68,68,0.5), transparent)',
        marginBottom: '18px',
      }} />

      {/* Description */}
      <p
        className="font-body text-center"
        style={{ color: '#4B5563', fontSize: '15px', maxWidth: '400px', lineHeight: '1.65', marginBottom: '12px' }}
      >
        На сервере произошла непредвиденная ошибка. Попробуйте обновить страницу
        или вернитесь на главную.
      </p>

      {/* Error digest */}
      {error.digest && (
        <div
          className="font-body mb-8"
          style={{
            fontSize: '11px', color: '#374151',
            background: 'rgba(239,68,68,0.05)',
            border: '1px solid rgba(239,68,68,0.1)',
            borderRadius: '8px',
            padding: '6px 14px',
            letterSpacing: '0.05em',
          }}
        >
          digest: {error.digest}
        </div>
      )}

      {/* Buttons */}
      <div className={`flex flex-col sm:flex-row gap-3 ${error.digest ? '' : 'mt-8'}`}>
        <button
          onClick={reset}
          className="flex items-center justify-center gap-2.5 font-heading font-bold rounded-2xl text-white"
          style={{
            padding: '14px 28px',
            fontSize: '14px',
            background: 'linear-gradient(135deg, #DC2626 0%, #9B1C1C 50%, #7F1D1D 100%)',
            boxShadow: '0 0 36px rgba(239,68,68,0.3), 0 8px 24px rgba(0,0,0,0.4)',
            border: '1px solid rgba(255,255,255,0.07)',
            letterSpacing: '0.02em',
            cursor: 'pointer',
          }}
        >
          <RefreshCw style={{ width: '15px', height: '15px' }} />
          Попробовать снова
        </button>

        <Link
          href="/"
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
          <Home style={{ width: '15px', height: '15px' }} />
          На главную
        </Link>
      </div>

      {/* Bottom label */}
      <p className="font-body absolute bottom-10" style={{ fontSize: '11px', color: '#1F2937', letterSpacing: '0.08em' }}>
        ARCANE.UZ · SYSTEM ERROR
      </p>
    </div>
  );
}
