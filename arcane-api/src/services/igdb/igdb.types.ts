export interface IgdbTokenResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
}

export interface IgdbGame {
  id: number;
  name: string;
  slug: string;
  summary?: string;
  first_release_date?: number;
  rating?: number;
  aggregated_rating?: number;
  cover?: { id: number; url: string };
  screenshots?: Array<{ id: number; url: string }>;
  genres?: Array<{ id: number; name: string }>;
  platforms?: Array<{ id: number; name: string }>;
  involved_companies?: Array<{
    id: number;
    developer: boolean;
    publisher: boolean;
    company: { id: number; name: string };
  }>;
  videos?: Array<{ id: number; video_id: string; name: string }>;
  themes?: Array<{ id: number; name: string }>;
  game_modes?: Array<{ id: number; name: string }>;
}

export interface IgdbSearchParams {
  search?: string;
  genres?: number[];
  platforms?: number[];
  limit?: number;
  offset?: number;
  minRating?: number;
}
