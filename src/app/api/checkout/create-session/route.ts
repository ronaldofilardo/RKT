import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequestScoped } from '@/lib/auth';
import { validatedRequest } from '@/lib/api.logic';
import { reportApiError } from '@/lib/api.logic';
import { CheckoutSessionSchema } from '@/schemas/checkout';
import { processCheckoutSession } from './checkout-session.logic';

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequestScoped(request);
    if (!user) {
      return NextResponse.json(
        { error: 'UNAUTHORIZED', message: 'Token de acesso requerido.' },
        { status: 401 },
      );
    }

    const input = await validatedRequest(request, CheckoutSessionSchema);
    const result = await processCheckoutSession(user.id, input);

    return NextResponse.json({ ok: true, data: result }, { status: 201 });
  } catch (error) {
    return reportApiError(error);
  }
}
