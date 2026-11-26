import { prisma } from '@/lib/prisma';

export interface AsaasWebhookPayload {
  id?: string;
  event: string;
  payment?: {
    id: string;
    subscription?: string;
    status: string;
    value: number;
    dueDate: string;
    billingType?: string;
    invoiceUrl?: string;
    bankSlipUrl?: string;
    externalReference?: string;
  };
  subscription?: {
    id: string;
    status: string;
  };
}

export async function checkAndRecordWebhookEvent(
  body: AsaasWebhookPayload,
): Promise<{ alreadyProcessed: boolean }> {
  const asaasEventId =
    body.id ||
    (body.payment?.id
      ? `${body.event}:${body.payment.id}:${body.payment.status}`
      : body.subscription?.id
      ? `${body.event}:${body.subscription.id}`
      : `${body.event}:${Date.now()}`);

  const existing = await prisma.asaasWebhookEvent.findUnique({
    where: { asaasEventId },
  });

  if (existing?.processedAt) {
    return { alreadyProcessed: true };
  }

  if (!existing) {
    await prisma.asaasWebhookEvent.create({
      data: {
        asaasEventId,
        eventType: body.event,
        payloadJson: body as any,
        processedAt: new Date(),
      },
    });
  }

  return { alreadyProcessed: false };
}
