import { prisma } from '@/lib/prisma';

export async function listInvoicesFinancialLogic() {
  const invoices = await prisma.invoice.findMany({
    take: 100,
    orderBy: { createdAt: 'desc' },
    include: {
      subscription: {
        select: {
          planTier: true,
          cycle: true,
          user: { select: { id: true, name: true, email: true } },
          ct: { select: { id: true, name: true } },
        },
      },
    },
  });

  const items = invoices.map((inv) => ({
    id: inv.id,
    subscriptionId: inv.subscriptionId,
    asaasPaymentId: inv.asaasPaymentId,
    value: Number(inv.value),
    dueDate: inv.dueDate.toISOString().slice(0, 10),
    status: inv.status,
    billingType: inv.billingType ?? 'PIX',
    invoiceUrl: inv.invoiceUrl,
    bankSlipUrl: inv.bankSlipUrl,
    pixCopiaECola: inv.pixCopiaECola,
    paidAt: inv.paidAt?.toISOString() ?? null,
    createdAt: inv.createdAt.toISOString(),
    planTier: inv.subscription.planTier,
    payerName: inv.subscription.user?.name ?? inv.subscription.ct?.name ?? 'Não identificado',
    payerEmail: inv.subscription.user?.email ?? null,
  }));

  return { items, total: items.length };
}
