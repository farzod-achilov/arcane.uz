import { rawgClient } from './rawg.client';
import type { NormalizedGame } from '../../modules/games/games.normalizer';
import { normalizeRawgGame } from '../../modules/games/games.normalizer';

class RawgService {
  async getTopRatedGames(page = 1, pageSize = 40): Promise<NormalizedGame[]> {
    const res = await rawgClient.fetchTopRated(page, pageSize);
    const detailed = await Promise.all(
      res.results.slice(0, 20).map((g) => rawgClient.fetchById(g.id).catch(() => g))
    );
    return detailed.map(normalizeRawgGame).filter(Boolean) as NormalizedGame[];
  }

  async getNewReleases(page = 1, pageSize = 40): Promise<NormalizedGame[]> {
    const res = await rawgClient.fetchNewReleases(page, pageSize);
    return res.results.map(normalizeRawgGame).filter(Boolean) as NormalizedGame[];
  }

  async searchGames(query: string): Promise<NormalizedGame[]> {
    const res = await rawgClient.searchGames(query, 20);
    return res.results.map(normalizeRawgGame).filter(Boolean) as NormalizedGame[];
  }

  async getByGenre(genre: string, page = 1): Promise<NormalizedGame[]> {
    const res = await rawgClient.fetchByGenre(genre, page);
    return res.results.map(normalizeRawgGame).filter(Boolean) as NormalizedGame[];
  }

  async getGameById(rawgId: number): Promise<NormalizedGame | null> {
    const game = await rawgClient.fetchById(rawgId);
    if (!game) return null;
    return normalizeRawgGame(game);
  }
}

export const rawgService = new RawgService();
export { RawgService };
