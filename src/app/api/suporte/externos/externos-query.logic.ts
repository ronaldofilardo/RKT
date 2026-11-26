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

// Clubes distintos mencionados por esses atletas externos
export function collectExternalClubs(players: PlayerExternal[]): Set<string> {
  const clubsSet = new Set<string>();
  for (const p of players) {
    const club = resolveAthleteClub(p);
    if (club) clubsSet.add(club);
  }
  return clubsSet;
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

// Acesso Prisma movido para externos-fetch.logic.ts (re-export mantém o contrato público)
export { fetchExternalPlayers, fetchCenterStatusByName, fetchClubsWithLocation } from './externos-fetch.logic';
