import axios, { AxiosInstance } from 'axios';
import axiosRetry from 'axios-retry';
import { config } from '../../config';
import { logger } from '../../lib/logger';
import type { SteamAppDetails, SteamAppListResponse, SteamGameData } from './steam.types';

const STEAM_STORE_URL = 'https://store.steampowered.com/api';
const STEAM_API_URL = 'https://api.steampowered.com';

class SteamClient {
  private storeHttp: AxiosInstance;
  private apiHttp: AxiosInstance;

  constructor() {
    this.storeHttp = axios.create({ baseURL: STEAM_STORE_URL, timeout: 12_000 });
    this.apiHttp = axios.create({
      baseURL: STEAM_API_URL,
      timeout: 12_000,
      params: { key: config.games.steamApiKey, format: 'json' },
    });

    for (const instance of [this.storeHttp, this.apiHttp]) {
      axiosRetry(instance, {
        retries: 3,
        retryDelay: axiosRetry.exponentialDelay,
        retryCondition: (err) =>
          axiosRetry.isNetworkOrIdempotentRequestError(err) ||
          err.response?.status === 429,
      });

      instance.interceptors.response.use(
        (res) => res,
        (err) => {
          logger.error('Steam request failed', {
            status: err.response?.status,
            url: err.config?.url,
          });
          return Promise.reject(err);
        }
      );
    }
  }

  async fetchAppDetails(appId: number, cc = 'UZ'): Promise<SteamGameData | null> {
    const { data } = await this.storeHttp.get<Record<string, SteamAppDetails>>('/appdetails', {
      params: { appids: appId, cc, l: 'english' },
    });

    const result = data[String(appId)];
    if (!result?.success || !result.data) return null;
    return result.data;
  }

  async fetchMultipleAppDetails(appIds: number[], cc = 'UZ'): Promise<Map<number, SteamGameData>> {
    const results = new Map<number, SteamGameData>();

    // Steam API allows only one appid at a time, batch with rate limiting
    for (const appId of appIds) {
      const data = await this.fetchAppDetails(appId, cc);
      if (data) results.set(appId, data);
      await new Promise((r) => setTimeout(r, 200)); // respect rate limits
    }

    return results;
  }

  async fetchAppList(): Promise<Array<{ appid: number; name: string }>> {
    const { data } = await this.apiHttp.get<SteamAppListResponse>(
      '/ISteamApps/GetAppList/v2/'
    );
    return data.applist.apps;
  }

  async searchByName(name: string): Promise<number | null> {
    const apps = await this.fetchAppList();
    const match = apps.find(
      (a) => a.name.toLowerCase() === name.toLowerCase()
    );
    return match?.appid ?? null;
  }

  extractPriceUsd(data: SteamGameData): number | null {
    if (data.is_free) return 0;
    if (!data.price_overview) return null;
    return data.price_overview.final / 100;
  }
}

export const steamClient = new SteamClient();
