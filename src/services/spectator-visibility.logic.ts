import { prisma } from '@/lib/prisma';
import { isDirectlyInvolvedInMatch, type MatchAccess } from '@/core/access';
import { getActor } from '@/services/accessService';

export type MatchVisibility = 'PRIVATE' | 'CIRCLE' | 'PUBLIC';

export function normalizeMatchVisibility(visibility?: string | null): MatchVisibility {
  if (visibility === 'PRIVATE' || visibility === 'CIRCLE' || visibility === 'PUBLIC') {
    return visibility;
  }
  return 'PUBLIC';
}

export function canCreateShareLinkForVisibility(visibility?: string | null): boolean {
  return normalizeMatchVisibility(visibility) !== 'PRIVATE';
}

export async function canUserAccessCircleMatch(matchId: string, userId: string): Promise<boolean> {
  const match = await prisma.match.findUnique({
    where: { id: matchId },
    select: {
      createdByUserId: true,
      ctId: true,
      player1Id: true,
      player2Id: true,
      player1PartnerId: true,
      player2PartnerId: true,
      isTemplate: true,
      isOfficialClubAnnotation: true,
      annotationSessions: { where: { isActive: true }, select: { annotatorUserId: true } },
    },
  });
  if (!match) return false;

  const actor = await getActor(userId);
  if (!actor) return false;

  const participantPlayerIds = [
    match.player1Id,
    match.player2Id,
    match.player1PartnerId,
    match.player2PartnerId,
  ].filter((id): id is string => Boolean(id));

  const matchAccess: MatchAccess = {
    createdByUserId: match.createdByUserId,
    ctId: match.ctId,
    isTemplate: Boolean(match.isTemplate),
    isOfficialClubAnnotation: Boolean(match.isOfficialClubAnnotation),
    annotatorUserIds: match.annotationSessions.map((s) => s.annotatorUserId),
    participantPlayerIds,
    participantCtIds: [],
  };

  return isDirectlyInvolvedInMatch(actor, matchAccess);
}
