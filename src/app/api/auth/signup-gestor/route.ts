import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { reportApiError, validatedRequest } from '@/lib/api.logic';
import { GestorSignupSchema } from '@/lib/validators/gestor-signup.schema';
import { checkRateLimit } from '../signup-gestor-logic';
import { createGestorClub } from '../signup-gestor-service';

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    const rateLimit = checkRateLimit(ip);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'RATE_LIMIT', message: `Muitas tentativas. Tente novamente em ${rateLimit.retryAfter}s` },
        { status: 429 },
      );
    }

    const body = await validatedRequest(request, GestorSignupSchema);
    const result = await createGestorClub({ ...body, sameAsLegalRep: body.sameAsLegalRep ?? false });

    if ('error' in result) {
      return NextResponse.json({ error: result.error, message: result.message }, { status: result.status as number });
    }

    return NextResponse.json({
      message: 'Clube cadastrado com sucesso. Aguarde a aprovação do Suporte.',
      clubId: result.clubId,
      slug: result.slug,
      status: result.status,
    }, { status: 201 });
  } catch (error) {
    logger.error('[SIGNUP-GESTOR POST]', error);
    return reportApiError(error);
  }
}
