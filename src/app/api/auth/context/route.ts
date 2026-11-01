import { NextRequest, NextResponse } from 'next/server';
import { getAccessUserFromRequest } from '@/lib/auth-credentials.logic';
import { reportApiError } from '@/lib/api.logic';
import { switchUserContext } from './context.logic';
import { z } from 'zod';

const SwitchContextSchema = z.object({
  contextId: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const user = await getAccessUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'UNAUTHORIZED', message: 'Token requerido' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const parsed = SwitchContextSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'BAD_REQUEST', message: 'contextId é obrigatório' }, { status: 400 });
    }

    const result = await switchUserContext(user.id, parsed.data.contextId);
    if (!result.success) {
      return NextResponse.json(
        { error: 'FORBIDDEN', message: 'Contexto inválido ou não autorizado' },
        { status: 403 },
      );
    }

    const response = NextResponse.json({
      success: true,
      accessToken: result.accessToken,
      context: result.context,
    });

    response.cookies.set('rkt_access_token', result.accessToken, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 2,
      path: '/',
    });

    return response;
  } catch (error) {
    return reportApiError(error);
  }
}

