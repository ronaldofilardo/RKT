import { NextRequest, NextResponse } from 'next/server';
import { SignJWT } from 'jose';
import { LoginPayloadSchema } from '@/schemas/contracts';
import { validatedRequest, handleApiError } from '@/lib/api-helpers';
import { authenticateUser } from './authenticate';
import { logger } from '@/lib/logger';

const JWT_SECRET = process.env.JWT_SECRET;

const secretKey = JWT_SECRET ? new TextEncoder().encode(JWT_SECRET) : null;

async function generateToken(
  userId: string,
  role: string,
): Promise<string> {
  if (!secretKey) {
    throw new Error('JWT_SECRET is not defined in environment');
  }
  return new SignJWT({ sub: userId, role })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('2h')
    .sign(secretKey);
}

export async function POST(request: NextRequest) {
  try {
    const payload = await validatedRequest(request, LoginPayloadSchema);
    const identifier = (payload.identifier || payload.email || '').trim();
    const ip = request.headers.get('x-forwarded-for') || 'unknown';

    if (process.env.ENABLE_LOGIN_RATELIMIT === 'true') {
      const fiveMinsAgo = new Date(Date.now() - 5 * 60 * 1000);
      const recentFails = await import('@/lib/prisma').then((m) => m.prisma.loginAttempt.count({
        where: { ip, success: false, createdAt: { gte: fiveMinsAgo } }
      })).catch(() => 0);

      if (recentFails > 3) {
        const delayMs = Math.min((recentFails - 3) * 1000, 8000);
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }

    const user = await authenticateUser(identifier, payload.password);

    if (process.env.ENABLE_LOGIN_RATELIMIT === 'true') {
      await import('@/lib/prisma').then((m) => m.prisma.loginAttempt.create({
        data: { ip, cpf: identifier, success: !!user }
      })).catch(() => {});
    }

    if (!user) {
      logger.warn('[LOGIN POST] credenciais inválidas');
      return NextResponse.json(
        { error: 'UNAUTHORIZED', message: 'E-mail, CPF ou senha inválidos' },
        { status: 401 },
      );
    }

    const accessToken = await generateToken(user.id, user.role);

    const response = NextResponse.json({
      accessToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        cpf: user.cpf,
        role: user.role,
      },
    });

    response.cookies.set('rkt_access_token', accessToken, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 2,
      path: '/',
    });
    
    return response;
  } catch (error) {
    logger.error('[LOGIN POST]', error);
    return handleApiError(error);
  }
}