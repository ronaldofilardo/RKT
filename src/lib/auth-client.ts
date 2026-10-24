/**
 * Auth client-side helpers.
 *
 * Responsabilidade: manter cookie + sessionStorage sincronizados
 * para que o middleware (Server-side) e os hooks (Client-side)
 * concordem sobre o estado de autenticacao.
 */

export {
  writeToSessionOnly,
  ensureAuthCookie,
  readAuthState,
  clearAuthState,
  redirectToLogin,
  clearRedirectingFlag,
} from './auth-client-storage';

export { loginRequest, type LoginResponse } from './auth-client-login';
