export const GESTOR_MATCH_SELECT = {
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
  _count: { select: { pointLog: { where: { voidedAt: null } } } },
  sourceMatch: {
    select: {
      id: true, scheduledAt: true, format: true, eventScope: true, ctId: true,
      matchType: true,
      assignedCoachId: true, assignedCoach: { select: { id: true, name: true, email: true } },
      assignedCoaches: {
        select: {
          coach: { select: { id: true, name: true, email: true } },
        },
      },
      player1: { select: { name: true } }, player2: { select: { name: true } },
      player1Partner: { select: { name: true } }, player2Partner: { select: { name: true } },
    },
  },
} as const;

