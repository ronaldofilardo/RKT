import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { decodeJwtPayload } from '@/lib/jwt-client';

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

  if (pathname.startsWith('/admin') && decoded.role !== 'ADMIN') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
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
