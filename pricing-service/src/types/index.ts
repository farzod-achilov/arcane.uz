export type MarkupType = 'percent' | 'fixed';
export type Currency   = 'USD' | 'UZS' | 'EUR' | 'RUB';

export interface OfferEntity {
  id:            string;
  gameId:        string;
  supplierId:    string;
  supplierPrice: string; // Decimal serialised as string
  markupType:    MarkupType;
  markupValue:   string;
  finalPrice:    string;
  currency:      Currency;
  isActive:      boolean;
  createdAt:     Date;
  updatedAt:     Date;
}

export interface PricingRuleEntity {
  id:          string;
  name:        string;
  description: string | null;
  minPrice:    string | null;
  maxPrice:    string | null;
  markupType:  MarkupType;
  markupValue: string;
  priority:    number;
  isActive:    boolean;
}

export interface GlobalConfigEntity {
  id:                  string;
  globalMarkupPercent: string;
  updatedAt:           Date;
}

// Pagination helper
export interface PaginatedResult<T> {
  data:  T[];
  total: number;
  page:  number;
  limit: number;
}

// Standard API response envelope
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?:   T;
  error?:  string;
  meta?:   Record<string, unknown>;
}
