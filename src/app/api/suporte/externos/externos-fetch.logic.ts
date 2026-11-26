import { prisma } from '@/lib/prisma';
import type { PlayerExternal } from './externos-query.logic';

// Atletas sem conta no sistema (sem userId vinculado, null ou vazio)
export async function fetchExternalPlayers(): Promise<PlayerExternal[]> {
  const players = await prisma.player.findMany({
    where: {
      OR: [{ userId: null }, { userId: '' }],
    },
    select: {
      id: true,
      name: true,
      club: true,
      city: true,
      state: true,
      gender: true,
      age: true,
      rankings: true,
      createdAt: true,
      createdByUserId: true,
      createdByUser: {
        select: {
          name: true,
          email: true,
          club: true,
          memberships: {
            where: { status: 'ACTIVE' },
            select: {
              kind: true,
              ct: { select: { id: true, name: true } },
            },
          },
        },
      },
      playerCts: {
        where: { status: 'ACTIVE' },
        select: {
          ct: { select: { id: true, name: true } },
        },
      },
      clubRef: {
        select: { id: true, name: true },
      },
    } as any,
    orderBy: { name: 'asc' },
    take: 200,
  }) as unknown as PlayerExternal[];
  return players;
}

// Buscar treinadores-centros cadastrados para cruzar status
export async function fetchCenterStatusByName(): Promise<Map<string, string>> {
  const registeredCenters = await prisma.trainingCenter.findMany({
    select: { name: true, status: true },
  }) as Array<{ name: string; status: string }>;
  const centerStatusByName = new Map<string, string>();
  for (const c of registeredCenters) {
    centerStatusByName.set(c.name, c.status);
  }
  return centerStatusByName;
}

// Para cidades/estados, buscar jogadores por clube para preencher cidade/estado
export async function fetchClubsWithLocation(
  clubs: string[],
  centerStatusByName: Map<string, string>,
) {
  return Promise.all(
    clubs.map(async (club) => {
      let city: string | null = null;
      let state: string | null = null;
      try {
        const sample = await prisma.player.findFirst({
          where: {
            club,
            OR: [{ userId: null }, { userId: '' }],
          },
          select: { city: true, state: true },
        } as any) as { city: string | null; state: string | null } | null;
        city = sample?.city ?? null;
        state = sample?.state ?? null;
      } catch {
        // city/state podem não existir no cliente Prisma gerado ainda
      }
      const status = centerStatusByName.get(club) ?? null;
      return { club, city: city ?? '', state: state ?? '', status, inSystem: Boolean(status) };
    }),
  );
}
