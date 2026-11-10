/**
 * Tipos para o Painel do Gestor.
 */

export interface MeResponse {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    cpf: string;
    mustChangePassword: boolean;
  };
  memberships: Array<{ kind: string; ctId: string | null; status: string }>;
  ctStatus: 'PENDING' | 'ACTIVE' | 'SUSPENDED' | null;
}

export interface CoachItem {
  id: string;
  user: {
    id: string;
    name: string;
    cpf: string;
    email: string;
    createdAt: string;
    mustChangePassword: boolean;
  };
  canInsertAthletes: boolean;
}

export interface AthleteItem {
  player: {
    id: string;
    name: string;
    nickname?: string | null;
    cpf: string;
    email: string | null;
    birthDate: string | null;
    age?: number | null;
    cpfLast2?: string | null;
    gender: string;
    dominance: string | null;
    user: {
      id: string;
      name: string;
      cpf: string;
      email: string;
      mustChangePassword: boolean;
    } | null;
  };
}

export interface ClubMatchItem {
  id: string;
  format: string;
  state: string;
  createdAt: string;
  startedAt: string | null;
  finishedAt: string | null;
  createdByUserId: string | null;
  assignedCoachId?: string | null;
  assignedCoach?: { id: string; name: string; email?: string } | null;
  isPublicTemplate?: boolean;
  player1: { id: string; name: string; club?: string | null };
  player2: { id: string; name: string; club?: string | null };
  createdByUser: { id: string; name: string; email: string } | null;
  scoreState?: unknown;
  /** Presente quando esta partida é uma anotação derivada de um cartaz público. */
  sourceMatchId?: string | null;
  sourceMatch?: {
    id: string;
    scheduledAt: string | null;
    format: string;
    player1: { name: string };
    player2: { name: string };
  } | null;
}

export type GestorTab = 'coaches' | 'athletes' | 'matches' | 'club';
export type MemberType = 'TREINADOR' | 'ATLETA';
