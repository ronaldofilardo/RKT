import { z } from 'zod';

export const CreateShareLinkInputSchema = z.object({
  label: z.string().trim().max(60, 'Rótulo deve ter no máximo 60 caracteres').optional(),
});

export type CreateShareLinkInput = z.infer<typeof CreateShareLinkInputSchema>;

export const RedeemInviteInputSchema = z.object({
  token: z.string().trim().min(10, 'Token inválido'),
});

export type RedeemInviteInput = z.infer<typeof RedeemInviteInputSchema>;

export const ShareLinkResponseSchema = z.object({
  linkId: z.string(),
  url: z.string(),
  label: z.string().nullable(),
  createdAt: z.string(),
});

export const SpectatorFeedQuerySchema = z.object({
  rev: z.string().optional(),
});

