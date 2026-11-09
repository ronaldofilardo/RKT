import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import type { DecodedJwt } from '@/lib/jwt-client';
import { AREA_PREFIXES, prefixForArea, type AreaCode } from '@/core/access/areas';
import { appPath, isNeutralRoute } from '@/core/access/app-path.logic';

export const LEGACY_UNPREFIXED_ROUTES = [
  '/dashboard',
  '/painel',
  '/partidasaovivo',
  '/partidasanotadas',
  '/aguardandoanotador',
  '/historico',
  '/atletas',
  '/match',
  '/relatorios',
];

export function resolveUserActiveArea(decoded: DecodedJwt): AreaCode {
  if (decoded.ax && decoded.ax in AREA_PREFIXES) {
    return decoded.ax as AreaCode;
  }
  if (decoded.role === 'ADMIN' || decoded.pp === 'ADMIN') return 'ADMIN';
  if (decoded.pp === 'SUPORTE') return 'SUPORTE';
  if (decoded.mk === 'GESTOR') return 'GESTOR';
  if (decoded.mk === 'TREINADOR') {
    return decoded.cx === 'PARTICULAR' ? 'TREINADOR_AVULSO' : 'TREINADOR_CLUBE';
  }
  return 'ATLETA';
}

export function mapPrefixedToInternalRoute(pathname: string, areaCode: AreaCode): string | null {
  const prefix = prefixForArea(areaCode);
  if (pathname === prefix) {
    if (areaCode === 'GESTOR') return '/gestor';
    if (areaCode === 'ADMIN' || areaCode === 'SUPORTE') return pathname;
    return '/dashboard';
  }
  if (pathname.startsWith(`${prefix}/`)) {
    const subpath = pathname.slice(prefix.length);
    if (areaCode === 'ADMIN' || areaCode === 'SUPORTE') return pathname;
    return subpath;
  }
  return null;
}

export function handleAreaRewriteOrRedirect(
  request: NextRequest,
  decoded: DecodedJwt,
  requestHeaders: Headers,
): NextResponse | null {
  const { pathname, search } = request.nextUrl;
  if (isNeutralRoute(pathname)) return null;

  const activeArea = resolveUserActiveArea(decoded);
  const internalRoute = mapPrefixedToInternalRoute(pathname, activeArea);
  if (internalRoute) {
    requestHeaders.set('x-active-area', activeArea);
    if (decoded.ct) requestHeaders.set('x-active-ct', decoded.ct);
    if (internalRoute === pathname) {
      return NextResponse.next({ request: { headers: requestHeaders } });
    }
    const url = typeof request.nextUrl?.clone === 'function'
      ? request.nextUrl.clone()
      : new URL(request.url);
    url.pathname = internalRoute;
    return NextResponse.rewrite(url, { request: { headers: requestHeaders } });
  }

  const isLegacy = LEGACY_UNPREFIXED_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`));
  if (isLegacy) {
    const targetUrl = new URL(appPath(activeArea, `${pathname}${search}`), request.url);
    return NextResponse.redirect(targetUrl, 307);
  }

  const otherCode = (Object.keys(AREA_PREFIXES) as AreaCode[]).find((code) => {
    const p = AREA_PREFIXES[code];
    return pathname === p || pathname.startsWith(`${p}/`);
  });

  if (otherCode && otherCode !== activeArea) {
    const targetUrl = new URL(appPath(activeArea, pathname.replace(AREA_PREFIXES[otherCode], '') || '/'), request.url);
    return NextResponse.redirect(targetUrl, 307);
  }

  return null;
}

