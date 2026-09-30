import { z } from "zod";
import { flexibleIdValidator } from "./common";

export const AnnotationSessionStatusSchema = z.enum([
  "IN_PROGRESS",
  "COMPLETED",
  "ABANDONED",
]);
export type AnnotationSessionStatus = z.infer<
  typeof AnnotationSessionStatusSchema
>;

export const AnnotationEndorsementSchema = z.object({
  id: flexibleIdValidator,
  sessionId: flexibleIdValidator,
  endorsedByUserId: flexibleIdValidator,
  endorsedAt: z.coerce.date(),
  endorsedBy: z
    .object({
      id: flexibleIdValidator,
      name: z.string(),
      email: z.string().email(),
    })
    .optional(),
});
export type AnnotationEndorsement = z.infer<typeof AnnotationEndorsementSchema>;

export const AnnotationSessionSchema = z.object({
  id: flexibleIdValidator,
  matchId: flexibleIdValidator,
  annotatorUserId: flexibleIdValidator,
  startedAt: z.coerce.date(),
  endedAt: z.coerce.date().nullable(),
  matchStateSnapshot: z.string().nullable(),
  finalStateSnapshot: z.string().nullable(),
  isActive: z.boolean(),
  status: AnnotationSessionStatusSchema,
  createdAt: z.coerce.date(),
  annotator: z
    .object({
      id: flexibleIdValidator,
      name: z.string(),
      email: z.string().email(),
    })
    .optional(),
  endorsements: z.array(AnnotationEndorsementSchema).optional(),
});
export type AnnotationSession = z.infer<typeof AnnotationSessionSchema>;

export const EndSessionInputSchema = z.object({
  status: AnnotationSessionStatusSchema.optional(),
  finalState: z.unknown().optional(),
});
export type EndSessionInput = z.infer<typeof EndSessionInputSchema>;

export const MarkSessionAbandonedInputSchema = z.object({
  matchStateSnapshot: z.string().optional(),
});
export type MarkSessionAbandonedInput = z.infer<
  typeof MarkSessionAbandonedInputSchema
>;
