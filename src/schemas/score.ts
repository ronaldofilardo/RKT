import { z } from 'zod';

export const ScoreEnvelopeSchema = z.object({
  state: z.record(z.any()).optional().nullable(),
  history: z.array(z.record(z.any())).optional().nullable(),
}).passthrough();

export type ScoreEnvelope = z.infer<typeof ScoreEnvelopeSchema>;
