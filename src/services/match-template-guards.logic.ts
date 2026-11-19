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

export interface AssertPublicMatchGuardsInput {
  createdByUserId?: string | null;
  playerIds?: (string | null | undefined)[];
  now?: Date;
}

/**
 * Validação ampla para partidas e templates em escopo público:
 * 1. O criador (se for atleta menor) precisa de consentimento DATA.
 * 2. Todos os atletas participantes (se menores ou com guardianGate pendente)
 *    exigem consentimento ativo (DATA ou BROADCAST) para publicação em escopo PUBLIC.
 */
export async function assertPublicMatchGuards(
  input: AssertPublicMatchGuardsInput,
): Promise<void> {
  const now = input.now ?? new Date();

  if (input.createdByUserId) {
    await assertTemplateCreatorAllowed(input.createdByUserId, now);
  }

  const validIds = (input.playerIds || []).filter(
    (id): id is string => typeof id === 'string' && id.trim().length > 0,
  );
  if (validIds.length === 0) return;

  const players = await prisma.player.findMany({
    where: { id: { in: validIds } },
    select: { id: true, name: true, birthDate: true, guardianGate: true },
  });

  for (const player of players) {
    const under18 = isMinor(player.birthDate ?? null, now);
    const gatePending = player.guardianGate === 'AGUARDANDO_RESPONSAVEL';
    if (!under18 && !gatePending) continue;

    const consent = await prisma.consentRecord.findFirst({
      where: {
        playerId: player.id,
        purpose: { in: ['DATA', 'BROADCAST'] },
        revokedAt: null,
      },
      select: { id: true },
    });

    if (!consent && player.guardianGate !== 'LIBERADO') {
      throw new ApiError(
        'CONSENT_REQUIRED',
        { playerId: player.id, purpose: 'DATA' },
        403,
        `Atleta protegido (${player.name || 'Menor'}) exige consentimento ativo do responsável para publicação em escopo público`,
      );
    }
  }
}
