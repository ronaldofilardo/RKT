import { prisma } from '@/lib/prisma';

export async function checkPixPaymentStatus(subscriptionId: string) {
  const subscription = await prisma.subscription.findUnique({
    where: { id: subscriptionId },
    select: {
      status: true,
      invoices: {
        orderBy: { createdAt: 'desc' },
        take: 1,
        select: { status: true, paidAt: true },
      },
    },
  });

  if (!subscription) return null;

  const invoice = subscription.invoices[0];
  const isPaid =
    subscription.status === 'ACTIVE' ||
    invoice?.status === 'CONFIRMED' ||
    invoice?.status === 'RECEIVED';

  return {
    subscriptionStatus: subscription.status,
    invoiceStatus: invoice?.status ?? 'PENDING',
    isPaid,
  };
}
