interface LogoFullProps {
  width?: number;
  height?: number;
  className?: string;
}

export default function LogoFull({ width = 200, height = 240, className = '' }: LogoFullProps) {
  return (
    <svg
      viewBox="0 0 400 480"
      xmlns="http://www.w3.org/2000/svg"
      width={width}
      height={height}
      className={className}
      aria-label="ARCANE.UZ"
    >
      <defs>
        <linearGradient id="lf-border" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%"   stopColor="#9D60FA"/>
          <stop offset="50%"  stopColor="#7C3AED"/>
          <stop offset="100%" stopColor="#06B6D4"/>
        </linearGradient>
        <linearGradient id="lf-border-v" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%"   stopColor="#9D60FA"/>
          <stop offset="100%" stopColor="#06B6D4"/>
        </linearGradient>
        <linearGradient id="lf-cabinet" x1="0%" y1="0%" x2="10%" y2="100%">
          <stop offset="0%"   stopColor="#1C0A35"/>
          <stop offset="100%" stopColor="#0C0C1A"/>
        </linearGradient>
        <linearGradient id="lf-marquee" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%"   stopColor="#1E0845"/>
          <stop offset="50%"  stopColor="#280D55"/>
          <stop offset="100%" stopColor="#081840"/>
        </linearGradient>
        <linearGradient id="lf-screen" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%"   stopColor="#0E0128"/>
          <stop offset="100%" stopColor="#00081E"/>
        </linearGradient>
        <linearGradient id="lf-text" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%"   stopColor="#FFFFFF"/>
          <stop offset="30%"  stopColor="#C4B5FD"/>
          <stop offset="65%"  stopColor="#7C3AED"/>
          <stop offset="100%" stopColor="#06B6D4"/>
        </linearGradient>
        <linearGradient id="lf-diamond" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%"   stopColor="#A78BFA"/>
          <stop offset="100%" stopColor="#06B6D4"/>
        </linearGradient>
        <linearGradient id="lf-btn1" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%"   stopColor="#9D60FA"/>
          <stop offset="100%" stopColor="#6D28D9"/>
        </linearGradient>
        <linearGradient id="lf-btn2" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%"   stopColor="#22D3EE"/>
          <stop offset="100%" stopColor="#0891B2"/>
        </linearGradient>
        <radialGradient id="lf-ambient" cx="50%" cy="48%" r="50%">
          <stop offset="0%"   stopColor="#7C3AED" stopOpacity="0.22"/>
          <stop offset="100%" stopColor="#7C3AED" stopOpacity="0"/>
        </radialGradient>
        <radialGradient id="lf-portal" cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor="#FFFFFF" stopOpacity="0.55"/>
          <stop offset="60%"  stopColor="#7C3AED" stopOpacity="0.15"/>
          <stop offset="100%" stopColor="#7C3AED" stopOpacity="0"/>
        </radialGradient>
        <filter id="lf-glow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="4" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id="lf-glow-sm" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="2.5" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id="lf-glow-lg" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="12" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id="lf-text-glow" x="-8%" y="-30%" width="116%" height="160%">
          <feGaussianBlur stdDeviation="5" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>

      {/* Ambient glow */}
      <ellipse cx="200" cy="200" rx="180" ry="210" fill="url(#lf-ambient)"/>
      <ellipse cx="200" cy="390" rx="130" ry="45" fill="#7C3AED" opacity="0.07" filter="url(#lf-glow-lg)"/>

      {/* Cabinet shadow */}
      <path d="M138 18 L262 18 L304 54 L304 290 L96 290 L96 54 Z"
            fill="#7C3AED" opacity="0.12" filter="url(#lf-glow-lg)"/>

      {/* Cabinet body */}
      <path d="M140 20 L260 20 L300 56 L300 288 L100 288 L100 56 Z"
            fill="url(#lf-cabinet)" stroke="url(#lf-border)" strokeWidth="2.5"/>
      <path d="M142 23 L258 23 L296 57 L296 100"
            fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="1.5" strokeLinecap="round"/>

      {/* Marquee */}
      <path d="M140 20 L260 20 L300 56 L300 84 L100 84 L100 56 Z"
            fill="url(#lf-marquee)"/>
      <line x1="100" y1="84" x2="300" y2="84"
            stroke="url(#lf-border)" strokeWidth="2" filter="url(#lf-glow-sm)"/>
      <line x1="140" y1="21" x2="260" y2="21"
            stroke="url(#lf-border)" strokeWidth="1.5" opacity="0.8"/>
      <text x="116" y="60" fontSize="11" fill="#9D60FA" opacity="0.75" filter="url(#lf-glow-sm)">✦</text>
      <text x="268" y="58" fontSize="9"  fill="#06B6D4" opacity="0.75" filter="url(#lf-glow-sm)">✦</text>
      <text x="200" y="62"
            textAnchor="middle"
            fontFamily="var(--font-press-start), 'Press Start 2P', 'Courier New', monospace"
            fontSize="15" fill="white"
            letterSpacing="2"
            filter="url(#lf-text-glow)">ARCANE.UZ</text>

      {/* Screen bezel */}
      <rect x="110" y="94" width="180" height="138" rx="5"
            fill="#08051A" stroke="url(#lf-border-v)" strokeWidth="2"/>
      <rect x="116" y="100" width="168" height="126" rx="3"
            fill="url(#lf-screen)"/>

      {/* Portal arch */}
      <rect x="148" y="128" width="10" height="62" fill="#5B21B6" rx="1"/>
      <rect x="138" y="136" width="10" height="54" fill="#4C1D95" rx="1"/>
      <rect x="242" y="128" width="10" height="62" fill="#5B21B6" rx="1"/>
      <rect x="252" y="136" width="10" height="54" fill="#4C1D95" rx="1"/>
      <rect x="158" y="116" width="84" height="10" fill="#7C3AED" rx="1"/>
      <rect x="148" y="124" width="10" height="10" fill="#7C3AED" rx="1"/>
      <rect x="242" y="124" width="10" height="10" fill="#7C3AED" rx="1"/>
      <rect x="138" y="128" width="10" height="8"  fill="#6D28D9" rx="1"/>
      <rect x="252" y="128" width="10" height="8"  fill="#6D28D9" rx="1"/>
      <rect x="138" y="188" width="124" height="6" fill="#4C1D95" opacity="0.85" rx="1"/>
      <rect x="142" y="194" width="116" height="5" fill="#3B1480" opacity="0.75" rx="1"/>
      <rect x="146" y="199" width="108" height="4" fill="#2D0E65" opacity="0.65" rx="1"/>
      <ellipse cx="200" cy="158" rx="28" ry="34" fill="url(#lf-portal)"/>
      <ellipse cx="200" cy="156" rx="6"  ry="7"  fill="white" opacity="0.7" filter="url(#lf-glow)"/>
      <line x1="200" y1="148" x2="200" y2="164" stroke="white" strokeWidth="1.8" opacity="0.9" filter="url(#lf-glow-sm)"/>
      <line x1="192" y1="156" x2="208" y2="156" stroke="white" strokeWidth="1.8" opacity="0.9" filter="url(#lf-glow-sm)"/>
      <text x="122" y="114" fontSize="9" fill="white"  opacity="0.35">✦</text>
      <text x="266" y="112" fontSize="8" fill="#06B6D4" opacity="0.40">✦</text>
      <text x="260" y="200" fontSize="7" fill="#9D60FA" opacity="0.35">✦</text>

      {/* Control panel */}
      <path d="M100 244 L300 244 L305 288 L95 288 Z"
            fill="#0C0A1E" stroke="url(#lf-border)" strokeWidth="1.5"/>
      <line x1="100" y1="244" x2="300" y2="244"
            stroke="url(#lf-border)" strokeWidth="1.5" opacity="0.6" filter="url(#lf-glow-sm)"/>

      {/* Joystick */}
      <circle cx="148" cy="270" r="20" fill="#12102A" stroke="#7C3AED" strokeWidth="1.5" opacity="0.9"/>
      <circle cx="148" cy="270" r="15" fill="#0E0C22" stroke="#5B21B6" strokeWidth="1"/>
      <line x1="148" y1="270" x2="145" y2="254" stroke="#8B5CF6" strokeWidth="4" strokeLinecap="round"/>
      <circle cx="144" cy="252" r="8" fill="#7C3AED" filter="url(#lf-glow)"/>
      <circle cx="142" cy="250" r="5" fill="#A78BFA"/>
      <circle cx="141" cy="249" r="2" fill="white" opacity="0.5"/>

      {/* Button purple */}
      <circle cx="218" cy="270" r="16" fill="#140830" stroke="#7C3AED" strokeWidth="1.5"/>
      <circle cx="218" cy="268" r="12" fill="url(#lf-btn1)" filter="url(#lf-glow-sm)"/>
      <circle cx="215" cy="265" r="5"  fill="white" opacity="0.2"/>

      {/* Button cyan */}
      <circle cx="256" cy="270" r="16" fill="#00101E" stroke="#06B6D4" strokeWidth="1.5"/>
      <circle cx="256" cy="268" r="12" fill="url(#lf-btn2)" filter="url(#lf-glow-sm)"/>
      <circle cx="253" cy="265" r="5"  fill="white" opacity="0.2"/>

      {/* Text platform */}
      <path d="M42 308 L358 308 L366 322 L366 358 L358 370 L42 370 L34 358 L34 322 Z"
            fill="#07070E" stroke="url(#lf-border)" strokeWidth="2.5"/>
      <path d="M44 310 L356 310 L364 323"
            fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1.2"/>
      <text x="200" y="349"
            textAnchor="middle"
            fontFamily="var(--font-press-start), 'Press Start 2P', 'Courier New', monospace"
            fontSize="27" fill="url(#lf-text)"
            letterSpacing="1.5"
            filter="url(#lf-text-glow)">ARCANE.UZ</text>

      {/* Diamond ornament */}
      <line x1="55"  y1="393" x2="172" y2="393" stroke="url(#lf-border)" strokeWidth="1.2" opacity="0.55"/>
      <line x1="228" y1="393" x2="345" y2="393" stroke="url(#lf-border)" strokeWidth="1.2" opacity="0.55"/>
      <circle cx="68"  cy="393" r="2.5" fill="#7C3AED" opacity="0.8" filter="url(#lf-glow-sm)"/>
      <circle cx="106" cy="393" r="1.5" fill="#7C3AED" opacity="0.5"/>
      <circle cx="144" cy="393" r="1.5" fill="#9D60FA" opacity="0.4"/>
      <circle cx="332" cy="393" r="2.5" fill="#06B6D4" opacity="0.8" filter="url(#lf-glow-sm)"/>
      <circle cx="294" cy="393" r="1.5" fill="#06B6D4" opacity="0.5"/>
      <circle cx="256" cy="393" r="1.5" fill="#22D3EE" opacity="0.4"/>
      <polygon points="200,376 216,393 200,410 184,393"
               fill="url(#lf-diamond)" filter="url(#lf-glow-lg)"/>
      <polygon points="200,380 212,393 200,406 188,393"
               fill="url(#lf-diamond)" opacity="0.6"/>
      <line x1="200" y1="380" x2="200" y2="406" stroke="white" strokeWidth="0.7" opacity="0.4"/>
      <line x1="188" y1="393" x2="212" y2="393" stroke="white" strokeWidth="0.7" opacity="0.4"/>
      <polygon points="200,380 212,393 200,393" fill="white" opacity="0.12"/>
      <circle cx="200" cy="393" r="4" fill="white" opacity="0.5" filter="url(#lf-glow)"/>
    </svg>
  );
}
