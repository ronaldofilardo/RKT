import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { decodeJwtPayload } from '@/lib/jwt-client';

function homeForJwtClaims(decoded: { role?: string | null; pp?: string | null; mk?: string | null }): string {
  if (decoded.pp === 'ADMIN' || decoded.role === 'ADMIN') return '/admin';
  if (decoded.pp === 'SUPORTE') return '/suporte';
  if (decoded.mk === 'GESTOR') return '/gestor';
  if (decoded.mk === 'TREINADOR') return '/dashboard';
  return '/login';
}

export async function handleAuthenticated(
  request: NextRequest,
  requestHeaders: Headers,
): Promise<NextResponse> {
  const { pathname } = request.nextUrl;
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

  requestHeaders.set('x-user-id', decoded.sub);
  requestHeaders.set('x-user-role', decoded.role);
  if (decoded.sv !== undefined) requestHeaders.set('x-user-sv', String(decoded.sv));
  if (decoded.mcp !== undefined) requestHeaders.set('x-user-mcp', String(decoded.mcp));

  // Se deve trocar senha provisória, só permite /trocar-senha
  if (decoded.mcp === true && pathname !== '/trocar-senha' && !pathname.startsWith('/api/')) {
    return NextResponse.redirect(new URL('/trocar-senha', request.url));
  }

  // Roteamento por perfil quando já autenticado e acessa /login
  if (pathname === '/login') {
    return NextResponse.redirect(new URL(homeForJwtClaims(decoded), request.url));
  }

  if (pathname.startsWith('/admin') && decoded.role !== 'ADMIN' && decoded.pp !== 'ADMIN') {
    const target = homeForJwtClaims(decoded);
    if (target === '/login') return NextResponse.next({ request: { headers: requestHeaders } });
    return NextResponse.redirect(new URL(target, request.url));
  }

  if (pathname.startsWith('/suporte') && decoded.pp !== 'SUPORTE' && decoded.pp !== 'ADMIN') {
    const target = homeForJwtClaims(decoded);
    if (target === '/login') return NextResponse.next({ request: { headers: requestHeaders } });
    return NextResponse.redirect(new URL(target, request.url));
  }

  if (pathname.startsWith('/gestor') && decoded.mk !== 'GESTOR' && decoded.pp !== 'SUPORTE' && decoded.pp !== 'ADMIN') {
    const target = homeForJwtClaims(decoded);
    if (target === '/login') return NextResponse.next({ request: { headers: requestHeaders } });
    return NextResponse.redirect(new URL(target, request.url));
  }

  return NextResponse.next({ request: { headers: requestHeaders } });
}

function getAuthToken(request: Pick<NextRequest, 'headers' | 'cookies'>) {
  const authHeader = request.headers.get('authorization');
  let bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;
  if (bearerToken === 'null' || bearerToken === 'undefined') {
    bearerToken = null;
  }
  return (
    bearerToken ??
    request.cookies.get('rkt_access_token')?.value ??
    request.cookies.get('access_token')?.value ??
    null
  );
}
