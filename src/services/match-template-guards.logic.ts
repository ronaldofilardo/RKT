import { prisma } from '@/lib/prisma';
import { isMinor } from '@/core/access/age';
import { ApiError } from '@/lib/errors';

/**
 * Menor de idade só pode publicar um template no pool com consentimento
 * ativo do responsável (ConsentRecord purpose DATA). Maiores não exigem nada.
 */
export async function assertTemplateCreatorAllowed(
  userId: string,
  now: Date = new Date(),
): Promise<void> {
  const player = await prisma.player.findFirst({
    where: { userId },
    select: { id: true, birthDate: true },
  });

  if (!player || !isMinor(player.birthDate ?? null, now)) return;

  const consent = await prisma.consentRecord.findFirst({
    where: { playerId: player.id, purpose: 'DATA', revokedAt: null },
    select: { id: true },
  });

  if (!consent) {
    throw new ApiError(
      'CONSENT_REQUIRED',
      { playerId: player.id, purpose: 'DATA' },
      403,
      'Menor de idade exige consentimento ativo do responsável para publicar partidas',
    );
  }
}
