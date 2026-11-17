import { prisma } from '@/lib/prisma';
import { resolveCreatorRoleLabel } from '@/app/gestor/gestor-match-display.logic';

export async function loadGestorExternalScheduledMatches(
  ctId: string,
  clubUserIds: string[],
  clubPlayerIds: string[],
) {
  if (clubPlayerIds.length === 0) return [];

  const rows = await prisma.match.findMany({
    where: {
      deletedAt: null,
      sourceMatchId: null,
      OR: [
        { player1Id: { in: clubPlayerIds } },
        { player2Id: { in: clubPlayerIds } },
        { player1PartnerId: { in: clubPlayerIds } },
        { player2PartnerId: { in: clubPlayerIds } },
      ],
      AND: [
        { OR: [{ ctId: null }, { ctId: { not: ctId } }] },
        ...(clubUserIds.length > 0 ? [{ createdByUserId: { notIn: clubUserIds } }] : []),
      ],
    },
    select: {
      id: true, format: true, state: true, createdAt: true, startedAt: true, finishedAt: true,
      scheduledAt: true, scoreState: true, createdByUserId: true, assignedCoachId: true,
      matchType: true, player1PartnerId: true, player2PartnerId: true,
      category: true, round: true, bracketType: true, courtType: true,
      visibility: true, temperature: true, humidity: true, details: true,
      clubName: true, version: true, ctId: true,
      assignedCoach: { select: { id: true, name: true, email: true } },
      assignedCoaches: {
        select: {
          coach: { select: { id: true, name: true, email: true } },
        },
      },
      isPublicTemplate: true, isTemplate: true, eventScope: true,
      isOfficialClubAnnotation: true, sourceMatchId: true, tournamentName: true,
      player1: {
        select: {
          id: true, name: true, club: true,
          coachAthleteLinks: {
            where: { status: 'ACTIVE' },
            select: { coach: { select: { name: true } } },
            take: 1,
          },
        },
      },
      player2: {
        select: {
          id: true, name: true, club: true,
          coachAthleteLinks: {
            where: { status: 'ACTIVE' },
            select: { coach: { select: { name: true } } },
            take: 1,
          },
        },
      },
      player1Partner: {
        select: {
          id: true, name: true, club: true,
          coachAthleteLinks: {
            where: { status: 'ACTIVE' },
            select: { coach: { select: { name: true } } },
            take: 1,
          },
        },
      },
      player2Partner: {
        select: {
          id: true, name: true, club: true,
          coachAthleteLinks: {
            where: { status: 'ACTIVE' },
            select: { coach: { select: { name: true } } },
            take: 1,
          },
        },
      },
      createdByUser: {
        select: {
          id: true, name: true, email: true, role: true,
          memberships: {
            where: { status: 'ACTIVE' },
            select: { kind: true, ct: { select: { name: true } } },
          },
          athleteProfile: { select: { id: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  return rows.map((m) => ({
    ...m,
    pointCount: 0,
    isDesignatedAnnotator: false,
    sourceMatch: null,
    creatorRoleLabel: resolveCreatorRoleLabel(m.createdByUser),
    player1: m.player1 ? { ...m.player1, isClubAthlete: clubPlayerIds.includes(m.player1.id) } : m.player1,
    player2: m.player2 ? { ...m.player2, isClubAthlete: clubPlayerIds.includes(m.player2.id) } : m.player2,
    player1Partner: m.player1Partner ? { ...m.player1Partner, isClubAthlete: clubPlayerIds.includes(m.player1Partner.id) } : (m.player1Partner ?? null),
    player2Partner: m.player2Partner ? { ...m.player2Partner, isClubAthlete: clubPlayerIds.includes(m.player2Partner.id) } : (m.player2Partner ?? null),
  }));
}
