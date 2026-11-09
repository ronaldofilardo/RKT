import { guardianLinkActive, type Actor, type ActorMembership } from '@/core/access';

export interface ActorRow {
  id: string;
  role?: string | null;
  isActive: boolean;
  canOperate: boolean;
  memberships: ActorMembership[];
  athleteProfile: { id: string; playerCts: { ctId: string }[] } | null;
  guardianLinks: { confirmedAt: Date | null; revokedAt: Date | null; player: { id: string; birthDate: Date | null } }[];
  coachAthleteLinks: { playerId: string; player?: { playerCts?: { ctId: string; status: string }[] } | null }[];
  createdPlayers?: { id: string; playerCts?: { ctId: string; status: string }[] }[];
}

function filterMembershipsByContext(
  memberships: ActorMembership[],
  contextId?: string | null,
  activeArea?: string | null,
): ActorMembership[] {
  if (activeArea === 'ATLETA') return memberships.filter((m) => m.kind === 'PLATAFORMA');
  if (activeArea === 'TREINADOR_AVULSO' || contextId === 'PARTICULAR') {
    return memberships.filter((m) => m.kind === 'PLATAFORMA' || (m.kind === 'TREINADOR' && m.ctId === null));
  }
  if (activeArea === 'TREINADOR_CLUBE' && contextId) {
    return memberships.filter((m) => m.kind === 'PLATAFORMA' || (m.kind === 'TREINADOR' && m.ctId === contextId));
  }
  if (activeArea === 'GESTOR' && contextId) {
    return memberships.filter((m) => m.kind === 'PLATAFORMA' || (m.kind === 'GESTOR' && m.ctId === contextId));
  }
  if (!contextId) return memberships;
  return memberships.filter((m) => m.kind === 'PLATAFORMA' || m.ctId === contextId);
}

export function filterFollowedPlayers(row: ActorRow, contextId?: string | null, activeArea?: string | null): string[] {
  const links = row.coachAthleteLinks ?? [];
  const created = (row.createdPlayers ?? []).map((p) => ({
    playerId: p.id,
    player: { playerCts: p.playerCts },
  }));
  const combined = [...links, ...created];

  if (activeArea === 'ATLETA') return [];
  if (!contextId && activeArea !== 'TREINADOR_AVULSO') {
    return Array.from(new Set(combined.map((l) => l.playerId).filter(Boolean)));
  }

  if (activeArea === 'TREINADOR_AVULSO' || contextId === 'PARTICULAR') {
    const coachCtIds = new Set(
      row.memberships.filter((m) => m.status === 'ACTIVE' && m.ctId).map((m) => m.ctId as string),
    );
    const outsideCoachCt = combined.filter(
      (l) => !l.player?.playerCts?.some((pc) => pc.status === 'ACTIVE' && coachCtIds.has(pc.ctId)),
    );
    return Array.from(new Set(outsideCoachCt.map((l) => l.playerId).filter(Boolean)));
  }

  const inContextCt = combined.filter(
    (l) => l.player?.playerCts?.some((pc) => pc.status === 'ACTIVE' && pc.ctId === contextId),
  );
  return Array.from(new Set(inContextCt.map((l) => l.playerId).filter(Boolean)));
}

export function buildActor(
  row: ActorRow,
  now: Date,
  contextId?: string | null,
  activeArea?: string | null,
): Actor {
  const base = [...row.memberships];
  if (row.role === 'ADMIN' && !base.some((m) => m.kind === 'PLATAFORMA' && m.preset === 'ADMIN')) {
    base.push({ kind: 'PLATAFORMA', preset: 'ADMIN', ctId: null, status: 'ACTIVE' });
  }
  const filtered = filterMembershipsByContext(base, contextId, activeArea);

  return {
    userId: row.id,
    isActive: row.isActive,
    canOperate: row.canOperate,
    memberships: filtered.map((m) => ({ kind: m.kind, preset: m.preset ?? null, ctId: m.ctId ?? null, status: m.status })),
    athletePlayerId: row.athleteProfile?.id ?? null,
    athleteCtIds: (row.athleteProfile?.playerCts ?? []).map((pc) => pc.ctId),
    guardianOfPlayerIds: row.guardianLinks
      .filter((l) => guardianLinkActive(l, l.player.birthDate, now))
      .map((l) => l.player.id),
    followedPlayerIds: filterFollowedPlayers(row, contextId, activeArea),
    ...(contextId ? { activeContextId: contextId } : {}),
    ...(activeArea ? { activeArea } : {}),
  };
}
