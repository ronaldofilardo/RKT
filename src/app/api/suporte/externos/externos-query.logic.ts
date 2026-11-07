import { prisma } from '@/lib/prisma';

export type PlayerExternal = {
  id: string; name: string; club: string | null; city: string | null; state: string | null;
  gender: string | null; age: number | null; rankings: unknown; createdAt: Date;
  createdByUserId: string | null; createdByName: string | null; createdByEmail: string | null;
};

// Atletas sem conta no sistema (sem userId vinculado, null ou vazio)
export async function fetchExternalPlayers(): Promise<PlayerExternal[]> {
  const players = await prisma.player.findMany({
    where: {
      OR: [{ userId: null }, { userId: '' }],
    },
    select: {
      id: true, name: true, club: true, city: true, state: true, gender: true, age: true,
      rankings: true, createdAt: true, createdByUserId: true,
      createdByUser: { select: { name: true, email: true } },
    } as any,
    orderBy: { name: 'asc' },
    take: 200,
  }) as unknown as PlayerExternal[];
  return players;
}

// Clubes distintos mencionados por esses atletas externos
export function collectExternalClubs(players: PlayerExternal[]): Set<string> {
  const clubsSet = new Set<string>();
  for (const p of players) {
    if (p.club) clubsSet.add(p.club);
  }
  return clubsSet;
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

export function mapExternalAthlete(p: PlayerExternal) {
  return {
    id: p.id,
    name: p.name,
    club: p.club ?? null,
    city: p.city ?? null,
    state: p.state ?? null,
    gender: p.gender ?? null,
    age: p.age ?? null,
    rankings: p.rankings ?? null,
    createdAt: p.createdAt.toISOString(),
    createdByUserId: p.createdByUserId ?? null,
    createdByName: (p as any).createdByUser?.name ?? null,
    createdByEmail: (p as any).createdByUser?.email ?? null,
  };
}
