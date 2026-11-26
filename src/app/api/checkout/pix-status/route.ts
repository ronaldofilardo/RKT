import { NextRequest, NextResponse } from 'next/server';
import { checkPixPaymentStatus } from './pix-status.logic';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const subscriptionId = searchParams.get('subscriptionId');

  if (!subscriptionId) {
    return NextResponse.json(
      { error: 'BAD_REQUEST', message: 'Parâmetro subscriptionId é obrigatório.' },
      { status: 400 },
    );
  }

  const result = await checkPixPaymentStatus(subscriptionId);
  if (!result) {
    return NextResponse.json(
      { error: 'NOT_FOUND', message: 'Assinatura não encontrada.' },
      { status: 404 },
    );
  }

  return NextResponse.json({ ok: true, ...result });
}
