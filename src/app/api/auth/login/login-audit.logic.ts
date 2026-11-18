import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

/**
 * Registra evento de login do usuário para auditoria parental e segurança (ECA Digital).
 */
export async function recordUserLoginAudit(userId: string, req: Request): Promise<void> {
  try {
    const userAgent = req.headers.get('user-agent') ?? 'unknown';
    await prisma.auditLog.create({
      data: {
        actorUserId: userId,
        action: 'USER_LOGIN',
        resourceType: 'User',
        resourceId: userId,
        meta: { userAgent },
      },
    });
  } catch (err) {
    logger.warn('[LOGIN AUDIT] Falha ao registrar log de login:', err);
  }
}
