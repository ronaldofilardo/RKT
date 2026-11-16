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
    backhand?: string | null;
    rankings?: Record<string, any> | null;
    guardianGate?: string | null;
    isConsented?: boolean;
    guardianName?: string | null;
    guardianCpf?: string | null;
    guardianPhone?: string | null;
    guardianRelationship?: string | null;
    user: { id: string; name: string; cpf: string; email: string; mustChangePassword: boolean } | null;
  };
}

export type { ClubMatchItem } from './types-matches';

export type GestorTab = 'coaches' | 'athletes' | 'affiliates' | 'matches' | 'club';
export type MemberType = 'TREINADOR' | 'ATLETA';
