import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { decodeJwtPayload } from '@/lib/jwt-client';

const PUBLIC_ROUTES = [
  '/api/auth/login',
  '/login',
  '/matches/locate',
];

const BYPASS_ROUTES = ['/_next/', '/favicon'];

export function getAuthToken(request: Pick<NextRequest, 'headers' | 'cookies'>) {
  const authHeader = request.headers.get('authorization');
  return (
    authHeader?.replace('Bearer ', '') ??
    request.cookies.get('access_token')?.value ??
    null
  );
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isPublic = PUBLIC_ROUTES.some((route) => pathname.startsWith(route));
  if (isPublic) return NextResponse.next();

  const isBypass = BYPASS_ROUTES.some((route) => pathname.startsWith(route));
  if (isBypass) return NextResponse.next();

  const token = getAuthToken(request);

  if (!token) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { error: 'UNAUTHORIZED', message: 'Token de acesso requerido' },
        { status: 401 },
      );
    }
    return NextResponse.redirect(new URL('/login', request.url));
  }

  const decoded = await decodeJwtPayload(token);

  if (!decoded) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { error: 'UNAUTHORIZED', message: 'Token inválido ou expirado' },
        { status: 401 },
      );
    }
    return NextResponse.redirect(new URL('/login', request.url));
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-user-id', decoded.sub);
  requestHeaders.set('x-user-role', decoded.role);

  if (pathname.startsWith('/admin') && decoded.role !== 'ADMIN') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: [
    '/api/:path*',
    '/dashboard/:path*',
    '/admin/:path*',
    '/match/:path*',
    '/matches/:path*',
    '/historico/:path*',
    '/dados-pessoais/:path*',
    '/partidasanotadas/:path*',
    '/partidasaovivo/:path*',
    '/aguardandoanotador/:path*',
    '/atletas/:path*',
  ],
};