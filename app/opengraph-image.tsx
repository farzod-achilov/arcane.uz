import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt     = 'ARCANE.UZ — Премиальный магазин игр';
export const size    = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #05040B 0%, #0D0B1A 50%, #12101F 100%)',
          fontFamily: 'sans-serif',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Purple glow top-left */}
        <div
          style={{
            position: 'absolute',
            top: -120,
            left: -120,
            width: 500,
            height: 500,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(124,58,237,0.35) 0%, transparent 70%)',
            display: 'flex',
          }}
        />
        {/* Cyan glow bottom-right */}
        <div
          style={{
            position: 'absolute',
            bottom: -100,
            right: -100,
            width: 400,
            height: 400,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(6,182,212,0.25) 0%, transparent 70%)',
            display: 'flex',
          }}
        />

        {/* Logo mark */}
        <div
          style={{
            width: 80,
            height: 80,
            borderRadius: 22,
            background: 'linear-gradient(135deg, #7C3AED, #5B21B6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 28,
            boxShadow: '0 0 40px rgba(124,58,237,0.6)',
          }}
        >
          <span style={{ color: '#fff', fontSize: 42, fontWeight: 900 }}>A</span>
        </div>

        {/* Title */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            marginBottom: 20,
          }}
        >
          <span style={{ color: '#ffffff', fontSize: 64, fontWeight: 800, letterSpacing: '-1px' }}>
            ARCANE
          </span>
          <span style={{ color: '#7C3AED', fontSize: 64, fontWeight: 800, letterSpacing: '-1px' }}>
            .UZ
          </span>
        </div>

        {/* Tagline */}
        <p
          style={{
            color: '#9CA3AF',
            fontSize: 26,
            margin: 0,
            textAlign: 'center',
            maxWidth: 700,
            lineHeight: 1.4,
          }}
        >
          Цифровые игры для PC, PS5 и Xbox по лучшим ценам в Узбекистане
        </p>

        {/* Pills */}
        <div style={{ display: 'flex', gap: 16, marginTop: 40 }}>
          {['🎮 5000+ игр', '⚡ Быстрая доставка', '💳 Click / Payme'].map((text) => (
            <div
              key={text}
              style={{
                background: 'rgba(124,58,237,0.15)',
                border: '1px solid rgba(124,58,237,0.4)',
                borderRadius: 100,
                padding: '10px 24px',
                color: '#C4B5FD',
                fontSize: 20,
                display: 'flex',
              }}
            >
              {text}
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size },
  );
}
