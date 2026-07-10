import { describe, it, expect } from 'vitest';
import { formatPrice, formatRating } from '@/lib/utils';

describe('formatPrice', () => {
  it('groups thousands with spaces and appends сум', () => {
    expect(formatPrice(249000)).toBe('249 000 сум');
    expect(formatPrice(1250500)).toBe('1 250 500 сум');
  });
  it('leaves small numbers ungrouped', () => {
    expect(formatPrice(500)).toBe('500 сум');
    expect(formatPrice(0)).toBe('0 сум');
  });
});

describe('formatRating', () => {
  it('renders one decimal place', () => {
    expect(formatRating(4)).toBe('4.0');
    expect(formatRating(4.75)).toBe('4.8');
  });
});
