import { z } from "zod";

export const StartSessionInputSchema = z.object({
  autoStarted: z.boolean().optional(),
});
export type StartSessionInput = z.infer<typeof StartSessionInputSchema>;
