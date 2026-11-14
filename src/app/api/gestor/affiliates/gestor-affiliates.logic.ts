import { prisma } from '@/lib/prisma';
import type { AffiliateAthleteItem } from '@/app/gestor/affiliates.types';

export async function fetchAffiliateAthletes(searchQuery?: string): Promise<AffiliateAthleteItem[]> {
  const q = searchQuery?.trim();
  const where = q
    ? {
        OR: [
          { name: { contains: q, mode: 'insensitive' as const } },
          { nickname: { contains: q, mode: 'insensitive' as const } },
          { club: { contains: q, mode: 'insensitive' as const } },
        ],
      }
    : undefined;

  const players = await prisma.player.findMany({
    where,
    select: {
      id: true,
      name: true,
      nickname: true,
      club: true,
      city: true,
      state: true,
      gender: true,
      age: true,
      dominance: true,
      backhand: true,
      rankings: true,
      playerCts: {
        where: { status: 'ACTIVE' },
        select: {
          ct: {
            select: {
              name: true,
              address: true,
            },
          },
        },
        take: 1,
      },
      clubRef: {
        select: {
          name: true,
          city: true,
        },
      },
      coachAthleteLinks: {
        where: { status: 'ACTIVE' },
        select: { coach: { select: { name: true } } },
        take: 1,
      },
    },
    orderBy: { name: 'asc' },
  });

  return players.map((p) => {
    const activeCt = p.playerCts[0]?.ct;
    const ctAddr = (activeCt?.address || {}) as Record<string, any>;
    const ctCity = ctAddr.cidade || ctAddr.city || p.clubRef?.city || null;
    const ctState = ctAddr.estado || ctAddr.state || ctAddr.uf || null;

    return {
      id: p.id,
      name: p.name,
      nickname: p.nickname ?? null,
      clubName: activeCt?.name || p.clubRef?.name || p.club || null,
      coachName: p.coachAthleteLinks[0]?.coach?.name || null,
      dominance: p.dominance ?? null,
      backhand: p.backhand ?? null,
      gender: p.gender ?? null,
      age: p.age ?? null,
      rankings: (p.rankings as Record<string, any>) ?? null,
      city: p.city || ctCity || null,
      state: p.state || ctState || null,
    };
  });
}
