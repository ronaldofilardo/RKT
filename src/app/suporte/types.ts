/**
 * Tipos para o Painel do Suporte.
 */

export interface TrainingCenter {
  id: string;
  name: string;
  slug: string;
  status: string;
  cnpj: string | null;
  legalName: string | null;
  phone: string | null;
  email: string | null;
  address: any;
  legalRepName: string | null;
  legalRepCpf: string | null;
  legalRepEmail: string | null;
  legalRepPhone: string | null;
}

export interface UserItem {
  id: string;
  name: string;
  email: string;
  cpf: string;
  role: string;
  canOperate: boolean;
  isActive: boolean;
  createdAt: string;
}

export interface MembershipItem {
  id: string;
  userId: string;
  kind: string;
  ctId: string | null;
  status: string;
  createdAt: string;
}

export type SuporteModule = 'clubes' | 'gestores' | 'avulsos';

export type CtStatusFilter = 'PENDING' | 'ACTIVE' | 'SUSPENDED' | 'ALL';

export interface SuporteData {
  clubs: TrainingCenter[];
  users: UserItem[];
  memberships: MembershipItem[];
}
