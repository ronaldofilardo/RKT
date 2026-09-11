import { NextResponse } from 'next/server';

export async function POST() {
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

  response.cookies.set('rkt_access_token', '', {
    ...baseCookieOptions,
    httpOnly: true,
  });

  response.cookies.set('access_token', '', {
    ...baseCookieOptions,
    httpOnly: false,
  });

  response.cookies.set('user_role', '', {
    ...baseCookieOptions,
    httpOnly: false,
  });

  return response;
}
