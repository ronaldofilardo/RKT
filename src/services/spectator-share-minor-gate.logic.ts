import { prisma } from '@/lib/prisma';
import { isMinor } from '@/core/access/age';

/**
 * Valida se todos os atletas menores participantes de uma partida possuem
 * consentimento ativo para transmissão/compartilhamento (BROADCAST).
 */
export async function canShareMatchWithMinors(matchId: string, now = new Date()): Promise<boolean> {
  const match = await prisma.match.findUnique({
    where: { id: matchId },
    select: {
      player1: { select: { id: true, birthDate: true } },
      player2: { select: { id: true, birthDate: true } },
    },
  });
  if (!match) return true;

  const players = [match.player1, match.player2].filter(Boolean);
  const minorIds = players
    .filter((p) => isMinor(p.birthDate ? new Date(p.birthDate) : null, now))
    .map((p) => p.id);

  if (minorIds.length === 0) return true;

  const consents = await prisma.consentRecord.findMany({
    where: {
      playerId: { in: minorIds },
      purpose: 'BROADCAST',
      revokedAt: null,
    },
    select: { playerId: true },
  });

  const consentedPlayerIds = new Set(consents.map((c) => c.playerId));
  return minorIds.every((id) => consentedPlayerIds.has(id));
}
