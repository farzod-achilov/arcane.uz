import { z } from 'zod';

// Steam key: XXXXX-XXXXX-XXXXX
const steamKeyRegex = /^[A-Z0-9]{5}-[A-Z0-9]{5}-[A-Z0-9]{5}$/i;
const steamKey = z
  .string()
  .transform((v) => v.trim().toUpperCase())
  .refine((v) => steamKeyRegex.test(v), {
    message: 'Invalid Steam key format. Expected: XXXXX-XXXXX-XXXXX',
  });

export const importKeysSchema = z.object({
  gameId: z.string().min(1),
  keys: z
    .array(steamKey)
    .min(1, 'At least one key required')
    .max(500, 'Max 500 keys per import'),
  type: z.enum(['STORE', 'DROP', 'BOTH']).default('BOTH'),
});

export const addKeySchema = z.object({
  gameId: z.string().min(1),
  key: steamKey,
  type: z.enum(['STORE', 'DROP', 'BOTH']).default('BOTH'),
});

export const moveKeysSchema = z.object({
  gameId: z.string().min(1),
  fromType: z.enum(['STORE', 'DROP', 'BOTH']),
  toType: z.enum(['STORE', 'DROP', 'BOTH']),
  count: z.number().int().positive().max(1000),
});

export const disableKeysSchema = z.object({
  keyIds: z.array(z.string()).min(1).max(500),
  reason: z.string().optional(),
});

export type ImportKeysDto = z.infer<typeof importKeysSchema>;
export type AddKeyDto = z.infer<typeof addKeySchema>;
export type MoveKeysDto = z.infer<typeof moveKeysSchema>;
export type DisableKeysDto = z.infer<typeof disableKeysSchema>;
