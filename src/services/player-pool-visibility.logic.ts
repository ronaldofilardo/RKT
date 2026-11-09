import { prisma } from '@/lib/prisma';
import { isMinor } from '@/core/access/age';

export type PoolVisibilityErrorCode =
  | 'NOT_FOUND'
  | 'FORBIDDEN'
  | 'CONSENT_REQUIRED';

export type PoolVisibilityResult =
  | { ok: true; poolVisible: boolean; poolVisibleSince: Date | null }
  | { ok: false; status: 403 | 404; error: PoolVisibilityErrorCode; message: string };

/**
 * Decisão pura de autorização para ligar/desligar a visibilidade no pool.
 * Menores exigem ConsentRecord POOL_VISIBILITY ativo do responsável.
 */
export function evaluatePoolVisibility(input: {
  isOwner: boolean;
  isPlatformStaff: boolean;
  visible: boolean;
  minor: boolean;
  hasConsent: boolean;
}): { allowed: boolean; error?: PoolVisibilityErrorCode } {
  if (!input.isOwner && !input.isPlatformStaff) return { allowed: false, error: 'FORBIDDEN' };
  if (input.visible && input.minor && !input.hasConsent) {
    return { allowed: false, error: 'CONSENT_REQUIRED' };
  }
  return { allowed: true };
}

const MESSAGES: Record<PoolVisibilityErrorCode, string> = {
  NOT_FOUND: 'Atleta não encontrado',
  FORBIDDEN: 'Sem permissão para alterar a visibilidade deste atleta',
  CONSENT_REQUIRED: 'Menor de idade exige consentimento ativo do responsável (POOL_VISIBILITY)',
};

export async function setPlayerPoolVisibility({
  playerId,
  actorUserId,
  isPlatformStaff,
  visible,
  now = new Date(),
}: {
  playerId: string;
  actorUserId: string;
  isPlatformStaff: boolean;
  visible: boolean;
  now?: Date;
}): Promise<PoolVisibilityResult> {
  const player = await prisma.player.findUnique({
    where: { id: playerId },
    select: { id: true, userId: true, birthDate: true },
  });

  if (!player) return { ok: false, status: 404, error: 'NOT_FOUND', message: MESSAGES.NOT_FOUND };

  const minor = isMinor(player.birthDate ?? null, now);
  const hasConsent = visible && minor
    ? Boolean(await prisma.consentRecord.findFirst({
        where: { playerId, purpose: 'POOL_VISIBILITY', revokedAt: null },
        select: { id: true },
      }))
    : false;

  const decision = evaluatePoolVisibility({
    isOwner: player.userId === actorUserId,
    isPlatformStaff,
    visible,
    minor,
    hasConsent,
  });

  if (!decision.allowed && decision.error) {
    const status = decision.error === 'NOT_FOUND' ? 404 : 403;
    return { ok: false, status, error: decision.error, message: MESSAGES[decision.error] };
  }

  const poolVisibleSince = visible ? now : null;
  const updated = await prisma.player.update({
    where: { id: playerId },
    data: { poolVisible: visible, poolVisibleSince },
    select: { poolVisible: true, poolVisibleSince: true },
  });

  await prisma.auditLog.create({
    data: {
      actorUserId,
      action: visible ? 'PLAYER_POOL_VISIBILITY_ENABLED' : 'PLAYER_POOL_VISIBILITY_DISABLED',
      resourceType: 'Player',
      resourceId: playerId,
      meta: { poolVisible: visible },
    },
  });

  return { ok: true, ...updated };
}
