import axios, { AxiosInstance } from 'axios';
import axiosRetry from 'axios-retry';
import { config } from '../../config';
import { logger } from '../../lib/logger';
import type { RawgGame, RawgListResponse, RawgSearchParams } from './rawg.types';

const RAWG_BASE_URL = 'https://api.rawg.io/api';

// Circuit breaker: RAWG has had multi-day outages (e.g. Aug 2026) where every
// request hangs for the full 10s timeout across 3 retries (~46s) before
// failing. Every RAWG-dependent job (new-releases-sync, games-full-sync,
// price-refresh, ratings-refresh) shares this client, so without a breaker
// each of them independently eats that ~46s on every scheduled run for as
// long as the outage lasts. After a few consecutive failures we trip the
// breaker and fail fast for a cooldown window instead, backing off further
// on each repeat trip; the next call after cooldown probes RAWG again and
// closes the breaker as soon as it succeeds.
const BREAKER_FAILURE_THRESHOLD = 3;
const BREAKER_BASE_COOLDOWN_MS = 30 * 60 * 1000; // 30 min
const BREAKER_MAX_COOLDOWN_MS = 6 * 60 * 60 * 1000; // 6h

class RawgClient {
  private http: AxiosInstance;
  private consecutiveFailures = 0;
  private circuitOpenUntil: number | null = null;

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

  private async request<T>(fn: () => Promise<T>): Promise<T> {
    if (this.circuitOpenUntil !== null) {
      if (Date.now() < this.circuitOpenUntil) {
        throw new Error(
          `RAWG circuit open until ${new Date(this.circuitOpenUntil).toISOString()} (${this.consecutiveFailures} consecutive failures) — skipping request`
        );
      }
      logger.info('[RawgClient] Cooldown elapsed, probing RAWG again');
    }

    try {
      const result = await fn();
      if (this.consecutiveFailures > 0) {
        logger.info(`[RawgClient] Circuit closed — RAWG recovered after ${this.consecutiveFailures} consecutive failures`);
      }
      this.consecutiveFailures = 0;
      this.circuitOpenUntil = null;
      return result;
    } catch (err) {
      this.consecutiveFailures += 1;
      if (this.consecutiveFailures >= BREAKER_FAILURE_THRESHOLD) {
        const cooldown = Math.min(
          BREAKER_BASE_COOLDOWN_MS * 2 ** (this.consecutiveFailures - BREAKER_FAILURE_THRESHOLD),
          BREAKER_MAX_COOLDOWN_MS
        );
        this.circuitOpenUntil = Date.now() + cooldown;
        logger.warn(
          `[RawgClient] Circuit open for ${Math.round(cooldown / 60_000)}min after ${this.consecutiveFailures} consecutive failures`
        );
      }
      throw err;
    }
  }

  async fetchGames(params: RawgSearchParams = {}): Promise<RawgListResponse> {
    return this.request(async () => {
      const { data } = await this.http.get<RawgListResponse>('/games', { params });
      return data;
    });
  }

  async fetchById(rawgId: number): Promise<RawgGame> {
    return this.request(async () => {
      const { data } = await this.http.get<RawgGame>(`/games/${rawgId}`);
      return data;
    });
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
