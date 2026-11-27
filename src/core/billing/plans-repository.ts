import { prisma } from '@/lib/prisma';
import { BILLING_PLANS } from './billing-plans';
import type { PlanDefinition, BillingTarget, PlanTier } from '@/types/billing';

export interface UpsertPlanInput {
  tierCode: string;
  name: string;
  target: BillingTarget;
  monthlyPrice: number;
  yearlyPrice: number;
  quotaAthletes?: number | null;
  quotaCoaches?: number | null;
  quotaMatches?: number | null;
  extraAthletePrice?: number | null;
  extraCoachPrice?: number | null;
  tooltip?: string;
  features?: Array<{ title: string; included: boolean }>;
  isActive?: boolean;
}

export function mapDbPlanToDefinition(record: any): PlanDefinition {
  return {
    id: record.tierCode as PlanTier,
    name: record.name,
    target: record.target as BillingTarget,
    monthlyPrice: Number(record.monthlyPrice),
    yearlyPrice: Number(record.yearlyPrice),
    quotaAthletes: record.quotaAthletes ?? null,
    quotaCoaches: record.quotaCoaches ?? null,
    quotaMatches: record.quotaMatches ?? null,
    extraAthletePrice: record.extraAthletePrice ? Number(record.extraAthletePrice) : undefined,
    extraCoachPrice: record.extraCoachPrice ? Number(record.extraCoachPrice) : undefined,
    tooltip: record.tooltip || '',
    features: Array.isArray(record.features) ? record.features : [],
    isActive: record.isActive ?? true,
  };
}

export async function fetchAllPlans(): Promise<PlanDefinition[]> {
  try {
    if (!prisma.plan?.findMany) return BILLING_PLANS;
    const dbPlans = await prisma.plan.findMany({
      where: { isActive: true },
      orderBy: { monthlyPrice: 'asc' },
    });
    if (dbPlans.length > 0) return dbPlans.map(mapDbPlanToDefinition);

    for (const p of BILLING_PLANS) {
      await prisma.plan.create({
        data: {
          tierCode: p.id,
          name: p.name,
          target: p.target,
          monthlyPrice: p.monthlyPrice,
          yearlyPrice: p.yearlyPrice,
          quotaAthletes: p.quotaAthletes,
          quotaCoaches: p.quotaCoaches,
          quotaMatches: p.quotaMatches,
          extraAthletePrice: p.extraAthletePrice,
          extraCoachPrice: p.extraCoachPrice,
          tooltip: p.tooltip,
          features: p.features as any,
          isActive: true,
        },
      }).catch(() => null);
    }
    const seeded = await prisma.plan.findMany({ orderBy: { monthlyPrice: 'asc' } });
    return seeded.length > 0 ? seeded.map(mapDbPlanToDefinition) : BILLING_PLANS;
  } catch {
    return BILLING_PLANS;
  }
}

export async function savePlan(input: UpsertPlanInput): Promise<PlanDefinition> {
  const data = {
    name: input.name,
    target: input.target,
    monthlyPrice: input.monthlyPrice,
    yearlyPrice: input.yearlyPrice,
    quotaAthletes: input.quotaAthletes ?? null,
    quotaCoaches: input.quotaCoaches ?? null,
    quotaMatches: input.quotaMatches ?? null,
    extraAthletePrice: input.extraAthletePrice ?? null,
    extraCoachPrice: input.extraCoachPrice ?? null,
    tooltip: input.tooltip ?? '',
    features: input.features ?? [],
    isActive: input.isActive ?? true,
  };

  const updated = await prisma.plan.upsert({
    where: { tierCode: input.tierCode },
    update: data,
    create: { tierCode: input.tierCode, ...data },
  });

  return mapDbPlanToDefinition(updated);
}
