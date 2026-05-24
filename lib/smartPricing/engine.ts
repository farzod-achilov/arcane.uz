import { roundUsd, roundUzs } from './rounding';
import { resolveStrategy, applyMarkup } from './strategies';
import {
  PriceSettings, CurrencySettings, GamePricingInput, PriceCalculationResult,
  PreviewRequest,
} from './types';

export class PriceEngineService {
  constructor(
    private readonly settings: PriceSettings,
    private readonly currency: CurrencySettings,
  ) {}

  /**
   * Main entry point — calculates full final pricing for a game.
   *
   * Pipeline:
   *   1. Custom pricing override (if enabled + MANUAL strategy)
   *   2. Strategy-based markup
   *   3. Global markup on top
   *   4. USD smart rounding
   *   5. Minimum profit floor
   *   6. USD → UZS conversion
   *   7. UZS smart rounding
   *   8. Steam compare (youSave)
   */
  calculateFinalGamePrice(input: GamePricingInput): PriceCalculationResult {
    const {
      supplierPriceUsd, steamPriceUsd, steamDiscountPriceUsd,
      pricingStrategy, customPricingEnabled, customMarkupType,
      customMarkupValue, customFinalPrice,
    } = input;

    const appliedRules: string[] = [];
    let price = supplierPriceUsd;

    // ─── 1. Custom MANUAL override ──────────────────────────────────────
    if (customPricingEnabled && pricingStrategy === 'MANUAL' && customFinalPrice != null) {
      const finalUsd = customFinalPrice;
      const finalUzs = this.toUzs(finalUsd);
      const profit   = finalUsd - supplierPriceUsd;
      appliedRules.push('Manual override — custom final price');
      return this.buildResult(
        input, finalUsd, finalUsd, finalUzs, profit,
        'MANUAL', 0, 'FIXED', appliedRules, false, false,
      );
    }

    // ─── 2. Custom markup override (non-MANUAL) ──────────────────────────
    if (customPricingEnabled && customMarkupType && customMarkupValue != null) {
      price = applyMarkup(supplierPriceUsd, customMarkupType, customMarkupValue);
      appliedRules.push(
        `Custom markup: ${customMarkupType === 'PERCENT' ? `+${customMarkupValue}%` : `+$${customMarkupValue}`}`,
      );
    } else {
      // ─── 3. Strategy-based markup ──────────────────────────────────────
      const stratResult = resolveStrategy(pricingStrategy, supplierPriceUsd, this.settings);
      price = applyMarkup(supplierPriceUsd, stratResult.markupType, stratResult.markupValue);
      appliedRules.push(stratResult.label);
    }

    // ─── 4. Global markup (additive %) ────────────────────────────────────
    if (this.settings.globalMarkupPercent > 0 && !customPricingEnabled) {
      price = price * (1 + this.settings.globalMarkupPercent / 100);
      appliedRules.push(`Global markup +${this.settings.globalMarkupPercent}%`);
    }

    const rawPriceUsd = price;

    // ─── 5. USD smart rounding ────────────────────────────────────────────
    let roundedUsd = false;
    if (this.settings.autoRoundUsd) {
      price      = roundUsd(price, this.settings.usdRoundType);
      roundedUsd = true;
      appliedRules.push(`USD round (${this.settings.usdRoundType})`);
    }

    // ─── 6. Minimum profit floor ──────────────────────────────────────────
    const currentProfit = price - supplierPriceUsd;
    if (currentProfit < this.settings.minimumProfitUsd) {
      price = supplierPriceUsd + this.settings.minimumProfitUsd;
      if (this.settings.autoRoundUsd) {
        price = roundUsd(price, this.settings.usdRoundType);
      }
      appliedRules.push(`Minimum profit floor $${this.settings.minimumProfitUsd}`);
    }

    const finalUsd    = price;
    const profitUsd   = finalUsd - supplierPriceUsd;

    // ─── 7. USD → UZS ────────────────────────────────────────────────────
    let   uzsRaw      = finalUsd * this.currency.exchangeRate;
    let   roundedUzs  = false;
    if (this.settings.autoRoundUzs) {
      uzsRaw     = roundUzs(uzsRaw, this.settings.uzsRoundType);
      roundedUzs = true;
      appliedRules.push(`UZS round (${this.settings.uzsRoundType})`);
    }
    const finalUzs = uzsRaw;

    return this.buildResult(
      input, rawPriceUsd, finalUsd, finalUzs, profitUsd,
      pricingStrategy, 0, 'PERCENT', appliedRules, roundedUsd, roundedUzs,
      steamPriceUsd ?? null, steamDiscountPriceUsd ?? null,
    );
  }

  /** Convenience wrapper for the live preview API */
  previewPrice(req: PreviewRequest): PriceCalculationResult {
    return this.calculateFinalGamePrice({
      gameId:               'preview',
      supplierPriceUsd:     req.supplierPriceUsd,
      steamPriceUsd:        req.steamPriceUsd ?? null,
      steamDiscountPriceUsd: null,
      pricingStrategy:      req.strategy,
      customPricingEnabled: req.customPricingEnabled ?? false,
      customMarkupType:     req.customMarkupType ?? null,
      customMarkupValue:    req.customMarkupValue ?? null,
      customFinalPrice:     req.customFinalPrice ?? null,
    });
  }

  private toUzs(usd: number): number {
    const raw = usd * this.currency.exchangeRate;
    return this.settings.autoRoundUzs ? roundUzs(raw, this.settings.uzsRoundType) : raw;
  }

  private buildResult(
    input:           GamePricingInput,
    rawPriceUsd:     number,
    finalPriceUsd:   number,
    finalPriceUzs:   number,
    profitUsd:       number,
    appliedStrategy: import('./types').PricingStrategy,
    appliedMarkup:   number,
    appliedMarkupType: import('./types').SmartMarkupType,
    appliedRules:    string[],
    roundedUsd:      boolean,
    roundedUzs:      boolean,
    steamPriceUsd:   number | null = null,
    steamDiscountPriceUsd: number | null = null,
  ): PriceCalculationResult {
    const steamRef = steamDiscountPriceUsd ?? steamPriceUsd ?? input.steamPriceUsd ?? null;

    let youSaveAmount:  number | null = null;
    let youSavePercent: number | null = null;
    if (steamRef != null && steamRef > finalPriceUsd) {
      youSaveAmount  = steamRef - finalPriceUsd;
      youSavePercent = (youSaveAmount / steamRef) * 100;
    }

    return {
      supplierPriceUsd: input.supplierPriceUsd,
      rawPriceUsd,
      finalPriceUsd,
      finalPriceUzs,
      steamPriceUsd:  steamRef,
      youSaveAmount,
      youSavePercent,
      profitUsd,
      marginPercent:  input.supplierPriceUsd > 0 ? (profitUsd / input.supplierPriceUsd) * 100 : 0,
      appliedStrategy,
      appliedMarkup,
      appliedMarkupType,
      appliedRules,
      roundedUsd,
      roundedUzs,
    };
  }
}

// ─── Default settings (used when DB is unavailable) ──────────────────────────

export const DEFAULT_PRICE_SETTINGS: PriceSettings = {
  id:                          'default',
  globalMarkupPercent:         5,
  cheapGamesThreshold:         20,
  cheapGamesFixedMarkup:       2,
  expensiveGamesPercentMarkup: 10,
  autoRoundUsd:                true,
  usdRoundType:                'POINT_99',
  autoRoundUzs:                true,
  uzsRoundType:                'NEAREST_9000',
  minimumProfitUsd:            1,
  aggressiveMarkupPercent:     3,
  competitiveMarkupPercent:    8,
  highProfitMarkupPercent:     20,
  defaultStrategy:             'GLOBAL',
};

export const DEFAULT_CURRENCY_SETTINGS: CurrencySettings = {
  id:             'default',
  exchangeRate:   12700,
  autoUpdateRate: false,
  lastUpdated:    new Date().toISOString(),
};
