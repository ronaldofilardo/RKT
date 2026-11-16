import { prisma } from '@/lib/prisma';

export async function getGestorAthletesList(ctId: string) {
  const playerCts = await prisma.playerCT.findMany({
    where: { ctId },
    include: {
      player: {
        select: {
          id: true,
          name: true,
          nickname: true,
          email: true,
          birthDate: true,
          age: true,
          cpf: true,
          cpfLast2: true,
          gender: true,
          dominance: true,
          backhand: true,
          rankings: true,
          guardianGate: true,
          guardianLinks: {
            where: { status: 'ACTIVE', revokedAt: null, confirmedAt: { not: null } },
            select: { id: true },
            take: 1,
          },
          guardianInvites: {
            where: { usedAt: { not: null } },
            select: { id: true },
            take: 1,
          },
          consentRecords: { select: { id: true }, take: 1 },
          user: { select: { id: true, name: true, cpf: true, email: true, mustChangePassword: true } },
        },
      },
    },
    orderBy: { since: 'desc' },
  });

  return playerCts.map((pct) => {
    const p = pct.player;
    const isConsented = Boolean(
      (p.guardianLinks && p.guardianLinks.length > 0) ||
      (p.guardianInvites && p.guardianInvites.length > 0) ||
      (p.consentRecords && p.consentRecords.length > 0),
    );

    return {
      ...pct,
      player: {
        ...p,
        isConsented,
        guardianLinks: undefined,
        guardianInvites: undefined,
        consentRecords: undefined,
      },
    };
  });
}
