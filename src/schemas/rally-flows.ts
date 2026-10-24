import { z } from "zod";
import { flexibleIdValidator } from "./common";
import { RallyDetailsSchema, PointTypeSchema } from "./rally-details";

export const PointFlowInputSchema = z.object({
  winnerId: flexibleIdValidator,
  type: PointTypeSchema,
  serverId: flexibleIdValidator,
  timestamp: z.number().optional(),
  sequenceNumber: z.number().int().positive().optional(),
  clientEventId: z.string().min(1).max(128).optional(),
  isFirstServe: z.boolean().optional(),
  isSecondServe: z.boolean().optional(),
  firstFaultDetail: z
    .object({
      errorType: z.string().optional(),
      serveEffect: z.string().optional(),
      direction: z.string().optional(),
    })
    .optional(),
  rallyDetails: RallyDetailsSchema.optional(),
  rallyLength: z.number().int().optional(),
  hitterId: flexibleIdValidator.optional(),
  receiverId: flexibleIdValidator.optional(),
  courtSide: z.enum(["deuce", "ad"]).optional(),
  annotations: z
    .object({
      zone: z.string().optional(),
      stroke: z.string().optional(),
      note: z.string().max(500).optional(),
      rallyDetails: RallyDetailsSchema.optional(),
      rallyLength: z.number().int().optional(),
      isFirstServe: z.boolean().optional(),
      isSecondServe: z.boolean().optional(),
      hitterId: flexibleIdValidator.optional(),
      receiverId: flexibleIdValidator.optional(),
      courtSide: z.enum(["deuce", "ad"]).optional(),
      firstFaultDetail: z
        .object({
          errorType: z.string().optional(),
          serveEffect: z.string().optional(),
          direction: z.string().optional(),
        })
        .optional(),
    })
    .optional(),
});
export type PointFlowInput = z.infer<typeof PointFlowInputSchema>;

export const QueuedActionSchema = z.object({
  id: z.string().uuid(),
  matchId: z.string().cuid(),
  type: z.literal("POINT"),
  payload: PointFlowInputSchema,
  timestamp: z.number(),
  retries: z.number().int().min(0).default(0),
  status: z.enum(["PENDING", "SYNCING", "FAILED"]),
});
export type QueuedAction = z.infer<typeof QueuedActionSchema>;
