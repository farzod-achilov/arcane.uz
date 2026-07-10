import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      // Extra small breakpoint for phones — Tailwind's default range starts at
      // sm:640px, which leaves a big gap for 360–640px handset layouts.
      screens: {
        xs: '480px',
      },
      colors: {
        bg: {
          void:     '#000005',
          base:     '#0A0A0F',
          card:     '#12121A',
          elevated: '#1A1A28',
          border:   '#1E1E2E',
          subtle:   '#2D2D44',
        },
        accent: {
          'purple-950':   '#1E0A47',
          'purple-900':   '#3B0764',
          'purple-800':   '#4C1D95',
          'purple-700':   '#5B21B6',
          purple:         '#7C3AED',
          'purple-light': '#9D60FA',
          'purple-300':   '#C4B5FD',
          'cyan-dark':    '#0891B2',
          cyan:           '#06B6D4',
          'cyan-light':   '#22D3EE',
          'cyan-300':     '#67E8F9',
        },
        arcade: {
          amber:        '#F59E0B',
          'amber-bright':'#FCD34D',
          green:        '#22C55E',
          'green-glow': '#4ADE80',
          red:          '#EF4444',
          'red-glow':   '#F87171',
          pink:         '#EC4899',
        },
        text: {
          primary:  '#FFFFFF',
          secondary:'#E2E8F0',
          muted:    '#9CA3AF',
          faded:    '#6B7280',
        },
        status: {
          success: '#10B981',
          error:   '#EF4444',
          warning: '#F59E0B',
        },
      },

      fontFamily: {
        heading: ['Space Grotesk', 'system-ui', 'sans-serif'],
        body:    ['Inter', 'system-ui', 'sans-serif'],
        pixel:   ['"Press Start 2P"', 'var(--font-press-start)', 'Courier New', 'monospace'],
      },

      backgroundImage: {
        'gradient-radial':        'radial-gradient(var(--tw-gradient-stops))',
        'gradient-purple-cyan':   'linear-gradient(135deg, #7C3AED, #06B6D4)',
        'gradient-purple-cyan-h': 'linear-gradient(90deg,  #7C3AED, #06B6D4)',
        'gradient-dark':          'linear-gradient(180deg, #0A0A0F 0%, #12121A 100%)',
        'card-glow':              'radial-gradient(ellipse at top, rgba(124,58,237,0.15) 0%, transparent 70%)',
        'grid-lines':             'linear-gradient(rgba(124,58,237,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(124,58,237,0.04) 1px, transparent 1px)',
        'scanline':               'repeating-linear-gradient(to bottom, transparent 0px, transparent 3px, rgba(0,0,0,0.10) 3px, rgba(0,0,0,0.10) 4px)',
        'arcade-gradient':        'linear-gradient(180deg, #1a0040 0%, #0A0A0F 40%)',
      },

      boxShadow: {
        'glow-purple':    '0 0 20px rgba(124,58,237,0.40)',
        'glow-purple-lg': '0 0 40px rgba(124,58,237,0.60)',
        'glow-purple-sm': '0 0 10px rgba(124,58,237,0.30)',
        'glow-cyan':      '0 0 20px rgba(6,182,212,0.40)',
        'glow-amber':     '0 0 20px rgba(245,158,11,0.50)',
        'neon-purple':    '0 0 5px #7C3AED, 0 0 20px #7C3AED, 0 0 40px rgba(124,58,237,0.5)',
        'neon-cyan':      '0 0 5px #06B6D4, 0 0 20px #06B6D4, 0 0 40px rgba(6,182,212,0.5)',
        'card':           '0 4px 24px rgba(0,0,0,0.40)',
        'card-hover':     '0 8px 40px rgba(124,58,237,0.20)',
        'arcade-btn':     '0 6px 0 rgba(0,0,0,0.5), 0 0 20px rgba(124,58,237,0.3)',
      },

      borderRadius: {
        '4xl': '2rem',
      },

      animation: {
        'pulse-slow':    'pulse 3s cubic-bezier(0.4,0,0.6,1) infinite',
        'float':         'float 6s ease-in-out infinite',
        'spin-slow':     'spin 20s linear infinite',
        'blink':         'arcadeBlink 1s step-end infinite',
        'flicker':       'flicker 6s infinite',
        'marquee':       'marqueeScroll 20s linear infinite',
        'pixel-pulse':   'pixelPulse 2s ease-in-out infinite',
        'glow':          'glow 2s ease-in-out infinite alternate',
      },

      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':      { transform: 'translateY(-10px)' },
        },
        glow: {
          '0%':   { boxShadow: '0 0 5px rgba(124,58,237,0.30)' },
          '100%': { boxShadow: '0 0 25px rgba(124,58,237,0.70)' },
        },
        arcadeBlink: {
          '0%, 49%':  { opacity: '1' },
          '50%, 100%':{ opacity: '0' },
        },
        flicker: {
          '0%, 97%, 100%': { opacity: '1' },
          '98%':            { opacity: '0.85' },
          '99%':            { opacity: '1' },
        },
        marqueeScroll: {
          from: { transform: 'translateX(0)' },
          to:   { transform: 'translateX(-50%)' },
        },
        pixelPulse: {
          '0%, 100%': { boxShadow: '0 0 6px #7C3AED, 0 0 12px #7C3AED' },
          '50%':       { boxShadow: '0 0 18px #7C3AED, 0 0 40px #7C3AED' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
