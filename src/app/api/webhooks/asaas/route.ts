import { NextRequest, NextResponse } from 'next/server';
import { getAsaasWebhookToken } from '@/lib/asaas/asaas-config';
import { safeCompareTokens } from '@/lib/asaas/asaas-webhook-auth';
import { checkAndRecordWebhookEvent } from './webhook-dedup.logic';
import { processWebhookPaymentEvent } from './webhook-payment.logic';
import { processWebhookSubscriptionEvent } from './webhook-subscription.logic';
import type { AsaasWebhookPayload } from './webhook-dedup.logic';

export async function POST(req: NextRequest) {
  const tokenEsperado = getAsaasWebhookToken();
  const tokenRecebido = (req.headers.get('asaas-access-token') ?? '').trim();

  const isAutenticado =
    Boolean(tokenEsperado) &&
    Boolean(tokenRecebido) &&
    safeCompareTokens(tokenRecebido, tokenEsperado);

  if (!isAutenticado) {
    return NextResponse.json(
      { error: 'Token de webhook inválido ou não configurado.' },
      { status: 401 },
    );
  }

  const body = (await req.json().catch(() => null)) as AsaasWebhookPayload | null;
  if (!body?.event) {
    return NextResponse.json({ ok: true });
  }

  const { alreadyProcessed } = await checkAndRecordWebhookEvent(body);
  if (alreadyProcessed) {
    return NextResponse.json({ ok: true, repetido: true });
  }

  if (body.payment) {
    await processWebhookPaymentEvent(body.payment, body.event);
  } else if (body.subscription) {
    await processWebhookSubscriptionEvent(body.subscription, body.event);
  }

  return NextResponse.json({ ok: true });
}
