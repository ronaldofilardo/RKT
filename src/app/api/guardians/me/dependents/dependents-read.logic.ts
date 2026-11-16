import { prisma } from '@/lib/prisma';

export interface DependentConsentStatus {
  DATA: boolean;
  BROADCAST: boolean;
  STATS: boolean;
}

export interface DependentSummary {
  playerId: string;
  name: string;
  nickname: string | null;
  relation: string;
  birthDate: string | null;
  trainingCenterName: string;
  trainingCenterId: string | null;
  consents: DependentConsentStatus;
}

export async function getGuardianDependents(userId: string): Promise<DependentSummary[]> {
  const links = await prisma.guardianLink.findMany({
    where: {
      guardianUserId: userId,
      status: 'ACTIVE',
      revokedAt: null,
    },
    include: {
      player: {
        select: {
          id: true,
          name: true,
          nickname: true,
          birthDate: true,
          playerCts: {
            where: { status: 'ACTIVE' },
            include: { ct: { select: { id: true, name: true } } },
            take: 1,
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  if (links.length === 0) return [];

  const playerIds = links.map((l) => l.playerId);
  const activeConsents = await prisma.consentRecord.findMany({
    where: {
      guardianUserId: userId,
      playerId: { in: playerIds },
      revokedAt: null,
    },
    select: { playerId: true, purpose: true },
  });

  const consentsByPlayer = new Map<string, Set<string>>();
  for (const c of activeConsents) {
    if (!consentsByPlayer.has(c.playerId)) {
      consentsByPlayer.set(c.playerId, new Set());
    }
    consentsByPlayer.get(c.playerId)!.add(c.purpose);
  }

  return links.map((l) => {
    const playerConsents = consentsByPlayer.get(l.playerId) ?? new Set<string>();
    const ct = l.player.playerCts[0]?.ct;
    return {
      playerId: l.playerId,
      name: l.player.name,
      nickname: l.player.nickname ?? null,
      relation: l.relation || 'Responsável',
      birthDate: l.player.birthDate ? l.player.birthDate.toISOString() : null,
      trainingCenterName: ct?.name || 'Sem CT vinculado',
      trainingCenterId: ct?.id || null,
      consents: {
        DATA: playerConsents.has('DATA'),
        BROADCAST: playerConsents.has('BROADCAST'),
        STATS: playerConsents.has('STATS'),
      },
    };
  });
}
