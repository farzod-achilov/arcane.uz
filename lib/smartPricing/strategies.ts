import { PricingStrategy, SmartMarkupType, PriceSettings } from './types';

export interface StrategyResult {
  markupType:  SmartMarkupType;
  markupValue: number;
  label:       string;
}

/**
 * Returns the effective markup for a given strategy and supplier price.
 *
 * aggressive  — minimal margin, below competitors
 * competitive — balanced mid-range margin
 * high_profit — maximum margin
 * global      — uses the range-based cheap/expensive rule
 * manual      — caller provides finalPrice directly (no markup)
 */
export function resolveStrategy(
  strategy:     PricingStrategy,
  supplierUsd:  number,
  settings:     PriceSettings,
): StrategyResult {
  switch (strategy) {
    case 'AGGRESSIVE':
      return {
        markupType:  'PERCENT',
        markupValue: settings.aggressiveMarkupPercent,
        label:       `Aggressive +${settings.aggressiveMarkupPercent}%`,
      };

    case 'COMPETITIVE':
      return {
        markupType:  'PERCENT',
        markupValue: settings.competitiveMarkupPercent,
        label:       `Competitive +${settings.competitiveMarkupPercent}%`,
      };

    case 'HIGH_PROFIT':
      return {
        markupType:  'PERCENT',
        markupValue: settings.highProfitMarkupPercent,
        label:       `High-profit +${settings.highProfitMarkupPercent}%`,
      };

    case 'GLOBAL':
    default:
      if (supplierUsd < settings.cheapGamesThreshold) {
        return {
          markupType:  'FIXED',
          markupValue: settings.cheapGamesFixedMarkup,
          label:       `Global cheap +$${settings.cheapGamesFixedMarkup} fixed`,
        };
      }
      return {
        markupType:  'PERCENT',
        markupValue: settings.expensiveGamesPercentMarkup,
        label:       `Global expensive +${settings.expensiveGamesPercentMarkup}%`,
      };
  }
}

export function applyMarkup(
  supplierPrice: number,
  markupType:    SmartMarkupType,
  markupValue:   number,
): number {
  if (markupType === 'PERCENT') {
    return supplierPrice * (1 + markupValue / 100);
  }
  return supplierPrice + markupValue;
}

export const STRATEGY_META: Record<PricingStrategy, { label: string; color: string; description: string }> = {
  GLOBAL:      { label: 'Global',      color: '#7C3AED', description: 'Cheap/expensive rule + global markup' },
  AGGRESSIVE:  { label: 'Aggressive',  color: '#06B6D4', description: 'Minimal margin, beat competitors'    },
  COMPETITIVE: { label: 'Competitive', color: '#22C55E', description: 'Balanced market-rate margin'         },
  HIGH_PROFIT: { label: 'High-profit', color: '#F59E0B', description: 'Maximum margin per sale'             },
  MANUAL:      { label: 'Manual',      color: '#9D60FA', description: 'Hand-set final price, no automation' },
};
