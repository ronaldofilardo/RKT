import { prisma } from '@/lib/prisma';

export type PlayerExternal = {
  id: string;
  name: string;
  club: string | null;
  city: string | null;
  state: string | null;
  gender: string | null;
  age: number | null;
  rankings: unknown;
  createdAt: Date;
  createdByUserId: string | null;
  createdByName?: string | null;
  createdByEmail?: string | null;
  createdByUser?: {
    name?: string | null;
    email?: string | null;
    club?: string | null;
    memberships?: Array<{
      kind: string;
      ct?: { id: string; name: string } | null;
    }>;
  } | null;
  playerCts?: Array<{
    ct?: { id: string; name: string } | null;
  }>;
  clubRef?: { id: string; name: string } | null;
};

export function resolveAthleteClub(p: PlayerExternal): string | null {
  const activeCt = p.playerCts?.[0]?.ct?.name;
  if (activeCt) return activeCt;
  if (p.club) return p.club;
  if (p.clubRef?.name) return p.clubRef.name;
  const creatorCt = p.createdByUser?.memberships?.find((m) => m.ct?.name)?.ct?.name;
  if (creatorCt) return creatorCt;
  if (p.createdByUser?.club) return p.createdByUser.club;
  return null;
}

export function resolveCreatorClub(p: PlayerExternal): string | null {
  const creatorCt = p.createdByUser?.memberships?.find((m) => m.ct?.name)?.ct?.name;
  if (creatorCt) return creatorCt;
  if (p.createdByUser?.club) return p.createdByUser.club;
  return null;
}

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

// Clubes distintos mencionados por esses atletas externos
export function collectExternalClubs(players: PlayerExternal[]): Set<string> {
  const clubsSet = new Set<string>();
  for (const p of players) {
    const club = resolveAthleteClub(p);
    if (club) clubsSet.add(club);
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
    club: resolveAthleteClub(p),
    city: p.city ?? null,
    state: p.state ?? null,
    gender: p.gender ?? null,
    age: p.age ?? null,
    rankings: p.rankings ?? null,
    createdAt: p.createdAt.toISOString(),
    createdByUserId: p.createdByUserId ?? null,
    createdByName: (p as any).createdByUser?.name ?? null,
    createdByEmail: (p as any).createdByUser?.email ?? null,
    createdByClub: resolveCreatorClub(p),
  };
}
