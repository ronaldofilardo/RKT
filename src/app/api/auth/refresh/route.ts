import { NextRequest, NextResponse } from 'next/server';
import { getAuthToken } from '@/middleware';
import { logger } from '@/lib/logger';
import { isSessionCurrent } from '@/lib/session-version.logic';
import { verifyRefreshToken, generateRefreshToken } from './refresh-token.logic';

export async function POST(request: NextRequest) {
  try {
    const token = getAuthToken(request);
    if (!token) {
      return NextResponse.json({ error: 'UNAUTHORIZED', message: 'Token de acesso requerido' }, { status: 401 });
    }

    const decoded = await verifyRefreshToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'UNAUTHORIZED', message: 'Token inválido ou expirado' }, { status: 401 });
    }

    if (!(await isSessionCurrent(decoded.sub, decoded.sv))) {
      return NextResponse.json({ error: 'UNAUTHORIZED', message: 'Sessão encerrada' }, { status: 401 });
    }

    const accessToken = await generateRefreshToken(decoded);
    const response = NextResponse.json({ accessToken });

    const cookieOpts = {
      sameSite: 'lax' as const,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 2,
      path: '/',
    };
    response.cookies.set('rkt_access_token', accessToken, { ...cookieOpts, httpOnly: true });
    response.cookies.set('access_token', accessToken, { ...cookieOpts, httpOnly: false });

    return response;
  } catch (error) {
    logger.error('[REFRESH POST]', error);
    return NextResponse.json({ error: 'INTERNAL_ERROR', message: 'Erro interno do servidor' }, { status: 500 });
  }
}
