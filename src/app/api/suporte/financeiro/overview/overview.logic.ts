import { prisma } from '@/lib/prisma';
import { BILLING_PLANS } from '@/core/billing/billing-plans';

export async function getFinancialOverviewLogic() {
  const [subs, totalUsers, invoices] = await Promise.all([
    prisma.subscription.findMany({ select: { status: true, planTier: true, cycle: true } }),
    prisma.user.count(),
    prisma.invoice.findMany({ select: { status: true, value: true } }),
  ]);

  const activeSubs = subs.filter((s) => s.status === 'ACTIVE');
  const pastDueSubs = subs.filter((s) => s.status === 'PAST_DUE');
  const canceledSubs = subs.filter((s) => s.status === 'CANCELED');
  const trialSubs = subs.filter((s) => s.status === 'TRIAL');

  const usersInTrial = Math.max(0, totalUsers - activeSubs.length - pastDueSubs.length);

  const estimatedMrr = activeSubs.reduce((acc, sub) => {
    const p = BILLING_PLANS.find((item) => item.id === sub.planTier);
    if (!p) return acc;
    return acc + (sub.cycle === 'YEARLY' ? p.yearlyPrice / 12 : p.monthlyPrice);
  }, 0);

  const paidInvoices = invoices.filter((i) => i.status === 'CONFIRMED' || i.status === 'RECEIVED');
  const totalPaidRevenue = paidInvoices.reduce((acc, i) => acc + Number(i.value), 0);

  return {
    inTrial: usersInTrial + trialSubs.length,
    active: activeSubs.length,
    pastDue: pastDueSubs.length,
    suspended: canceledSubs.length,
    estimatedMrr: Number(estimatedMrr.toFixed(2)),
    totalPaidRevenue: Number(totalPaidRevenue.toFixed(2)),
  };
}
