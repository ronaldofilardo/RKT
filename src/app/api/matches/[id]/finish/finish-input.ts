import { FinishMatchInputSchema } from '@/schemas/contracts';

export function parseFinishMatchInput(body: unknown) {
  return FinishMatchInputSchema.safeParse(body);
}
