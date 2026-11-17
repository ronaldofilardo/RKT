/**
 * Tipos de partidas do clube no Painel do Gestor.
 */

export interface ClubMatchItem {
  id: string;
  format: string;
  state: string;
  createdAt: string;
  scheduledAt?: string | null;
  startedAt: string | null;
  finishedAt: string | null;
  tournamentName?: string | null;
  category?: string | null;
  round?: string | null;
  bracketType?: string | null;
  courtType?: string | null;
  visibility?: string | null;
  temperature?: number | null;
  humidity?: number | null;
  details?: string | null;
  clubName?: string | null;
  version?: number;
  ctId?: string | null;
  createdByUserId: string | null;
  assignedCoachId?: string | null;
  assignedCoach?: { id: string; name: string; email?: string } | null;
  assignedCoaches?: Array<{ coach: { id: string; name: string; email?: string } }> | null;
  isPublicTemplate?: boolean;
  isTemplate?: boolean;
  eventScope?: string;
  isOfficialClubAnnotation?: boolean;
  isDesignatedAnnotator?: boolean;
  pointCount?: number;
  matchType?: 'SINGLES' | 'DOUBLES';
  player1PartnerId?: string | null;
  player2PartnerId?: string | null;
  player1: {
    id: string;
    name: string;
    club?: string | null;
    isClubAthlete?: boolean;
    coachAthleteLinks?: Array<{ coach: { name: string } }> | null;
  };
  player2: {
    id: string;
    name: string;
    club?: string | null;
    isClubAthlete?: boolean;
    coachAthleteLinks?: Array<{ coach: { name: string } }> | null;
  };
  player1Partner?: {
    id: string;
    name: string;
    club?: string | null;
    isClubAthlete?: boolean;
    coachAthleteLinks?: Array<{ coach: { name: string } }> | null;
  } | null;
  player2Partner?: {
    id: string;
    name: string;
    club?: string | null;
    isClubAthlete?: boolean;
    coachAthleteLinks?: Array<{ coach: { name: string } }> | null;
  } | null;
  createdByUser: {
    id: string;
    name: string;
    email: string;
    role?: string;
    memberships?: Array<{ kind: string; ct?: { name: string } | null }> | null;
    athleteProfile?: { id: string } | null;
  } | null;
  creatorRoleLabel?: string;
  scoreState?: unknown;
  /** Presente quando esta partida é uma anotação derivada de um cartaz público ou privado. */
  sourceMatchId?: string | null;
  sourceMatch?: {
    id: string;
    scheduledAt: string | null;
    format: string;
    eventScope?: string;
    matchType?: 'SINGLES' | 'DOUBLES';
    assignedCoachId?: string | null;
    assignedCoach?: { id: string; name: string; email?: string } | null;
    assignedCoaches?: Array<{ coach: { id: string; name: string; email?: string } }> | null;
    player1: { name: string };
    player2: { name: string };
    player1Partner?: { name: string } | null;
    player2Partner?: { name: string } | null;
  } | null;
}
