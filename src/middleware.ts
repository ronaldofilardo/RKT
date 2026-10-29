import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { enforceOriginCheck } from './middleware-csrf.logic';
import { handleAuthenticated } from './middleware-auth.logic';

const PUBLIC_ROUTES = [
  '/api/auth/login',
  '/api/auth/logout',
  '/api/auth/signup',
  '/api/auth/signup-gestor',
  '/api/auth/forgot',
  '/api/auth/reset-password',
  '/login',
  '/matches/locate',
];

const BYPASS_ROUTES = ['/_next/', '/favicon'];

export { getAuthToken } from './middleware-csrf.logic';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === '/') {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Higieniza headers: remove quaisquer headers x-user-* forjados pelo cliente
  const requestHeaders = new Headers(request.headers);
  requestHeaders.delete('x-user-id');
  requestHeaders.delete('x-user-role');
  requestHeaders.delete('x-user-sv');
  requestHeaders.delete('x-user-mcp');

  const csrfViolation = enforceOriginCheck(request);
  if (csrfViolation) return csrfViolation;

  const isPublic = PUBLIC_ROUTES.some((route) => pathname.startsWith(route));
  if (isPublic) {
    if (pathname === '/login') {
      return handleAuthenticated(request, requestHeaders);
    }
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  const isBypass = BYPASS_ROUTES.some((route) => pathname.startsWith(route));
  if (isBypass) return NextResponse.next();

  return handleAuthenticated(request, requestHeaders);
}

export const config = {
  matcher: [
    '/',
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
    '/trocar-senha/:path*',
    '/gestor/:path*',
    '/suporte/:path*',
  ],
};
