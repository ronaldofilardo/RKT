import { prisma } from '@/lib/prisma';
import type { AsaasWebhookPayload } from './webhook-dedup.logic';

export async function processWebhookSubscriptionEvent(
  subscriptionData: NonNullable<AsaasWebhookPayload['subscription']>,
  event: string,
) {
  const subscription = await prisma.subscription.findUnique({
    where: { asaasSubscriptionId: subscriptionData.id },
  });

  if (!subscription) return;

  if (event === 'SUBSCRIPTION_DELETED') {
    await prisma.subscription.update({
      where: { id: subscription.id },
      data: { status: 'CANCELED' },
    });
  } else if (event === 'SUBSCRIPTION_UPDATED' && subscriptionData.status === 'ACTIVE') {
    await prisma.subscription.update({
      where: { id: subscription.id },
      data: { status: 'ACTIVE', pastDueSince: null },
    });
  }
}
