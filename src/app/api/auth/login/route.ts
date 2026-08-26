import { NextRequest, NextResponse } from 'next/server';
import { SignJWT } from 'jose';
import bcrypt from 'bcryptjs';
import { LoginPayloadSchema } from '@/schemas/contracts';
import { validatedRequest, handleApiError } from '@/lib/api-helpers';
import { findPlayerByEmail } from '@/services/playerService';
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
    const { email, password } = await validatedRequest(request, LoginPayloadSchema);

    const player = await findPlayerByEmail(email);

    if (!player || !(await bcrypt.compare(password, player.passwordHash))) {
      logger.warn('[LOGIN POST] credenciais inválidas');
      return NextResponse.json(
        { error: 'UNAUTHORIZED', message: 'Email ou senha inválidos' },
        { status: 401 },
      );
    }

    const accessToken = await generateToken(player.id, player.role);

    const response = NextResponse.json({
      accessToken,
      refreshToken: 'hardcoded-refresh',
      user: {
        id: player.id,
        name: player.name,
        email: player.email,
        role: player.role,
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