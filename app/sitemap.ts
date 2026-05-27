import type { MetadataRoute } from 'next';
import { prisma } from '@/lib/prisma';

const BASE = 'https://arcane.com.uz';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: BASE,             lastModified: new Date(), changeFrequency: 'daily',   priority: 1.0 },
    { url: `${BASE}/catalog`, lastModified: new Date(), changeFrequency: 'daily',   priority: 0.9 },
    { url: `${BASE}/cases`,   lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.7 },
    { url: `${BASE}/support`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE}/faq`,     lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
  ];

  try {
    const games = await prisma.games.findMany({
      where:  { isActive: true },
      select: { slug: true, updatedAt: true },
      take:   5000,
    });

    const gameRoutes: MetadataRoute.Sitemap = games.map(g => ({
      url:             `${BASE}/product/${g.slug}`,
      lastModified:    g.updatedAt,
      changeFrequency: 'weekly' as const,
      priority:        0.8,
    }));

    return [...staticRoutes, ...gameRoutes];
  } catch {
    return staticRoutes;
  }
}
