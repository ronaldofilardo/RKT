import { z } from 'zod';

export const CheckoutSessionSchema = z.object({
  planTier: z.enum([
    'ATLETA_PRO',
    'COACH_START',
    'COACH_PRO',
    'CT_PERFORMANCE',
    'CT_FULL',
    'CT_ENTERPRISE',
  ]),
  cycle: z.enum(['MONTHLY', 'YEARLY']).default('MONTHLY'),
  billingType: z.enum(['PIX', 'BOLETO', 'CREDIT_CARD']).default('PIX'),
  dependentPlayerId: z.string().optional(),
});

export type CheckoutSessionInput = z.infer<typeof CheckoutSessionSchema>;
