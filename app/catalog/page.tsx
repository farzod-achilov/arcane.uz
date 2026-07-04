import { getGames, getDistinctGenres } from '@/lib/db/games';
import CatalogContent from './CatalogContent';
import QuestTrigger   from '@/components/ui/QuestTrigger';
import { getServerDict } from '@/lib/locale/server';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Каталог игр | Arcane',
  description: 'Огромный выбор игровых ключей для PC, Mac и Linux. Фильтры по жанру, платформе, цене.',
};

interface Props {
  searchParams: {
    q?:        string;
    genre?:    string;
    platform?: string;
    sort?:     string;
    view?:     string;
    page?:     string;
    priceMin?: string;
    priceMax?: string;
  };
}

export default async function CatalogPage({ searchParams }: Props) {
  const c             = getServerDict().catalog;
  const sp            = searchParams;
  const page          = Math.max(1, parseInt(sp.page ?? '1', 10) || 1);
  const selectedGenres = sp.genre ? sp.genre.split(',').filter(Boolean) : [];
  const priceMin = sp.priceMin ? parseInt(sp.priceMin, 10) : undefined;
  const priceMax = sp.priceMax ? parseInt(sp.priceMax, 10) : undefined;

  const [{ games, total, pages }, genres] = await Promise.all([
    getGames({
      q:        sp.q,
      genres:   selectedGenres.length ? selectedGenres : undefined,
      platform: sp.platform,
      sort:     sp.sort ?? 'newest',
      page,
      priceMin,
      priceMax,
    }),
    getDistinctGenres(),
  ]);

  return (
    <div className="min-h-screen" style={{ background: 'transparent', paddingTop: '96px' }}>
      <QuestTrigger questId="catalog" />
      {/* Grid background */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(rgba(124,58,237,1) 1px, transparent 1px), linear-gradient(90deg, rgba(124,58,237,1) 1px, transparent 1px)',
          backgroundSize: '52px 52px',
          opacity: 0.013,
        }}
      />

      {/* Page header */}
      <div
        style={{
          background: 'linear-gradient(180deg, #0D0A1A 0%, #0A0A0F 100%)',
          borderBottom: '1px solid rgba(124,58,237,0.12)',
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <p
            className="font-pixel mb-2"
            style={{ fontSize: '9px', color: '#7C3AED', letterSpacing: '0.15em' }}
          >
            ◆ {c.eyebrow}
          </p>
          <h1 className="font-heading font-bold text-3xl sm:text-4xl text-white">
            {c.title}
            <span className="ml-3 font-heading text-lg font-normal" style={{ color: '#374151' }}>
              ({total})
            </span>
          </h1>

          {(sp.q || selectedGenres.length > 0 || sp.platform) && (
            <p className="font-body text-sm mt-2" style={{ color: '#6B7280' }}>
              {sp.q && <>{c.searchLabel}: <span className="text-[#9D60FA]">«{sp.q}»</span></>}
              {selectedGenres.length > 0 && (
                <> · {c.genresLabel}: <span className="text-[#9D60FA]">{selectedGenres.join(', ')}</span></>
              )}
              {sp.platform && <> · {c.platformLabel}: <span className="text-[#9D60FA]">{sp.platform}</span></>}
            </p>
          )}
        </div>
      </div>

      <CatalogContent
        games={games}
        total={total}
        pages={pages}
        page={page}
        genres={genres}
        currentGenres={selectedGenres}
        currentPlatform={sp.platform ?? ''}
        currentSort={sp.sort ?? 'newest'}
        currentView={sp.view ?? 'grid'}
        currentQ={sp.q ?? ''}
        currentPriceMin={priceMin}
        currentPriceMax={priceMax}
      />
    </div>
  );
}
