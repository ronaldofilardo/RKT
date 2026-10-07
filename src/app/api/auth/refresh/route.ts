import { NextRequest, NextResponse } from 'next/server';
import { SignJWT, jwtVerify } from 'jose';
import { getAuthToken } from '@/middleware';
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

async function verifyToken(token: string): Promise<{ sub: string; role: string } | null> {
  if (!secretKey) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey);
    const sub = payload.sub;
    const role = payload.role as string | undefined;
    if (!sub || !role) return null;
    return { sub, role };
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = getAuthToken(request);

    if (!token) {
      return NextResponse.json(
        { error: 'UNAUTHORIZED', message: 'Token de acesso requerido' },
        { status: 401 },
      );
    }

    const decoded = await verifyToken(token);

    if (!decoded) {
      return NextResponse.json(
        { error: 'UNAUTHORIZED', message: 'Token inválido ou expirado' },
        { status: 401 },
      );
    }

    const accessToken = await generateToken(decoded.sub, decoded.role);

    const response = NextResponse.json({ accessToken });

    response.cookies.set('rkt_access_token', accessToken, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 2,
      path: '/',
    });
    response.cookies.set('access_token', accessToken, {
      httpOnly: false,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 2,
      path: '/',
    });

    return response;
  } catch (error) {
    logger.error('[REFRESH POST]', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Erro interno do servidor' },
      { status: 500 },
    );
  }
}