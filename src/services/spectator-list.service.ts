import { prisma } from '@/lib/prisma';

export async function listMySpectatingMatches(userId: string) {
  const matchSelect = {
    id: true,
    state: true,
    format: true,
    tournamentName: true,
    player1: { select: { id: true, name: true } },
    player2: { select: { id: true, name: true } },
    scoreState: true,
    updatedAt: true,
  };
  const spectators = await prisma.matchSpectator.findMany({
    where: { userId, revokedAt: null },
    include: { match: { select: matchSelect } },
    orderBy: { match: { updatedAt: 'desc' } },
  });
  return spectators.map((s) => s.match);
}

