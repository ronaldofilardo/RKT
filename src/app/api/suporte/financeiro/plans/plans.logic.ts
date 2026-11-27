import { z } from 'zod';
import { fetchAllPlans, savePlan } from '@/core/billing/plans-repository';

export const UpsertPlanSchema = z.object({
  tierCode: z.string().min(2),
  name: z.string().min(2),
  target: z.enum(['ATLETA_INDEPENDENTE', 'TREINADOR_PARTICULAR', 'GESTOR_CT']),
  monthlyPrice: z.number().nonnegative(),
  yearlyPrice: z.number().nonnegative(),
  quotaAthletes: z.number().nullable().optional(),
  quotaCoaches: z.number().nullable().optional(),
  quotaMatches: z.number().nullable().optional(),
  extraAthletePrice: z.number().nullable().optional(),
  extraCoachPrice: z.number().nullable().optional(),
  tooltip: z.string().default(''),
  features: z.array(z.object({ title: z.string(), included: z.boolean() })).default([]),
  isActive: z.boolean().default(true),
});

export type UpsertPlanDto = z.infer<typeof UpsertPlanSchema>;

export async function listAllPlansLogic() {
  const items = await fetchAllPlans();
  return { items };
}

export async function updateOrCreatePlanLogic(input: UpsertPlanDto) {
  const saved = await savePlan(input);
  return { ok: true, plan: saved };
}
