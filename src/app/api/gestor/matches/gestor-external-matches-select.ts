const COACH_LINK_SELECT = {
  where: { status: 'ACTIVE' as const },
  select: { coach: { select: { name: true } } },
  take: 1,
};

const PLAYER_SELECT = {
  select: {
    id: true,
    name: true,
    club: true,
    coachAthleteLinks: COACH_LINK_SELECT,
  },
};

export const GESTOR_EXTERNAL_MATCH_SELECT = {
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
  player1: PLAYER_SELECT,
  player2: PLAYER_SELECT,
  player1Partner: PLAYER_SELECT,
  player2Partner: PLAYER_SELECT,
  createdByUser: {
    select: {
      id: true, name: true, email: true, role: true,
      memberships: {
        where: { status: 'ACTIVE' as const },
        select: { kind: true, ct: { select: { name: true } } },
      },
      athleteProfile: { select: { id: true } },
    },
  },
} as const;
