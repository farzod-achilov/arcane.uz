export type PricingStrategy = 'GLOBAL' | 'AGGRESSIVE' | 'COMPETITIVE' | 'HIGH_PROFIT' | 'MANUAL';
export type SmartMarkupType = 'PERCENT' | 'FIXED';
export type UsdRoundType    = 'POINT_99' | 'POINT_49' | 'INTEGER';
export type UzsRoundType    = 'NEAREST_1000' | 'NEAREST_9000' | 'NEAREST_99000';

export interface PriceSettings {
  id:                          string;
  globalMarkupPercent:         number;
  cheapGamesThreshold:         number;
  cheapGamesFixedMarkup:       number;
  expensiveGamesPercentMarkup: number;
  autoRoundUsd:                boolean;
  usdRoundType:                UsdRoundType;
  autoRoundUzs:                boolean;
  uzsRoundType:                UzsRoundType;
  minimumProfitUsd:            number;
  aggressiveMarkupPercent:     number;
  competitiveMarkupPercent:    number;
  highProfitMarkupPercent:     number;
  defaultStrategy:             PricingStrategy;
}

export interface CurrencySettings {
  id:             string;
  exchangeRate:   number;
  autoUpdateRate: boolean;
  lastUpdated:    string;
}

export interface GamePricingInput {
  gameId:               string;
  supplierPriceUsd:     number;
  steamPriceUsd?:       number | null;
  steamDiscountPriceUsd?: number | null;
  pricingStrategy:      PricingStrategy;
  customPricingEnabled: boolean;
  customMarkupType?:    SmartMarkupType | null;
  customMarkupValue?:   number | null;
  customFinalPrice?:    number | null;
}

export interface PriceCalculationResult {
  supplierPriceUsd:   number;
  rawPriceUsd:        number;
  finalPriceUsd:      number;
  finalPriceUzs:      number;
  steamPriceUsd:      number | null;
  youSaveAmount:      number | null;
  youSavePercent:     number | null;
  profitUsd:          number;
  marginPercent:      number;
  appliedStrategy:    PricingStrategy;
  appliedMarkup:      number;
  appliedMarkupType:  SmartMarkupType;
  appliedRules:       string[];
  roundedUsd:         boolean;
  roundedUzs:         boolean;
}

export interface PreviewRequest {
  supplierPriceUsd:     number;
  steamPriceUsd?:       number;
  strategy:             PricingStrategy;
  customMarkupType?:    SmartMarkupType;
  customMarkupValue?:   number;
  customFinalPrice?:    number;
  customPricingEnabled?: boolean;
}
