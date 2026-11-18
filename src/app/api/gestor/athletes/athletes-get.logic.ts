import { prisma } from '@/lib/prisma';

export async function getGestorAthletesList(ctId: string) {
  const playerCts = await prisma.playerCT.findMany({
    where: { ctId, status: 'ACTIVE' },
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
          createdAt: true,
          guardianLinks: {
            where: { status: 'ACTIVE', revokedAt: null },
            select: {
              id: true,
              relation: true,
              confirmedAt: true,
              guardian: { select: { name: true, cpf: true, email: true } },
            },
            take: 1,
          },
          guardianInvites: {
            select: {
              id: true,
              usedAt: true,
              preGuardianName: true,
              preGuardianCpf: true,
              preGuardianPhone: true,
              preGuardianContact: true,
              guardianUser: { select: { name: true, cpf: true, email: true } },
            },
            orderBy: { createdAt: 'desc' },
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
    const activeLink = p.guardianLinks?.[0];
    const invite = p.guardianInvites?.[0];
    const isConsented = Boolean(
      (activeLink && activeLink.confirmedAt) ||
      (invite && invite.usedAt) ||
      (p.consentRecords && p.consentRecords.length > 0),
    );
    const guardianName = activeLink?.guardian?.name || invite?.guardianUser?.name || invite?.preGuardianName || null;
    const guardianCpf = activeLink?.guardian?.cpf || invite?.guardianUser?.cpf || invite?.preGuardianCpf || null;
    const guardianPhone = invite?.preGuardianPhone || invite?.preGuardianContact || null;
    const guardianRelationship = activeLink?.relation || invite?.preGuardianContact || null;

    return {
      ...pct,
      player: {
        ...p,
        isConsented,
        guardianName,
        guardianCpf,
        guardianPhone,
        guardianRelationship,
        guardianLinks: undefined,
        guardianInvites: undefined,
        consentRecords: undefined,
      },
    };
  });
}
