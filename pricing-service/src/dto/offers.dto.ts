import { z } from 'zod';

// ─── Create ───────────────────────────────────────────────────────────────────

export const CreateOfferDto = z.object({
  gameId:       z.string().uuid('gameId must be a valid UUID'),
  supplierId:   z.string().uuid('supplierId must be a valid UUID'),
  supplierPrice: z
    .number({ required_error: 'supplierPrice is required' })
    .positive('supplierPrice must be > 0'),
  markupType:   z.enum(['percent', 'fixed'], {
    errorMap: () => ({ message: 'markupType must be "percent" or "fixed"' }),
  }),
  markupValue:  z
    .number({ required_error: 'markupValue is required' })
    .min(0, 'markupValue must be >= 0'),
  currency:     z.enum(['USD', 'UZS', 'EUR', 'RUB']).optional().default('USD'),
  isActive:     z.boolean().optional().default(true),
});

export type CreateOfferDto = z.infer<typeof CreateOfferDto>;

// ─── Update (all fields optional) ────────────────────────────────────────────

export const UpdateOfferDto = z.object({
  supplierPrice: z.number().positive('supplierPrice must be > 0').optional(),
  markupType:    z.enum(['percent', 'fixed']).optional(),
  markupValue:   z.number().min(0, 'markupValue must be >= 0').optional(),
  currency:      z.enum(['USD', 'UZS', 'EUR', 'RUB']).optional(),
  isActive:      z.boolean().optional(),
}).refine(
  (data) => Object.keys(data).length > 0,
  { message: 'At least one field must be provided for update' },
);

export type UpdateOfferDto = z.infer<typeof UpdateOfferDto>;

// ─── Query / filter ───────────────────────────────────────────────────────────

export const ListOffersDto = z.object({
  gameId:     z.string().uuid().optional(),
  supplierId: z.string().uuid().optional(),
  currency:   z.enum(['USD', 'UZS', 'EUR', 'RUB']).optional(),
  isActive:   z
    .string()
    .optional()
    .transform((v) => (v === undefined ? undefined : v === 'true')),
  page:  z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type ListOffersDto = z.infer<typeof ListOffersDto>;

// ─── Pricing rule ─────────────────────────────────────────────────────────────

export const CreatePricingRuleDto = z.object({
  name:        z.string().min(1),
  description: z.string().optional(),
  minPrice:    z.number().min(0).optional(),
  maxPrice:    z.number().min(0).optional(),
  markupType:  z.enum(['percent', 'fixed']),
  markupValue: z.number().min(0, 'markupValue must be >= 0'),
  priority:    z.number().int().default(0),
  isActive:    z.boolean().default(true),
}).refine(
  (d) => d.minPrice === undefined || d.maxPrice === undefined || d.minPrice <= d.maxPrice,
  { message: 'minPrice must be <= maxPrice', path: ['minPrice'] },
);

export type CreatePricingRuleDto = z.infer<typeof CreatePricingRuleDto>;
