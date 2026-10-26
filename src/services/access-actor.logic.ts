import { guardianLinkActive, type Actor, type ActorMembership } from '@/core/access';

export interface ActorRow {
  id: string;
  isActive: boolean;
  canOperate: boolean;
  memberships: ActorMembership[];
  athleteProfile: { id: string } | null;
  guardianLinks: {
    confirmedAt: Date | null;
    revokedAt: Date | null;
    player: { id: string; birthDate: Date | null };
  }[];
}

/** Converte a linha do banco no `Actor` do núcleo puro (maioridade avaliada na leitura). */
export function buildActor(row: ActorRow, now: Date): Actor {
  return {
    userId: row.id,
    isActive: row.isActive,
    canOperate: row.canOperate,
    memberships: row.memberships.map((m) => ({
      kind: m.kind,
      preset: m.preset ?? null,
      ctId: m.ctId ?? null,
      status: m.status,
    })),
    athletePlayerId: row.athleteProfile?.id ?? null,
    guardianOfPlayerIds: row.guardianLinks
      .filter((l) => guardianLinkActive(l, l.player.birthDate, now))
      .map((l) => l.player.id),
  };
}
