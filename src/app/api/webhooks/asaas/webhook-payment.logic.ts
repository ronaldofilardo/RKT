import { prisma } from '@/lib/prisma';
import type { AsaasWebhookPayload } from './webhook-dedup.logic';

export async function processWebhookPaymentEvent(
  payment: NonNullable<AsaasWebhookPayload['payment']>,
  event: string,
) {
  const isPaid = event === 'PAYMENT_CONFIRMED' || event === 'PAYMENT_RECEIVED';
  const isOverdue = event === 'PAYMENT_OVERDUE';

  const subscription = payment.subscription
    ? await prisma.subscription.findUnique({
        where: { asaasSubscriptionId: payment.subscription },
      })
    : null;

  if (subscription && isPaid) {
    await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        status: 'ACTIVE',
        pastDueSince: null,
      },
    });
  }

  if (subscription && isOverdue) {
    await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        pastDueSince: subscription.pastDueSince ?? new Date(),
      },
    });
  }

  // Atualiza ou cria a fatura local
  const existingInvoice = await prisma.invoice.findUnique({
    where: { asaasPaymentId: payment.id },
  });

  if (existingInvoice) {
    const jaEstavaPaga =
      existingInvoice.status === 'CONFIRMED' || existingInvoice.status === 'RECEIVED';

    // Regra de não-regressão: se já paga, não volta a pendente
    if (jaEstavaPaga && !isPaid) {
      return;
    }

    await prisma.invoice.update({
      where: { id: existingInvoice.id },
      data: {
        status: payment.status,
        invoiceUrl: payment.invoiceUrl ?? existingInvoice.invoiceUrl,
        bankSlipUrl: payment.bankSlipUrl ?? existingInvoice.bankSlipUrl,
        ...(isPaid ? { paidAt: new Date() } : {}),
      },
    });
  } else if (subscription) {
    await prisma.invoice.create({
      data: {
        subscriptionId: subscription.id,
        asaasPaymentId: payment.id,
        value: payment.value,
        dueDate: new Date(payment.dueDate),
        status: payment.status,
        billingType: payment.billingType,
        invoiceUrl: payment.invoiceUrl,
        bankSlipUrl: payment.bankSlipUrl,
        ...(isPaid ? { paidAt: new Date() } : {}),
      },
    });
  }
}
