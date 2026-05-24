import Decimal from 'decimal.js';

// Round money to 4 decimal places (store precision)
export function toDecimal(value: string | number | Decimal): Decimal {
  return new Decimal(value).toDecimalPlaces(4, Decimal.ROUND_HALF_UP);
}

// Round for display (2 decimal places)
export function toDisplayDecimal(value: string | number | Decimal): Decimal {
  return new Decimal(value).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
}

/**
 * Core pricing formulas
 *
 * percent: finalPrice = supplierPrice × (1 + markupValue / 100)
 * fixed:   finalPrice = supplierPrice + markupValue
 */
export function applyMarkup(
  supplierPrice: Decimal,
  markupType:    'percent' | 'fixed',
  markupValue:   Decimal,
): Decimal {
  if (markupType === 'percent') {
    const multiplier = new Decimal(1).plus(markupValue.div(100));
    return toDecimal(supplierPrice.mul(multiplier));
  }
  return toDecimal(supplierPrice.plus(markupValue));
}

/**
 * Apply an additional global markup percentage on top of already-computed price.
 * globalMarkupPercent = 0 → no-op
 */
export function applyGlobalMarkup(
  price:               Decimal,
  globalMarkupPercent: Decimal,
): Decimal {
  if (globalMarkupPercent.isZero()) return price;
  const multiplier = new Decimal(1).plus(globalMarkupPercent.div(100));
  return toDecimal(price.mul(multiplier));
}
