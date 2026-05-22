export interface RawgGame {
  id: number;
  slug: string;
  name: string;
  released?: string;
  background_image?: string;
  rating?: number;
  rating_top?: number;
  ratings_count?: number;
  metacritic?: number;
  playtime?: number;
  updated?: string;
  description_raw?: string;
  genres?: Array<{ id: number; name: string; slug: string }>;
  platforms?: Array<{
    platform: { id: number; name: string; slug: string };
    released_at?: string;
  }>;
  developers?: Array<{ id: number; name: string }>;
  publishers?: Array<{ id: number; name: string }>;
  short_screenshots?: Array<{ id: number; image: string }>;
  tags?: Array<{ id: number; name: string; slug: string }>;
  stores?: Array<{
    store: { id: number; name: string; slug: string };
    url: string;
  }>;
}

export interface RawgListResponse {
  count: number;
  next?: string;
  previous?: string;
  results: RawgGame[];
}

export interface RawgSearchParams {
  search?: string;
  genres?: string;
  platforms?: string;
  ordering?: string;
  page?: number;
  page_size?: number;
  metacritic?: string;
  dates?: string;
}
