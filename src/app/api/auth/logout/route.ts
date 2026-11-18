import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth-credentials.logic';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const auth = await getUserFromRequest(request);
    if (auth?.id) {
      const userAgent = request.headers.get('user-agent') ?? 'unknown';
      void prisma.auditLog.create({
        data: {
          actorUserId: auth.id,
          action: 'USER_LOGOUT',
          resourceType: 'User',
          resourceId: auth.id,
          meta: { userAgent },
        },
      }).catch((err) => logger.warn('[LOGOUT AUDIT] Falha ao registrar log:', err));
    }
  } catch {
    // Ignora falha de auditoria para não travar o logout
  }

  const response = NextResponse.json({
    success: true,
    message: 'Logout realizado com sucesso',
  });

  const baseCookieOptions = {
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 0,
    path: '/',
  };

  response.cookies.set('rkt_access_token', '', { ...baseCookieOptions, httpOnly: true });
  response.cookies.set('access_token', '', { ...baseCookieOptions, httpOnly: false });
  response.cookies.set('user_role', '', { ...baseCookieOptions, httpOnly: false });

  return response;
}
