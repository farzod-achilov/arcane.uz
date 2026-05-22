import { steamClient } from './steam.client';
import type { SteamGameData } from './steam.types';
import type { NormalizedGame } from '../../modules/games/games.normalizer';
import { normalizeSteamGame } from '../../modules/games/games.normalizer';

class SteamService {
  async getGameDetails(appId: number): Promise<NormalizedGame | null> {
    const data = await steamClient.fetchAppDetails(appId);
    if (!data) return null;
    return normalizeSteamGame(data);
  }

  async getMultipleGames(appIds: number[]): Promise<NormalizedGame[]> {
    const map = await steamClient.fetchMultipleAppDetails(appIds);
    const result: NormalizedGame[] = [];

    for (const [, data] of map) {
      const normalized = normalizeSteamGame(data);
      if (normalized) result.push(normalized);
    }

    return result;
  }

  async findAndFetchByName(name: string): Promise<NormalizedGame | null> {
    const appId = await steamClient.searchByName(name);
    if (!appId) return null;
    return this.getGameDetails(appId);
  }

  extractPriceUsd(data: SteamGameData): number | null {
    return steamClient.extractPriceUsd(data);
  }
}

export const steamService = new SteamService();
export { SteamService };
