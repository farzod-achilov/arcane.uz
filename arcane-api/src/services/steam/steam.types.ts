export interface SteamAppDetails {
  success: boolean;
  data?: SteamGameData;
}

export interface SteamGameData {
  type: string;
  name: string;
  steam_appid: number;
  required_age: number;
  is_free: boolean;
  short_description?: string;
  detailed_description?: string;
  supported_languages?: string;
  header_image?: string;
  website?: string;
  developers?: string[];
  publishers?: string[];
  price_overview?: {
    currency: string;
    initial: number;
    final: number;
    discount_percent: number;
    initial_formatted: string;
    final_formatted: string;
  };
  platforms?: {
    windows: boolean;
    mac: boolean;
    linux: boolean;
  };
  metacritic?: { score: number; url: string };
  genres?: Array<{ id: string; description: string }>;
  screenshots?: Array<{ id: number; path_thumbnail: string; path_full: string }>;
  movies?: Array<{
    id: number;
    name: string;
    thumbnail: string;
    webm: { 480: string; max: string };
    mp4: { 480: string; max: string };
  }>;
  release_date?: { coming_soon: boolean; date: string };
  content_descriptors?: { ids: number[]; notes?: string };
  categories?: Array<{ id: number; description: string }>;
}

export interface SteamAppListResponse {
  applist: {
    apps: Array<{ appid: number; name: string }>;
  };
}

export interface SteamSearchParams {
  appid: number;
  cc?: string;
  l?: string;
}
