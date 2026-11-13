import { z } from 'zod';

export const PoolMatchPayloadSchema = z.object({
  matchId: z.string(),
  templateId: z.string(),
  player1Name: z.string(),
  player2Name: z.string(),
  tournamentName: z.string().optional(),
  scheduledAt: z.string().optional(),
  createdByName: z.string().optional(),
});

export type PoolMatchPayload = z.infer<typeof PoolMatchPayloadSchema>;

export const AssignedToAnnotatePayloadSchema = z.object({
  matchId: z.string(),
  templateId: z.string(),
  player1Name: z.string(),
  player2Name: z.string(),
  assignedByName: z.string(),
  scheduledAt: z.string().optional(),
});

export type AssignedToAnnotatePayload = z.infer<typeof AssignedToAnnotatePayloadSchema>;

