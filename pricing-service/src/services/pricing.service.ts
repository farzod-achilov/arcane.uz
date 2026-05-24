import Decimal from 'decimal.js';
import { PricingRule } from '@prisma/client';
import { applyMarkup, applyGlobalMarkup, toDecimal } from '../utils/decimal';
import { config } from '../config';

export interface PriceCalculationInput {
  supplierPrice:       Decimal;
  markupType:          'percent' | 'fixed';
  markupValue:         Decimal;
  globalMarkupPercent: Decimal;
  activeRules:         PricingRule[];
}

export interface PriceCalculationResult {
  finalPrice:          Decimal;
  appliedRuleId:       string | null;
  appliedRuleName:     string | null;
  globalMarkupApplied: boolean;
}

export class PricingService {
  /**
   * Main entry point — always call this to compute finalPrice.
   *
   * Priority chain:
   *   1. Find the highest-priority PricingRule matching supplierPrice
   *   2. If a rule matches → use its markupType + markupValue
   *   3. Otherwise → use the per-offer markupType + markupValue
   *   4. Apply globalMarkupPercent on top (additive percent)
   */
  calculateFinalPrice(input: PriceCalculationInput): PriceCalculationResult {
    const {
      supplierPrice,
      markupType,
      markupValue,
      globalMarkupPercent,
      activeRules,
    } = input;

    // Step 1 — match a pricing rule
    const matchedRule = this.matchRule(supplierPrice, activeRules);

    // Step 2 — pick effective markup
    const effectiveType  = matchedRule ? matchedRule.markupType  as 'percent' | 'fixed' : markupType;
    const effectiveValue = matchedRule ? toDecimal(matchedRule.markupValue.toString()) : markupValue;

    // Step 3 — apply markup
    let price = applyMarkup(supplierPrice, effectiveType, effectiveValue);

    // Step 4 — apply global markup
    const globalApplied = !globalMarkupPercent.isZero();
    if (globalApplied) {
      price = applyGlobalMarkup(price, globalMarkupPercent);
    }

    return {
      finalPrice:          price,
      appliedRuleId:       matchedRule?.id       ?? null,
      appliedRuleName:     matchedRule?.name      ?? null,
      globalMarkupApplied: globalApplied,
    };
  }

  /**
   * Suggest default markupType + markupValue for a new offer
   * based on the "cheap vs expensive" threshold.
   *
   * cheap  (< threshold): fixed markup  → e.g. +2 USD
   * expensive (≥ threshold): percent    → e.g. 10 %
   */
  suggestMarkup(supplierPriceUsd: number): { markupType: 'percent' | 'fixed'; markupValue: number } {
    const threshold = config.pricing.cheapGameThresholdUsd;
    if (supplierPriceUsd < threshold) {
      return { markupType: 'fixed', markupValue: 2 };
    }
    return { markupType: 'percent', markupValue: 10 };
  }

  // ─── Private ─────────────────────────────────────────────────────────────────

  private matchRule(supplierPrice: Decimal, rules: PricingRule[]): PricingRule | null {
    // Rules already sorted by priority DESC from the repository
    for (const rule of rules) {
      const aboveMin = rule.minPrice == null || supplierPrice.gte(rule.minPrice.toString());
      const belowMax = rule.maxPrice == null || supplierPrice.lte(rule.maxPrice.toString());
      if (aboveMin && belowMax) return rule;
    }
    return null;
  }
}
