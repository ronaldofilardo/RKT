import { prisma } from '@/lib/prisma';
import type { Actor } from '@/core/access/types';
import { canDiscoverMatchTemplate, type MatchTemplateAccess } from '@/core/access/match-event-visibility';
import type { TemplateRecord } from './match-resolve-payload.logic';

export function toTemplateAccess(template: TemplateRecord): MatchTemplateAccess {
  const participantPlayerIds = [
    template.player1Id,
    template.player2Id,
    template.player1PartnerId,
    template.player2PartnerId,
  ].filter((v): v is string => !!v);

  return {
    eventScope: template.eventScope,
    createdByUserId: template.createdByUserId,
    ctId: template.ctId,
    participantPlayerIds,
  };
}

export async function canResolveTargetMatch(target: TemplateRecord, actor: Actor): Promise<boolean> {
  if (actor.memberships.some((m) => m.kind === 'PLATAFORMA' && m.preset === 'ADMIN' && m.status === 'ACTIVE')) {
    return true;
  }
  if (
    target.createdByUserId === actor.userId ||
    target.assignedCoachId === actor.userId ||
    (Array.isArray(target.assignedCoaches) && target.assignedCoaches.some((ac) => ac.coachId === actor.userId))
  ) {
    return true;
  }

  const staffCts = actor.memberships
    .filter((m) => m.status === 'ACTIVE' && (m.kind === 'GESTOR' || m.kind === 'TREINADOR') && m.ctId)
    .map((m) => m.ctId as string);

  if (target.ctId && staffCts.includes(target.ctId)) return true;
  if (canDiscoverMatchTemplate(actor, toTemplateAccess(target))) return true;

  const pIds = [target.player1Id, target.player2Id, target.player1PartnerId, target.player2PartnerId].filter((v): v is string => !!v);
  if (actor.followedPlayerIds?.some((id) => pIds.includes(id)) || actor.guardianOfPlayerIds?.some((id) => pIds.includes(id))) {
    return true;
  }

  if (staffCts.length > 0) {
    if (prisma?.playerCT?.findFirst) {
      const aff = await prisma.playerCT.findFirst({ where: { playerId: { in: pIds }, ctId: { in: staffCts } }, select: { id: true } });
      if (aff) return true;
    }
    if (target.createdByUserId && prisma?.membership?.findFirst) {
      const creatorInClub = await prisma.membership.findFirst({ where: { userId: target.createdByUserId, ctId: { in: staffCts }, status: 'ACTIVE' }, select: { id: true } });
      if (creatorInClub) return true;
    }
    if (target.sourceMatchId && prisma?.match?.findFirst) {
      const sourceMatch = await prisma.match.findFirst({ where: { id: target.sourceMatchId, ctId: { in: staffCts } }, select: { id: true } });
      if (sourceMatch) return true;
    }
    if (prisma?.player?.findFirst) {
      const playerInClub = await prisma.player.findFirst({
        where: {
          id: { in: pIds },
          OR: [
            { clubId: { in: staffCts } },
            { createdByUser: { memberships: { some: { ctId: { in: staffCts }, status: 'ACTIVE' } } } },
          ],
        },
        select: { id: true },
      });
      if (playerInClub) return true;
    }
  }

  return false;
}
