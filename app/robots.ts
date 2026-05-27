import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/api', '/checkout', '/library', '/profile'],
      },
    ],
    sitemap: 'https://arcane.com.uz/sitemap.xml',
  };
}
