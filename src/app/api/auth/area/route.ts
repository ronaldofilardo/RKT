import { NextRequest, NextResponse } from 'next/server';
import { getAccessUserFromRequest } from '@/lib/auth-credentials.logic';
import { reportApiError } from '@/lib/api.logic';
import { switchUserArea } from './area-switch.logic';
import type { AreaCode } from '@/core/access/areas';
import { z } from 'zod';

const SwitchAreaSchema = z.object({
  area: z.enum([
    'ADMIN',
    'SUPORTE',
    'GESTOR',
    'TREINADOR_CLUBE',
    'TREINADOR_AVULSO',
    'ATLETA',
    'ANOTADOR',
    'ESPECTADOR',
  ]),
  ctId: z.string().optional().nullable(),
});

export async function POST(request: NextRequest) {
  try {
    const user = await getAccessUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'UNAUTHORIZED', message: 'Token requerido' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const parsed = SwitchAreaSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'BAD_REQUEST', message: 'Área inválida' }, { status: 400 });
    }

    const result = await switchUserArea(user.id, parsed.data.area as AreaCode, parsed.data.ctId);
    if (!result.success || !result.accessToken) {
      return NextResponse.json({ error: 'FORBIDDEN', message: 'Área não autorizada para o usuário' }, { status: 403 });
    }

    const response = NextResponse.json({
      success: true,
      accessToken: result.accessToken,
      area: result.area,
      prefix: result.prefix,
      home: result.home,
    });

    const cookieOpts = {
      sameSite: 'lax' as const,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 2,
      path: '/',
    };
    response.cookies.set('rkt_access_token', result.accessToken, { ...cookieOpts, httpOnly: true });
    response.cookies.set('access_token', result.accessToken, { ...cookieOpts, httpOnly: false });
    const userRoleValue = parsed.data.area.startsWith('TREINADOR') ? 'TREINADOR' : parsed.data.area;
    response.cookies.set('user_role', userRoleValue, { ...cookieOpts, httpOnly: false });

    return response;
  } catch (error) {
    return reportApiError(error);
  }
}

