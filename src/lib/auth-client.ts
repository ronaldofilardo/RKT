/**
 * Auth client-side helpers.
 *
 * Responsabilidade: manter cookie + sessionStorage sincronizados
 * para que o middleware (Server-side) e os hooks (Client-side)
 * concordem sobre o estado de autenticacao.
 */

const ACCESS_TOKEN_KEY = 'access_token';
const USER_ROLE_KEY = 'user_role';
const USER_ID_KEY = 'user_id';
const COOKIE_MAX_AGE_SECONDS = 2 * 60 * 60; // 2h

function buildCookie(name: string, value: string): string {
  const isSecure = typeof window !== 'undefined' && window.location.protocol === 'https:';
  return `${name}=${value}; path=/; max-age=${COOKIE_MAX_AGE_SECONDS}; SameSite=Lax${isSecure ? '; Secure' : ''}`;
}

export function writeToSessionOnly(data: {
  accessToken: string;
  userId: string;
  userRole: string;
}): void {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(ACCESS_TOKEN_KEY, data.accessToken);
  sessionStorage.setItem(USER_ID_KEY, data.userId);
  sessionStorage.setItem(USER_ROLE_KEY, data.userRole);
  clearRedirectingFlag();
}

/**
 * Sincroniza o cookie de access_token com o sessionStorage.
 */
export function ensureAuthCookie(): boolean {
  if (typeof window === 'undefined') return false;
  const accessToken = sessionStorage.getItem(ACCESS_TOKEN_KEY);
  const userRole = sessionStorage.getItem(USER_ROLE_KEY);
  if (!accessToken || !userRole) return false;
  document.cookie = buildCookie('access_token', accessToken);
  document.cookie = buildCookie('user_role', userRole);
  return true;
}

export function readAuthState(): {
  accessToken: string | null;
  userId: string | null;
  userRole: string | null;
} {
  if (typeof window === 'undefined') {
    return { accessToken: null, userId: null, userRole: null };
  }
  return {
    accessToken: sessionStorage.getItem(ACCESS_TOKEN_KEY),
    userId: sessionStorage.getItem(USER_ID_KEY),
    userRole: sessionStorage.getItem(USER_ROLE_KEY),
  };
}

export function isFullyAuthenticated(): boolean {
  if (typeof window === 'undefined') return false;
  const { accessToken, userId, userRole } = readAuthState();
  return !!(accessToken && userId && userRole);
}

/**
 * Limpa estado de autenticacao de ambos os lados (cliente e middleware).
 */
export function clearAuthState(): void {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(ACCESS_TOKEN_KEY);
  sessionStorage.removeItem(USER_ID_KEY);
  sessionStorage.removeItem(USER_ROLE_KEY);
  document.cookie = 'access_token=; path=/; max-age=0; SameSite=Lax';
  document.cookie = 'user_role=; path=/; max-age=0; SameSite=Lax';
}

const REDIRECTING_KEY = '__rkt_redirecting_to_login__';

/**
 * Redireciona para /login limpando o estado de auth.
 * Usa window.location para full navigation (garante middleware rodar).
 */
export function redirectToLogin(_router?: { replace: (url: string) => void }): void {
  if (typeof window === 'undefined') return;
  if (window.location.pathname === '/login') return;
  if (sessionStorage.getItem(REDIRECTING_KEY) === '1') return;
  sessionStorage.setItem(REDIRECTING_KEY, '1');
  clearAuthState();
  window.location.replace('/login');
}

export function clearRedirectingFlag(): void {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(REDIRECTING_KEY);
}
