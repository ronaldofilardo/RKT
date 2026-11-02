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

  if (cleanPath === '/' || cleanPath === '/dashboard') {
    return prefix;
  }

  // Se o caminho já inicia com o prefixo exato da área
  if (cleanPath === prefix || cleanPath.startsWith(`${prefix}/`)) {
    return cleanPath;
  }

  // Se o caminho inicia com o prefixo de outra área, substitui pelo prefixo da área atual
  for (const otherPrefix of Object.values(AREA_PREFIXES)) {
    if (cleanPath === otherPrefix) {
      return prefix;
    }
    if (cleanPath.startsWith(`${otherPrefix}/`)) {
      const rest = cleanPath.slice(otherPrefix.length);
      return `${prefix}${rest}`;
    }
  }

  return `${prefix}${cleanPath}`;
}
