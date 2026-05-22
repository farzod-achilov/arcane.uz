import axios, { AxiosInstance } from 'axios';
import axiosRetry from 'axios-retry';
import { config } from '../../config';
import { logger } from '../../lib/logger';
import type { RawgGame, RawgListResponse, RawgSearchParams } from './rawg.types';

const RAWG_BASE_URL = 'https://api.rawg.io/api';

class RawgClient {
  private http: AxiosInstance;

  constructor() {
    this.http = axios.create({
      baseURL: RAWG_BASE_URL,
      timeout: 10_000,
      params: { key: config.games.rawgApiKey },
    });

    axiosRetry(this.http, {
      retries: 3,
      retryDelay: (count) => count * 1000,
      retryCondition: (err) =>
        axiosRetry.isNetworkOrIdempotentRequestError(err) ||
        err.response?.status === 429,
    });

    this.http.interceptors.response.use(
      (res) => res,
      (err) => {
        logger.error('RAWG request failed', {
          status: err.response?.status,
          url: err.config?.url,
        });
        return Promise.reject(err);
      }
    );
  }

  async fetchGames(params: RawgSearchParams = {}): Promise<RawgListResponse> {
    const { data } = await this.http.get<RawgListResponse>('/games', { params });
    return data;
  }

  async fetchById(rawgId: number): Promise<RawgGame> {
    const { data } = await this.http.get<RawgGame>(`/games/${rawgId}`);
    return data;
  }

  async fetchTopRated(page = 1, pageSize = 40): Promise<RawgListResponse> {
    return this.fetchGames({
      ordering: '-metacritic',
      metacritic: '70,100',
      page,
      page_size: pageSize,
    });
  }

  async fetchNewReleases(page = 1, pageSize = 40): Promise<RawgListResponse> {
    const now = new Date();
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const fmt = (d: Date) => d.toISOString().split('T')[0];

    return this.fetchGames({
      dates: `${fmt(monthAgo)},${fmt(now)}`,
      ordering: '-added',
      page,
      page_size: pageSize,
    });
  }

  async fetchByGenre(genre: string, page = 1, pageSize = 40): Promise<RawgListResponse> {
    return this.fetchGames({ genres: genre, ordering: '-rating', page, page_size: pageSize });
  }

  async searchGames(query: string, pageSize = 20): Promise<RawgListResponse> {
    return this.fetchGames({ search: query, page_size: pageSize });
  }
}

export const rawgClient = new RawgClient();
