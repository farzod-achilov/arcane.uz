// ─── ARCANE.UZ Brand System ────────────────────────────────────────────────

export const colors = {
  // ── Purple scale
  purple: {
    950: '#1E0A47',
    900: '#3B0764',
    800: '#4C1D95',
    700: '#5B21B6',
    DEFAULT: '#7C3AED',   // Primary brand purple
    light:   '#9D60FA',   // Hover / active states
    300:     '#C4B5FD',
    200:     '#DDD6FE',
    subtle:  'rgba(124, 58, 237, 0.10)',  // Background tint
    glow:    'rgba(124, 58, 237, 0.40)',  // Box-shadow alpha
  },

  // ── Cyan scale
  cyan: {
    900: '#164E63',
    800: '#155E75',
    700: '#0E7490',
    600: '#0891B2',
    DEFAULT: '#06B6D4',   // Primary brand cyan
    light:   '#22D3EE',   // Hover / active states
    300:     '#67E8F9',
    200:     '#A5F3FC',
    subtle:  'rgba(6, 182, 212, 0.10)',   // Background tint
    glow:    'rgba(6, 182, 212, 0.40)',   // Box-shadow alpha
  },

  // ── Dark surface scale (background → card → elevated)
  surface: {
    void:     '#070709',  // Deepest, for gradients behind hero
    base:     '#0A0A0F',  // Page background
    card:     '#12121A',  // Card / panel background
    elevated: '#1A1A28',  // Dropdowns, tooltips
    border:   '#1E1E2E',  // Dividers, card borders
    subtle:   '#2D2D44',  // Input backgrounds, hover states
  },

  // ── Text
  text: {
    primary:   '#FFFFFF',
    secondary: '#E2E8F0',
    muted:     '#9CA3AF',
    faded:     '#6B7280',
    disabled:  '#4B5563',
  },

  // ── Semantic status
  status: {
    success: '#10B981',
    error:   '#EF4444',
    warning: '#F59E0B',
    info:    '#06B6D4',
  },
} as const;

// ─── Gradients ────────────────────────────────────────────────────────────────

export const gradients = {
  primary:       'linear-gradient(135deg, #7C3AED 0%, #06B6D4 100%)',
  primaryHover:  'linear-gradient(135deg, #9D60FA 0%, #22D3EE 100%)',
  primaryHoriz:  'linear-gradient(90deg,  #7C3AED 0%, #06B6D4 100%)',
  dark:          'linear-gradient(180deg, #0A0A0F 0%, #12121A 100%)',
  cardGlow:      'radial-gradient(ellipse at top, rgba(124,58,237,0.15) 0%, transparent 70%)',
  heroBg:        'radial-gradient(ellipse at 30% 40%, rgba(124,58,237,0.15) 0%, transparent 60%)',
  grid:          'linear-gradient(rgba(124,58,237,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(124,58,237,0.03) 1px, transparent 1px)',
} as const;

// ─── Typography ───────────────────────────────────────────────────────────────

export const fonts = {
  heading: '"Space Grotesk", system-ui, sans-serif',  // Titles, prices, badges
  body:    '"Inter", system-ui, sans-serif',           // Body copy, UI labels
} as const;

// Font weight tokens
export const fontWeights = {
  regular:   400,
  medium:    500,
  semibold:  600,
  bold:      700,
  extrabold: 800,
} as const;

// ─── Shadows / Glows ──────────────────────────────────────────────────────────

export const shadows = {
  glowPurple:       '0 0 20px rgba(124, 58, 237, 0.40)',
  glowPurpleStrong: '0 0 40px rgba(124, 58, 237, 0.60)',
  glowPurpleSm:     '0 0 10px rgba(124, 58, 237, 0.30)',
  glowCyan:         '0 0 20px rgba(6, 182, 212, 0.40)',
  glowCyanSm:       '0 0 10px rgba(6, 182, 212, 0.30)',
  card:             '0 4px 24px rgba(0, 0, 0, 0.40)',
  cardHover:        '0 8px 40px rgba(124, 58, 237, 0.20)',
  cardFloat:        '0 16px 60px rgba(124, 58, 237, 0.30)',
} as const;

// ─── Border radii ─────────────────────────────────────────────────────────────

export const radii = {
  sm:   '8px',   // Chips, small badges
  md:   '12px',  // Inputs, small buttons
  lg:   '16px',  // Buttons, tags
  xl:   '20px',  // Cards
  '2xl':'24px',  // Large cards
  '3xl':'32px',  // Feature sections
  full: '9999px',
} as const;

// ─── Logo mark SVG path data ──────────────────────────────────────────────────
// Viewbox 0 0 100 100.  Ghost-P: stem x=16–32, bowl x=32–76, center-y=32.
// Counter (bowl hole) x=32–62, y=22–42. Ghost arch at stem bottom.

export const logoPath =
  'M 50 8 L 57 8 L 92 90 L 75 90 L 66 68 L 34 68 L 25 90 L 8 90 L 43 8 Z ' +
  'M 50 22 L 62 54 L 38 54 Z ' +
  'M 50 33 L 55 40 L 50 47 L 45 40 Z';
