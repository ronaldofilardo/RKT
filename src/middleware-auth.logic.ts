import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { decodeJwtPayload } from '@/lib/jwt-client';
import { getAuthToken } from './middleware-csrf.logic';
import { homeForArea } from '@/core/access/areas';
import { isAreaUrlsEnabled } from '@/lib/feature-flags';
import { resolveUserActiveArea, handleAreaRewriteOrRedirect } from './middleware-area.logic';

export async function handleAuthenticated(
  request: NextRequest,
  requestHeaders: Headers,
): Promise<NextResponse> {
  const { pathname } = request.nextUrl;
  const token = getAuthToken(request);

  if (!token) {
    if (pathname === '/login') {
      return NextResponse.next({ request: { headers: requestHeaders } });
    }
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { error: 'UNAUTHORIZED', message: 'Token de acesso requerido' },
        { status: 401 },
      );
    }
    const target = `${pathname}${request.nextUrl.search}`;
    return NextResponse.redirect(new URL(`/login?next=${encodeURIComponent(target)}`, request.url));
  }

  const decoded = await decodeJwtPayload(token);

  if (!decoded) {
    if (pathname === '/login') {
      return NextResponse.next({ request: { headers: requestHeaders } });
    }
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { error: 'UNAUTHORIZED', message: 'Token inválido ou expirado' },
        { status: 401 },
      );
    }
    const target = `${pathname}${request.nextUrl.search}`;
    return NextResponse.redirect(new URL(`/login?next=${encodeURIComponent(target)}`, request.url));
  }

  requestHeaders.set('x-user-id', decoded.sub);
  requestHeaders.set('x-user-role', decoded.role);
  if (decoded.sv !== undefined) requestHeaders.set('x-user-sv', String(decoded.sv));
  if (decoded.mcp !== undefined) requestHeaders.set('x-user-mcp', String(decoded.mcp));

  if (pathname === '/login' && (decoded.mcp === true || request.nextUrl?.searchParams?.get?.('exit') === '1')) {
    const res = NextResponse.next({ request: { headers: requestHeaders } });
    const cOpts = { path: '/', maxAge: 0, sameSite: 'lax' as const, secure: process.env.NODE_ENV === 'production' };
    res.cookies.set('rkt_access_token', '', { ...cOpts, httpOnly: true });
    res.cookies.set('access_token', '', cOpts);
    res.cookies.set('user_role', '', cOpts);
    return res;
  }

  // Se deve trocar senha provisória, só permite /trocar-senha
  if (decoded.mcp === true && pathname !== '/trocar-senha' && !pathname.startsWith('/api/')) {
    return NextResponse.redirect(new URL('/trocar-senha', request.url));
  }

  const activeArea = resolveUserActiveArea(decoded);

  // Roteamento por perfil quando já autenticado e acessa /login
  if (pathname === '/login') {
    return NextResponse.redirect(new URL(homeForArea(activeArea), request.url));
  }

  // Roteamento de áreas ativas (reescrita transparente ou 307 de legado)
  if (!pathname.startsWith('/api/') && isAreaUrlsEnabled()) {
    const areaResponse = handleAreaRewriteOrRedirect(request, decoded, requestHeaders);
    if (areaResponse) return areaResponse;
  }

  if (pathname.startsWith('/admin') && activeArea !== 'ADMIN') {
    if (!decoded.pp && !decoded.mk && !decoded.ax && decoded.role !== 'ADMIN') {
      return NextResponse.next({ request: { headers: requestHeaders } });
    }
    return NextResponse.redirect(new URL(homeForArea(activeArea), request.url));
  }

  if (pathname.startsWith('/suporte') && activeArea !== 'SUPORTE' && activeArea !== 'ADMIN') {
    return NextResponse.redirect(new URL(homeForArea(activeArea), request.url));
  }

  if (pathname.startsWith('/gestor') && activeArea !== 'GESTOR' && activeArea !== 'SUPORTE' && activeArea !== 'ADMIN') {
    return NextResponse.redirect(new URL(homeForArea(activeArea), request.url));
  }

  return NextResponse.next({ request: { headers: requestHeaders } });
}
