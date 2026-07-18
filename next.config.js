/** @type {import('next').NextConfig} */
const nextConfig = {
  // Don't advertise the framework (removes "X-Powered-By: Next.js")
  poweredByHeader: false,

  // deploy.sh builds into a staging dir while the old app keeps serving,
  // then swaps it in. Unset (default '.next') at runtime and in dev.
  distDir: process.env.NEXT_DIST_DIR || '.next',

  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'picsum.photos' },
      { protocol: 'https', hostname: 'via.placeholder.com' },
      { protocol: 'https', hostname: 'placehold.co' },
      { protocol: 'https', hostname: 'cdn.akamai.steamstatic.com' },
      { protocol: 'https', hostname: 'steamcdn-a.akamaihd.net' },
      { protocol: 'https', hostname: 'shared.akamai.steamstatic.com' },
      { protocol: 'https', hostname: 'video.akamai.steamstatic.com' },
      { protocol: 'https', hostname: 'video.cloudflare.steamstatic.com' },
      { protocol: 'https', hostname: 'cdn.cloudflare.steamstatic.com' },
      { protocol: 'https', hostname: 'store.akamai.steamstatic.com' },
      { protocol: 'https', hostname: '*.steamstatic.com' },
      { protocol: 'https', hostname: '*.steampowered.com' },
      { protocol: 'https', hostname: 'media.rawg.io' },
      { protocol: 'https', hostname: 'images.igdb.com' },
      { protocol: 'https', hostname: 'static.kinguin.net' },
    ],
  },

  async headers() {
    // Content-Security-Policy — pragmatic policy for a Next.js app that uses
    // inline styles (Framer Motion), YouTube trailer embeds and Steam media CDNs.
    // 'unsafe-inline'/'unsafe-eval' on script-src are required for Next.js
    // hydration without a nonce-based setup. External API calls (RAWG, IGDB,
    // Steam, Digiseller, Telegram) all run server-side EXCEPT trailer playback:
    // hls.js fetches the .m3u8 manifest and .ts segments itself via fetch/XHR
    // (feeding MediaSource Extensions), which is gated by connect-src, not
    // media-src — a connect-src of just 'self' silently breaks every Steam
    // HLS trailer with no visible error beyond a CSP console warning.
    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://challenges.cloudflare.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "img-src 'self' data: blob: https://*.steamstatic.com https://*.akamaihd.net https://*.steampowered.com https://steamcommunity.com https://media.rawg.io https://images.igdb.com https://picsum.photos https://fastly.picsum.photos https://via.placeholder.com https://placehold.co https://static.kinguin.net",
      "media-src 'self' blob: https://*.steamstatic.com https://*.akamaihd.net",
      "font-src 'self' data: https://fonts.gstatic.com",
      "connect-src 'self' https://*.steamstatic.com https://*.akamaihd.net https://challenges.cloudflare.com",
      "frame-src 'self' https://www.youtube.com https://www.youtube-nocookie.com https://challenges.cloudflare.com",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      "upgrade-insecure-requests",
    ].join('; ');

    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'Content-Security-Policy',  value: csp },
          { key: 'X-Frame-Options',        value: 'DENY' },
          { key: 'X-Content-Type-Options',  value: 'nosniff' },
          { key: 'Referrer-Policy',         value: 'strict-origin-when-cross-origin' },
          // 0 (not 1) is the modern recommendation when a strong CSP is present —
          // the legacy XSS auditor can itself introduce vulnerabilities.
          { key: 'X-XSS-Protection',        value: '0' },
          {
            key:   'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
          {
            key:   'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
