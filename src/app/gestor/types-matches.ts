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
  createdByUserId: string | null;
  assignedCoachId?: string | null;
  assignedCoach?: { id: string; name: string; email?: string } | null;
  isPublicTemplate?: boolean;
  isTemplate?: boolean;
  eventScope?: string;
  isOfficialClubAnnotation?: boolean;
  isDesignatedAnnotator?: boolean;
  pointCount?: number;
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
    assignedCoachId?: string | null;
    assignedCoach?: { id: string; name: string; email?: string } | null;
    player1: { name: string };
    player2: { name: string };
  } | null;
}
