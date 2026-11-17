import type { RankingEntryLike } from '@/lib/ranking/format-rankings';

/** Situação da conta de acesso do atleta (mesma semântica das duas tabelas). */
export type AthleteStatus = 'ACTIVE' | 'PASSWORD_PENDING' | 'NO_ACCOUNT';

/** Linha normalizada exibida na tabela de atletas (gestor e treinador). */
export interface AthleteTableRowData {
  id: string;
  name: string;
  nickname?: string | null;
  cpf?: string | null;
  cpfLast2?: string | null;
  gender?: string | null;
  birthDate?: string | null;
  createdAt?: string | null;
  age?: number | null;
  rankings?: Record<string, RankingEntryLike> | null;
  /** Procedência (A0.12 Fase 7): "Clube - UF" quando informados. */
  origin?: string | null;
  status: AthleteStatus;
  isMinor?: boolean;
  isConsented?: boolean;
}

/** Callbacks de ação aplicadas a cada linha da tabela. */
export interface AthleteTableRowActions {
  onEdit: () => void;
  onDelete: () => void;
  onView?: () => void;
  onGenerateLink?: () => void;
  onEcaConsent?: () => void;
  loadingLink?: boolean;
  /** Rótulo do botão de edição: "Editar" ou "Ver Ficha" (treinador de clube). */
  editLabel?: string;
  /** Quando presente, o botão de edição é desabilitado com esse motivo. */
  editDisabledReason?: string | null;
  canDelete?: boolean;
  isClubCoach?: boolean;
  isUnder18?: boolean;
  isMinorConsented?: boolean;
  /** Define o tooltip do botão Link (conta já criada vs. pendente de criação). */
  hasAccount?: boolean;
}
