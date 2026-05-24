import slugify from 'slugify';
import type { IgdbGame } from '../../services/igdb/igdb.types';
import type { RawgGame } from '../../services/rawg/rawg.types';
import type { SteamGameData } from '../../services/steam/steam.types';

// ── Canonical game shape ───────────────────────────────────────────────────────

export interface NormalizedGame {
  externalId: string;
  source: 'igdb' | 'rawg' | 'steam';
  title: string;
  slug: string;
  cover?: string;
  screenshots: string[];
  description?: string;
  genres: string[];
  platforms: string[];
  rating?: number;
  priceUsd?: number;
  releaseDate?: Date;
  developer?: string;
  publisher?: string;
  _steamAppId?: number; // used for RAWG trailer enrichment
}

// ── USD → UZS ─────────────────────────────────────────────────────────────────

const USD_TO_UZS = parseInt(process.env.USD_TO_UZS || '12700', 10);

export function usdToUzs(usd: number): number {
  return Math.round((usd * USD_TO_UZS) / 1000) * 1000;
}

// ── Slug helper ───────────────────────────────────────────────────────────────

export function makeSlug(title: string, suffix: string): string {
  const base = slugify(title, { lower: true, strict: true });
  return `${base}-${suffix}`;
}

// ── IGDB normalizer ───────────────────────────────────────────────────────────

function igdbCoverUrl(url?: string): string | undefined {
  return url?.replace('//', 'https://').replace('t_thumb', 't_cover_big');
}

function igdbScreenshotUrl(url?: string): string | undefined {
  return url?.replace('//', 'https://').replace('t_thumb', 't_screenshot_huge');
}

export function normalizeIgdbGame(game: IgdbGame): NormalizedGame | null {
  if (!game?.name) return null;

  const developer = game.involved_companies?.find((c) => c.developer)?.company.name;
  const publisher = game.involved_companies?.find((c) => c.publisher)?.company.name;

  return {
    externalId: String(game.id),
    source: 'igdb',
    title: game.name,
    slug: makeSlug(game.name, `igdb-${game.id}`),
    cover: igdbCoverUrl(game.cover?.url),
    screenshots: [
      ...(game.videos?.[0]?.video_id ? [`youtube:${game.videos[0].video_id}`] : []),
      ...(game.screenshots ?? []).map((s) => igdbScreenshotUrl(s.url)!).filter(Boolean),
    ],
    description: game.summary,
    genres: (game.genres ?? []).map((g) => g.name),
    platforms: (game.platforms ?? []).map((p) => p.name),
    rating: game.rating ?? game.aggregated_rating,
    priceUsd: undefined, // IGDB does not provide prices
    releaseDate: game.first_release_date
      ? new Date(game.first_release_date * 1000)
      : undefined,
    developer,
    publisher,
  };
}

// ── RAWG normalizer ───────────────────────────────────────────────────────────

export function normalizeRawgGame(game: RawgGame): NormalizedGame | null {
  if (!game?.name) return null;

  const rating =
    game.metacritic ??
    (game.rating ? Math.round(game.rating * 20) : undefined);

  const steamUrl = game.stores?.find((s) => s.store.slug === 'steam')?.url;
  const steamAppId = steamUrl ? parseInt(steamUrl.match(/\/app\/(\d+)/)?.[1] ?? '', 10) || undefined : undefined;

  return {
    externalId: String(game.id),
    source: 'rawg',
    title: game.name,
    slug: makeSlug(game.name, `rawg-${game.id}`),
    cover: game.background_image ?? undefined,
    screenshots: (game.short_screenshots ?? []).map((s) => s.image),
    description: game.description_raw,
    genres: (game.genres ?? []).map((g) => g.name),
    platforms: (game.platforms ?? []).map((p) => p.platform.name),
    rating,
    priceUsd: undefined,
    releaseDate: game.released ? new Date(game.released) : undefined,
    developer: game.developers?.[0]?.name,
    publisher: game.publishers?.[0]?.name,
    _steamAppId: steamAppId,
  };
}

// ── Steam normalizer ──────────────────────────────────────────────────────────

export function normalizeSteamGame(data: SteamGameData): NormalizedGame | null {
  if (!data?.name || data.type !== 'game') return null;

  const priceUsd = data.is_free
    ? 0
    : data.price_overview
      ? data.price_overview.final / 100
      : undefined;

  const rating = data.metacritic?.score;

  const platforms: string[] = [];
  if (data.platforms?.windows) platforms.push('PC');
  if (data.platforms?.mac) platforms.push('Mac');
  if (data.platforms?.linux) platforms.push('Linux');

  const releaseDate = data.release_date?.date
    ? new Date(data.release_date.date)
    : undefined;

  return {
    externalId: String(data.steam_appid),
    source: 'steam',
    title: data.name,
    slug: makeSlug(data.name, `steam-${data.steam_appid}`),
    cover: data.header_image,
    screenshots: [
      ...(data.movies?.[0]?.mp4?.max ? [`video:${data.movies[0].mp4.max}`] : []),
      ...(data.screenshots ?? []).map((s) => s.path_full),
    ],
    description: data.short_description,
    genres: (data.genres ?? []).map((g) => g.description),
    platforms,
    rating,
    priceUsd,
    releaseDate: releaseDate && !isNaN(releaseDate.getTime()) ? releaseDate : undefined,
    developer: data.developers?.[0],
    publisher: data.publishers?.[0],
  };
}
