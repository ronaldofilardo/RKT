import { guardianLinkActive, type Actor, type ActorMembership } from '@/core/access';

export interface ActorRow {
  id: string;
  role?: string | null;
  isActive: boolean;
  canOperate: boolean;
  memberships: ActorMembership[];
  athleteProfile: { id: string; playerCts: { ctId: string }[] } | null;
  guardianLinks: {
    confirmedAt: Date | null;
    revokedAt: Date | null;
    player: { id: string; birthDate: Date | null };
  }[];
  coachAthleteLinks: {
    playerId: string;
    player?: {
      playerCts?: { ctId: string; status: string }[];
    } | null;
  }[];
}

function filterMembershipsByContext(
  memberships: ActorMembership[],
  contextId?: string | null,
): ActorMembership[] {
  if (!contextId) return memberships;
  if (contextId === 'PARTICULAR') {
    return memberships.filter((m) => m.kind === 'PLATAFORMA' || m.ctId === null);
  }
  return memberships.filter((m) => m.kind === 'PLATAFORMA' || m.ctId === contextId);
}

function filterFollowedPlayers(row: ActorRow, contextId?: string | null): string[] {
  const links = row.coachAthleteLinks ?? [];
  if (!contextId) return links.map((l) => l.playerId);

  if (contextId === 'PARTICULAR') {
    const coachCtIds = new Set(
      row.memberships
        .filter((m) => m.status === 'ACTIVE' && m.ctId)
        .map((m) => m.ctId as string),
    );
    return links
      .filter((l) => !l.player?.playerCts?.some((pc) => pc.status === 'ACTIVE' && coachCtIds.has(pc.ctId)))
      .map((l) => l.playerId);
  }

  return links
    .filter((l) => l.player?.playerCts?.some((pc) => pc.status === 'ACTIVE' && pc.ctId === contextId))
    .map((l) => l.playerId);
}

/** Converte a linha do banco no `Actor` do núcleo puro (com suporte a isolamento de contexto). */
export function buildActor(row: ActorRow, now: Date, contextId?: string | null): Actor {
  const base = [...row.memberships];
  if (row.role === 'ADMIN' && !base.some((m) => m.kind === 'PLATAFORMA' && m.preset === 'ADMIN')) {
    base.push({ kind: 'PLATAFORMA', preset: 'ADMIN', ctId: null, status: 'ACTIVE' });
  }
  const filtered = filterMembershipsByContext(base, contextId);

  return {
    userId: row.id,
    isActive: row.isActive,
    canOperate: row.canOperate,
    memberships: filtered.map((m) => ({
      kind: m.kind,
      preset: m.preset ?? null,
      ctId: m.ctId ?? null,
      status: m.status,
    })),
    athletePlayerId: row.athleteProfile?.id ?? null,
    athleteCtIds: (row.athleteProfile?.playerCts ?? []).map((pc) => pc.ctId),
    guardianOfPlayerIds: row.guardianLinks
      .filter((l) => guardianLinkActive(l, l.player.birthDate, now))
      .map((l) => l.player.id),
    followedPlayerIds: filterFollowedPlayers(row, contextId),
    ...(contextId ? { activeContextId: contextId } : {}),
  };
}
