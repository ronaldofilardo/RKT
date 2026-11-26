import { prisma } from '@/lib/prisma';
import { BILLING_PLANS } from '@/core/billing/billing-plans';
import { buscarOuCriarCustomer } from '@/lib/asaas/asaas-customer.service';
import {
  criarAssinaturaAsaas,
  obterPrimeiraCobrancaAssinatura,
  obterQrCodePixAsaas,
} from '@/lib/asaas/asaas-subscription.service';
import { resolveCheckoutPayer } from './checkout-payer.logic';
import type { CheckoutSessionInput } from '@/schemas/checkout';

export async function processCheckoutSession(userId: string, input: CheckoutSessionInput) {
  const plan = BILLING_PLANS.find((p) => p.id === input.planTier);
  if (!plan) throw new Error('Plano selecionado inválido.');

  const value = input.cycle === 'MONTHLY' ? plan.monthlyPrice : plan.yearlyPrice;
  const payer = await resolveCheckoutPayer(userId, input.dependentPlayerId);

  const customer = await buscarOuCriarCustomer({
    name: payer.name,
    cpfCnpj: payer.cpfCnpj,
    email: payer.email,
    phone: payer.phone,
    externalReference: payer.externalReference,
  });

  const nextDueDate = new Date().toISOString().slice(0, 10);
  const asaasSub = await criarAssinaturaAsaas({
    customer: customer.id,
    billingType: input.billingType,
    value,
    nextDueDate,
    cycle: input.cycle,
    description: `RKT - ${plan.name} (${input.cycle === 'MONTHLY' ? 'Mensal' : 'Anual'})`,
    externalReference: payer.externalReference,
  });

  const cobranca = await obterPrimeiraCobrancaAssinatura(asaasSub.id);
  let pixData: { encodedImage: string; payload: string } | null = null;
  if (input.billingType === 'PIX' && cobranca?.id) {
    try {
      pixData = await obterQrCodePixAsaas(cobranca.id);
    } catch {
      // Ignora erro se pix já gerado ou não disponível de imediato
    }
  }

  const subscription = await prisma.subscription.create({
    data: {
      userId: payer.isCt ? null : userId,
      ctId: payer.isCt ? payer.ctId : null,
      planTier: plan.id,
      cycle: input.cycle,
      status: 'TRIAL',
      asaasCustomerId: customer.id,
      asaasSubscriptionId: asaasSub.id,
      invoices: cobranca
        ? {
            create: {
              asaasPaymentId: cobranca.id,
              value,
              dueDate: new Date(),
              status: 'PENDING',
              billingType: input.billingType,
              invoiceUrl: cobranca.invoiceUrl,
              bankSlipUrl: cobranca.bankSlipUrl,
              pixCopiaECola: pixData?.payload,
              pixQrCodeBase64: pixData?.encodedImage,
            },
          }
        : undefined,
    },
    include: { invoices: true },
  });

  return {
    subscriptionId: subscription.id,
    asaasSubscriptionId: asaasSub.id,
    value,
    billingType: input.billingType,
    pix: pixData ? { qrCodeBase64: pixData.encodedImage, copiaECola: pixData.payload } : null,
    invoiceUrl: cobranca?.invoiceUrl ?? null,
  };
}
