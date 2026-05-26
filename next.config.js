/** @type {import('next').NextConfig} */
const nextConfig = {
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
    ],
  },
};

module.exports = nextConfig;
