interface LogoMarkProps {
  size?: number;
  glow?: boolean;
  className?: string;
}

/* Pixel-art A mark — 7×7 grid on 100×100 viewBox.
   Each pixel: 11×11, gap: 1, step: 12, origin: (8,8)
   Pixel pattern: classic A shape with widening feet */
const PIXELS = [
  // row 0 – apex  (y=8)
  [32,8],[44,8],[56,8],
  // row 1  (y=20)
  [20,20],[68,20],
  // row 2  (y=32)
  [20,32],[68,32],
  // row 3 – crossbar as one rect handled separately
  // row 4  (y=56)
  [8,56],[68,56],   // rendered as 23-wide pairs below
  // row 5  (y=68)
  [8,68],[80,68],
  // row 6  (y=80)
  [8,80],[80,80],
] as const;

export default function LogoMark({ size = 32, glow = false, className = '' }: LogoMarkProps) {
  return (
    <div className={`relative shrink-0 ${className}`} style={{ width: size, height: size }}>
      {glow && (
        <div
          className="absolute inset-0 bg-gradient-to-br from-[#7C3AED] to-[#06B6D4] blur-lg opacity-60"
          style={{ borderRadius: Math.round(size * 0.08) }}
        />
      )}
      <svg
        viewBox="0 0 100 100"
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        className="relative z-10"
        aria-label="ARCANE.UZ logo"
        style={{ imageRendering: 'pixelated' }}
      >
        <defs>
          <linearGradient id="lm-bg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%"   stopColor="#3B0764" />
            <stop offset="50%"  stopColor="#7C3AED" />
            <stop offset="100%" stopColor="#06B6D4" />
          </linearGradient>
          <filter id="lm-glow">
            <feGaussianBlur stdDeviation="1.5" result="blur"/>
            <feMerge>
              <feMergeNode in="blur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        {/* Background — sharp corners for that arcade cabinet feel */}
        <rect width="100" height="100" rx="8" fill="url(#lm-bg)" />
        {/* CRT bezel inner border */}
        <rect x="3" y="3" width="94" height="94" rx="6"
              fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1.5" />

        {/* Pixel-art A */}
        <g fill="white" filter="url(#lm-glow)">
          {/* Single pixels */}
          {PIXELS.map(([x, y]) => (
            <rect key={`${x}-${y}`} x={x} y={y} width={11} height={11} />
          ))}
          {/* Crossbar row 3 — continuous rect cols 1–5 */}
          <rect x="20" y="44" width="59" height="11" />
          {/* Row-4 double pixels left pair (cols 0+1) and right pair (cols 5+6) */}
          <rect x="8"  y="56" width="23" height="11" />
          <rect x="68" y="56" width="23" height="11" />
        </g>
      </svg>
    </div>
  );
}
