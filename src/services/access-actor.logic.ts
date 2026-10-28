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
  coachAthleteLinks: { playerId: string }[];
}

/** Converte a linha do banco no `Actor` do núcleo puro (maioridade avaliada na leitura). */
export function buildActor(row: ActorRow, now: Date): Actor {
  const memberships = [...row.memberships];
  if (row.role === 'ADMIN' && !memberships.some((m) => m.kind === 'PLATAFORMA' && m.preset === 'ADMIN')) {
    memberships.push({ kind: 'PLATAFORMA', preset: 'ADMIN', ctId: null, status: 'ACTIVE' });
  }

  return {
    userId: row.id,
    isActive: row.isActive,
    canOperate: row.canOperate,
    memberships: memberships.map((m) => ({
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
    followedPlayerIds: (row.coachAthleteLinks ?? []).map((link) => link.playerId),
  };
}

