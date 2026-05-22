import { igdbClient } from './igdb.client';
import type { IgdbGame } from './igdb.types';
import type { NormalizedGame } from '../../modules/games/games.normalizer';
import { normalizeIgdbGame } from '../../modules/games/games.normalizer';

class IgdbService {
  async getTopRatedGames(limit = 100): Promise<NormalizedGame[]> {
    const games = await igdbClient.fetchTopRated(limit);
    return games.map(normalizeIgdbGame).filter(Boolean) as NormalizedGame[];
  }

  async searchGames(query: string): Promise<NormalizedGame[]> {
    const games = await igdbClient.fetchGames({ search: query, limit: 20 });
    return games.map(normalizeIgdbGame).filter(Boolean) as NormalizedGame[];
  }

  async getGameById(igdbId: number): Promise<NormalizedGame | null> {
    const game = await igdbClient.fetchById(igdbId);
    if (!game) return null;
    return normalizeIgdbGame(game);
  }

  async getGamesByGenre(genreIds: number[], limit = 50): Promise<NormalizedGame[]> {
    const games = await igdbClient.fetchByGenre(genreIds, limit);
    return games.map(normalizeIgdbGame).filter(Boolean) as NormalizedGame[];
  }

  // IGDB cover URLs use //images.igdb.com format — upgrade to t_cover_big
  static formatCoverUrl(url?: string): string | undefined {
    if (!url) return undefined;
    return url.replace('//', 'https://').replace('t_thumb', 't_cover_big');
  }

  static formatScreenshotUrl(url?: string): string | undefined {
    if (!url) return undefined;
    return url.replace('//', 'https://').replace('t_thumb', 't_screenshot_huge');
  }
}

export const igdbService = new IgdbService();
export { IgdbService };
