import { clearAuthState } from './auth-client-storage';
import { logger } from './logger';

/**
 * Executa o fluxo completo de logout da aplicação:
 * 1. Invoca POST /api/auth/logout para que o servidor limpe os cookies httpOnly (rkt_access_token)
 * 2. Limpa o armazenamento local (sessionStorage, cookies legados)
 */
export async function performLogout(): Promise<void> {
  if (typeof window === 'undefined') return;

  try {
    await fetch('/api/auth/logout', { method: 'POST' });
  } catch (err) {
    logger.warn('[logout] Falha ao invocar /api/auth/logout:', err);
  }

  try {
    clearAuthState();
  } catch (err) {
    logger.error('[logout] Erro ao limpar estado de auth local:', err);
  }
}

