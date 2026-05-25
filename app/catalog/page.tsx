import { getGames, getDistinctGenres } from '@/lib/db/games';
import CatalogContent from './CatalogContent';
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
  };
}

export default async function CatalogPage({ searchParams }: Props) {
  const sp   = searchParams;
  const page = Math.max(1, parseInt(sp.page ?? '1', 10) || 1);

  const [{ games, total, pages }, genres] = await Promise.all([
    getGames({
      q:        sp.q,
      genre:    sp.genre,
      platform: sp.platform,
      sort:     sp.sort ?? 'newest',
      page,
    }),
    getDistinctGenres(),
  ]);

  return (
    <div className="min-h-screen" style={{ background: '#0A0A0F', paddingTop: '96px' }}>
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
            ◆ КАТАЛОГ
          </p>
          <h1 className="font-heading font-bold text-3xl sm:text-4xl text-white">
            Все игры
            <span className="ml-3 font-heading text-lg font-normal" style={{ color: '#374151' }}>
              ({total})
            </span>
          </h1>

          {(sp.q || sp.genre || sp.platform) && (
            <p className="font-body text-sm mt-2" style={{ color: '#6B7280' }}>
              {sp.q     && <>Поиск: <span className="text-[#9D60FA]">«{sp.q}»</span></>}
              {sp.genre && <> · Жанр: <span className="text-[#9D60FA]">{sp.genre}</span></>}
              {sp.platform && <> · Платформа: <span className="text-[#9D60FA]">{sp.platform}</span></>}
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
        currentGenre={sp.genre ?? ''}
        currentPlatform={sp.platform ?? ''}
        currentSort={sp.sort ?? 'newest'}
        currentView={sp.view ?? 'grid'}
        currentQ={sp.q ?? ''}
      />
    </div>
  );
}
