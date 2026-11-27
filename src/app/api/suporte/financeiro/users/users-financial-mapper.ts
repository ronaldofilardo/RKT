import { calculateBillingState } from '@/core/billing/quota-engine.logic';
import { BILLING_PLANS } from '@/core/billing/billing-plans';

export interface RawFinancialUserData {
  id: string;
  name: string;
  email: string;
  cpf: string | null;
  role: string;
  createdAt: Date;
  matchesCount: number;
  clubName: string | null;
  isLinkedToPayingEntity: boolean;
  subscription: any | null;
}

export function mapUserFinancialStatus(user: RawFinancialUserData) {
  const sub = user.subscription;
  const plan = sub ? BILLING_PLANS.find((p) => p.id === sub.planTier) : null;
  const quota = calculateBillingState({
    role: user.role,
    isLinkedToPayingEntity: user.isLinkedToPayingEntity,
    hasActivePaidPlan: sub?.status === 'ACTIVE',
    matchesCount: user.matchesCount,
    accountCreatedAt: user.createdAt,
  });

  const finalStatus = sub?.status ?? quota.status;
  const lastInvoice = sub?.invoices?.[0];

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    cpf: user.cpf,
    role: user.role,
    createdAt: user.createdAt.toISOString(),
    clubName: user.clubName,
    status: finalStatus,
    planTier: sub?.planTier ?? null,
    planName: plan?.name ?? (sub ? sub.planTier : 'Degustação Gratuita'),
    cycle: sub?.cycle ?? null,
    billingType: lastInvoice?.billingType ?? null,
    monthlyFee: plan ? (sub?.cycle === 'YEARLY' ? plan.yearlyPrice / 12 : plan.monthlyPrice) : 0,
    dueDate: sub?.currentPeriodEnd?.toISOString() ?? lastInvoice?.dueDate?.toISOString() ?? null,
    matchesUsed: quota.matchesUsed,
    matchesLimit: quota.matchesLimit,
    daysRemaining: quota.daysRemaining,
    canCreateMatch: quota.canCreateMatch,
    message: quota.message,
  };
}
