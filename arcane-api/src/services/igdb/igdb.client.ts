import axios, { AxiosInstance } from 'axios';
import axiosRetry from 'axios-retry';
import { config } from '../../config';
import { redis } from '../../lib/redis';
import { logger } from '../../lib/logger';
import type { IgdbTokenResponse, IgdbGame, IgdbSearchParams } from './igdb.types';

const TWITCH_TOKEN_URL = 'https://id.twitch.tv/oauth2/token';
const IGDB_BASE_URL = 'https://api.igdb.com/v4';
const TOKEN_CACHE_KEY = 'igdb:access_token';

class IgdbClient {
  private http: AxiosInstance;

  constructor() {
    this.http = axios.create({ baseURL: IGDB_BASE_URL, timeout: 10_000 });
    axiosRetry(this.http, {
      retries: 3,
      retryDelay: axiosRetry.exponentialDelay,
      retryCondition: (err) =>
        axiosRetry.isNetworkOrIdempotentRequestError(err) ||
        err.response?.status === 429,
    });

    this.http.interceptors.request.use(async (cfg) => {
      const token = await this.getToken();
      cfg.headers['Authorization'] = `Bearer ${token}`;
      cfg.headers['Client-ID'] = config.games.igdbClientId;
      cfg.headers['Content-Type'] = 'text/plain';
      return cfg;
    });

    this.http.interceptors.response.use(
      (res) => res,
      (err) => {
        logger.error('IGDB request failed', {
          status: err.response?.status,
          url: err.config?.url,
        });
        return Promise.reject(err);
      }
    );
  }

  private async getToken(): Promise<string> {
    const cached = await redis.get(TOKEN_CACHE_KEY);
    if (cached) return cached;

    const { data } = await axios.post<IgdbTokenResponse>(TWITCH_TOKEN_URL, null, {
      params: {
        client_id: config.games.igdbClientId,
        client_secret: config.games.igdbClientSecret,
        grant_type: 'client_credentials',
      },
    });

    // Cache 1 hour before real expiry to avoid edge cases
    const ttl = Math.max(data.expires_in - 3600, 3600);
    await redis.setex(TOKEN_CACHE_KEY, ttl, data.access_token);
    logger.info('IGDB: obtained new access token');

    return data.access_token;
  }

  async fetchGames(params: IgdbSearchParams = {}): Promise<IgdbGame[]> {
    const { search, genres, platforms, limit = 50, offset = 0, minRating } = params;

    const conditions: string[] = ['version_parent = null', 'category = 0'];
    if (minRating) conditions.push(`rating >= ${minRating}`);
    if (genres?.length) conditions.push(`genres = (${genres.join(',')})`);
    if (platforms?.length) conditions.push(`platforms = (${platforms.join(',')})`);

    const where = `where ${conditions.join(' & ')};`;
    const searchClause = search ? `search "${search}";` : '';
    const fields = [
      'name', 'slug', 'summary', 'first_release_date', 'rating', 'aggregated_rating',
      'cover.url', 'screenshots.url', 'genres.name', 'platforms.name',
      'involved_companies.developer', 'involved_companies.publisher',
      'involved_companies.company.name', 'videos.video_id', 'videos.name',
    ].join(',');

    const body = [
      `fields ${fields};`,
      searchClause,
      where,
      `limit ${limit};`,
      `offset ${offset};`,
      'sort rating desc;',
    ]
      .filter(Boolean)
      .join('\n');

    const { data } = await this.http.post<IgdbGame[]>('/games', body);
    return data;
  }

  async fetchById(igdbId: number): Promise<IgdbGame | null> {
    const fields = [
      'name', 'slug', 'summary', 'first_release_date', 'rating', 'aggregated_rating',
      'cover.url', 'screenshots.url', 'genres.name', 'platforms.name',
      'involved_companies.developer', 'involved_companies.publisher',
      'involved_companies.company.name', 'videos.video_id',
    ].join(',');

    const body = `fields ${fields};\nwhere id = ${igdbId};\nlimit 1;`;
    const { data } = await this.http.post<IgdbGame[]>('/games', body);
    return data[0] ?? null;
  }

  async fetchTopRated(limit = 100): Promise<IgdbGame[]> {
    return this.fetchGames({ minRating: 75, limit });
  }

  async fetchByGenre(genreIds: number[], limit = 50): Promise<IgdbGame[]> {
    return this.fetchGames({ genres: genreIds, limit, minRating: 60 });
  }
}

export const igdbClient = new IgdbClient();
