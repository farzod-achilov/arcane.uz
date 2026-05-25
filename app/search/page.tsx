import { getGames } from '@/lib/db/games';
import Link from 'next/link';
import { Search } from 'lucide-react';
import GameCard from '@/components/catalog/GameCard';
import GameListCard from '@/components/catalog/GameListCard';
import CatalogPagination from '@/components/catalog/CatalogPagination';
import type { Metadata } from 'next';

interface Props {
  searchParams: { q?: string; sort?: string; view?: string; page?: string };
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const q = searchParams.q?.trim() ?? '';
  return {
    title: q ? `«${q}» — поиск игр | Arcane` : 'Поиск игр | Arcane',
    description: q
      ? `Результаты поиска «${q}» в каталоге Arcane — игровые ключи по лучшим ценам`
      : 'Поиск по каталогу игр Arcane',
  };
}

export default async function SearchPage({ searchParams }: Props) {
  const q    = searchParams.q?.trim() ?? '';
  const page = Math.max(1, parseInt(searchParams.page ?? '1', 10) || 1);
  const view = searchParams.view ?? 'grid';

  const { games, total, pages } = q
    ? await getGames({ q, sort: searchParams.sort ?? 'newest', page })
    : { games: [], total: 0, pages: 0 };

  return (
    <div className="min-h-screen" style={{ background: '#0A0A0F', paddingTop: '96px' }}>
      {/* Header */}
      <div
        style={{
          background: 'linear-gradient(180deg, #0D0A1A 0%, #0A0A0F 100%)',
          borderBottom: '1px solid rgba(124,58,237,0.12)',
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <p className="font-pixel mb-2" style={{ fontSize: '9px', color: '#7C3AED', letterSpacing: '0.15em' }}>
            ◆ ПОИСК
          </p>
          {q ? (
            <>
              <h1 className="font-heading font-bold text-3xl sm:text-4xl text-white">
                «{q}»
                <span className="ml-3 font-heading text-lg font-normal" style={{ color: '#374151' }}>
                  ({total})
                </span>
              </h1>
              <p className="font-body text-sm mt-2" style={{ color: '#4B5563' }}>
                {total === 0
                  ? 'Ничего не найдено'
                  : `Найдено ${total} ${total === 1 ? 'игра' : total < 5 ? 'игры' : 'игр'}`}
              </p>
            </>
          ) : (
            <h1 className="font-heading font-bold text-3xl sm:text-4xl text-white">Поиск игр</h1>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Empty / no-query states */}
        {!q && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div
              className="p-5 rounded-2xl mb-5"
              style={{ background: '#12121A', border: '1px solid rgba(255,255,255,0.06)' }}
            >
              <Search className="w-10 h-10" style={{ color: '#4B5563' }} />
            </div>
            <h2 className="font-heading font-bold text-xl text-white mb-2">Введите поисковый запрос</h2>
            <p className="font-body text-sm mb-6" style={{ color: '#4B5563' }}>
              Воспользуйтесь строкой поиска в шапке или перейдите в каталог
            </p>
            <Link
              href="/catalog"
              className="font-heading font-semibold text-sm px-5 py-2.5 rounded-xl text-white"
              style={{
                background: 'linear-gradient(135deg, rgba(124,58,237,0.8), rgba(76,29,149,0.9))',
                border: '1px solid rgba(124,58,237,0.4)',
              }}
            >
              Каталог игр
            </Link>
          </div>
        )}

        {q && games.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div
              className="text-5xl mb-5 p-4 rounded-2xl"
              style={{ background: '#12121A', border: '1px solid rgba(255,255,255,0.06)' }}
            >
              🎮
            </div>
            <h2 className="font-heading font-bold text-xl text-white mb-2">Ничего не найдено</h2>
            <p className="font-body text-sm mb-6" style={{ color: '#4B5563' }}>
              По запросу «{q}» игры не найдены. Попробуйте другой запрос.
            </p>
            <Link
              href="/catalog"
              className="font-heading font-semibold text-sm px-5 py-2.5 rounded-xl text-white"
              style={{
                background: 'linear-gradient(135deg, rgba(124,58,237,0.8), rgba(76,29,149,0.9))',
                border: '1px solid rgba(124,58,237,0.4)',
              }}
            >
              Весь каталог
            </Link>
          </div>
        )}

        {q && games.length > 0 && (
          <>
            {view === 'list' ? (
              <div className="flex flex-col gap-3">
                {games.map((g) => <GameListCard key={g.id} game={g} />)}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {games.map((g, i) => <GameCard key={g.id} game={g} index={i} />)}
              </div>
            )}
            <CatalogPagination page={page} pages={pages} total={total} />
          </>
        )}
      </div>
    </div>
  );
}
