import { AREA_PREFIXES, prefixForArea, type AreaCode } from './areas';

const NEUTRAL_EXACT_ROUTES = new Set([
  '/login',
  '/signup',
  '/forgot',
  '/trocar-senha',
  '/dados-pessoais',
  '/termos',
  '/privacidade',
  '/escolher-area',
]);

const NEUTRAL_PREFIX_ROUTES = ['/api/', '/matches/', '/_next/', '/favicon', '/admin', '/suporte'];

export function isNeutralRoute(pathname: string): boolean {
  if (NEUTRAL_EXACT_ROUTES.has(pathname)) return true;
  return NEUTRAL_PREFIX_ROUTES.some((prefix) => pathname.startsWith(prefix));
}

export function appPath(area: AreaCode | string | null | undefined, path: string): string {
  if (!path) return '/';
  if (isNeutralRoute(path)) return path;

  if (!area) return path.startsWith('/') ? path : `/${path}`;

  const prefix = prefixForArea(area as AreaCode);
  const cleanPath = path.startsWith('/') ? path : `/${path}`;

  const queryIndex = cleanPath.indexOf('?');
  const pathname = queryIndex >= 0 ? cleanPath.slice(0, queryIndex) : cleanPath;
  const search = queryIndex >= 0 ? cleanPath.slice(queryIndex) : '';

  if (pathname === '/' || pathname === '/dashboard') {
    return `${prefix}${search}`;
  }

  if (area === 'GESTOR' && pathname === '/gestor') {
    return `${prefix}${search}`;
  }

  // Se o caminho já inicia com o prefixo exato da área
  if (pathname === prefix || pathname.startsWith(`${prefix}/`)) {
    return `${pathname}${search}`;
  }

  // Se o caminho inicia com o prefixo de outra área, substitui pelo prefixo da área atual
  for (const otherPrefix of Object.values(AREA_PREFIXES)) {
    if (pathname === otherPrefix) {
      return `${prefix}${search}`;
    }
    if (pathname.startsWith(`${otherPrefix}/`)) {
      const rest = pathname.slice(otherPrefix.length);
      return `${prefix}${rest}${search}`;
    }
  }

  return `${prefix}${pathname}${search}`;
}
