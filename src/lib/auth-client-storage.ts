/**
 * Auth client-side storage helpers.
 *
 * Responsabilidade: manter cookie + sessionStorage sincronizados
 * para que o middleware (Server-side) e os hooks (Client-side)
 * concordem sobre o estado de autenticacao.
 */

const USER_ROLE_KEY = 'user_role';
const USER_ID_KEY = 'user_id';
const USER_NAME_KEY = 'user_name';
const COOKIE_MAX_AGE_SECONDS = 2 * 60 * 60; // 2h
const REDIRECTING_KEY = '__rkt_redirecting_to_login__';

function buildCookie(name: string, value: string): string {
  const isSecure = typeof window !== 'undefined' && window.location.protocol === 'https:';
  return `${name}=${value}; path=/; max-age=${COOKIE_MAX_AGE_SECONDS}; SameSite=Lax${isSecure ? '; Secure' : ''}`;
}

export function writeToSessionOnly(data: {
  userId: string;
  userRole: string;
  userName?: string;
}): void {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(USER_ID_KEY, data.userId);
  sessionStorage.setItem(USER_ROLE_KEY, data.userRole);
  if (data.userName) {
    sessionStorage.setItem(USER_NAME_KEY, data.userName);
  }
  clearRedirectingFlag();
}

/**
 * Sincroniza o cookie de access_token com o sessionStorage.
 */
export function ensureAuthCookie(): boolean {
  if (typeof window === 'undefined') return false;
  const userRole = sessionStorage.getItem(USER_ROLE_KEY);
  if (!userRole) return false;
  document.cookie = buildCookie('user_role', userRole);
  return true;
}

export function readAuthState(): {
  userId: string | null;
  userRole: string | null;
  userName: string | null;
} {
  if (typeof window === 'undefined') {
    return { userId: null, userRole: null, userName: null };
  }
  return {
    userId: sessionStorage.getItem(USER_ID_KEY),
    userRole: sessionStorage.getItem(USER_ROLE_KEY),
    userName: sessionStorage.getItem(USER_NAME_KEY),
  };
}

/**
 * Limpa estado de autenticacao de ambos os lados (cliente e middleware).
 */
export function clearAuthState(): void {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(USER_ID_KEY);
  sessionStorage.removeItem(USER_ROLE_KEY);
  sessionStorage.removeItem(USER_NAME_KEY);
  document.cookie = 'access_token=; path=/; max-age=0; SameSite=Lax';
  document.cookie = 'rkt_access_token=; path=/; max-age=0; SameSite=Lax';
  document.cookie = 'user_role=; path=/; max-age=0; SameSite=Lax';
}

/**
 * Redireciona para /login limpando o estado de auth.
 * Usa window.location para full navigation (garante middleware rodar).
 */
export function redirectToLogin(_router?: unknown): void {
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
