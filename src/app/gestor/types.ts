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
  player1: { id: string; name: string };
  player2: { id: string; name: string };
  createdByUser: { id: string; name: string; email: string } | null;
  scoreState?: unknown;
}

export type GestorTab = 'coaches' | 'athletes' | 'matches' | 'club' | 'managers' | 'clubs';
export type MemberType = 'TREINADOR' | 'ATLETA';
