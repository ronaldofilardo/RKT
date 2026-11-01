import { logger } from '@/lib/logger';

export async function checkLoginRateLimit(ip: string): Promise<void> {
  if (process.env.ENABLE_LOGIN_RATELIMIT !== 'true') return;
  const fiveMinsAgo = new Date(Date.now() - 5 * 60 * 1000);
  const recentFails = await import('@/lib/prisma')
    .then((m) => m.prisma.loginAttempt.count({
      where: { ip, success: false, createdAt: { gte: fiveMinsAgo } },
    }))
    .catch((error: unknown) => {
      logger.warn('[LOGIN RATELIMIT] Falha ao contar tentativas:', error);
      return 0;
    });

  if (recentFails > 3) {
    const delayMs = Math.min((recentFails - 3) * 1000, 8000);
    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }
}

export async function recordLoginAttempt(ip: string, identifier: string, success: boolean): Promise<void> {
  if (process.env.ENABLE_LOGIN_RATELIMIT !== 'true') return;
  await import('@/lib/prisma')
    .then((m) => m.prisma.loginAttempt.create({
      data: { ip, cpf: identifier, success },
    }))
    .catch((error: unknown) => {
      logger.warn('[LOGIN RATELIMIT] Falha ao registrar tentativa:', error);
    });
}

