import { logger } from '@/lib/logger';
import { RateLimitError } from '@/lib/errors';

export const MAX_LOGIN_ATTEMPTS = 5;
export const LOGIN_WINDOW_MINUTES = 5;
export const RETRY_AFTER_SECONDS = 300;

export function isLoginRateLimitEnabled(): boolean {
  if (process.env.DISABLE_LOGIN_RATELIMIT === 'true') return false;
  if (process.env.NODE_ENV === 'test' && process.env.ENABLE_LOGIN_RATELIMIT !== 'true') return false;
  if (process.env.NODE_ENV === 'development' && process.env.ENABLE_LOGIN_RATELIMIT !== 'true') return false;
  return true;
}

export async function checkLoginRateLimit(ip: string): Promise<void> {
  if (!isLoginRateLimitEnabled()) return;
  const isLoopback = ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1' || ip === 'localhost';
  if (isLoopback && process.env.ENABLE_LOGIN_RATELIMIT !== 'true') return;

  const windowStart = new Date(Date.now() - LOGIN_WINDOW_MINUTES * 60 * 1000);
  const recentFails = await import('@/lib/prisma')
    .then((m) => m.prisma.loginAttempt.count({
      where: { ip, success: false, createdAt: { gte: windowStart } },
    }))
    .catch((error: unknown) => {
      logger.warn('[LOGIN RATELIMIT] Falha ao contar tentativas:', error);
      return 0;
    });

  if (recentFails >= MAX_LOGIN_ATTEMPTS) {
    logger.warn(`[LOGIN RATELIMIT] IP ${ip} bloqueado por excesso de falhas (${recentFails}/${MAX_LOGIN_ATTEMPTS})`);
    throw new RateLimitError('auth:login', MAX_LOGIN_ATTEMPTS, `${LOGIN_WINDOW_MINUTES}m`, RETRY_AFTER_SECONDS);
  }

  if (recentFails > 2) {
    const delayMs = Math.min((recentFails - 2) * 500, 2000);
    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }
}

export async function recordLoginAttempt(ip: string, identifier: string, success: boolean): Promise<void> {
  if (!isLoginRateLimitEnabled()) return;
  await import('@/lib/prisma')
    .then((m) => m.prisma.loginAttempt.create({
      data: { ip, cpf: identifier, success },
    }))
    .catch((error: unknown) => {
      logger.warn('[LOGIN RATELIMIT] Falha ao registrar tentativa:', error);
    });
}

