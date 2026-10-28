export type CtStatus = 'PENDING' | 'ACTIVE' | 'SUSPENDED';

export type MenuSectionKey =
  | 'operacao'
  | 'atleta'
  | 'treinador'
  | 'gestao'
  | 'suporte'
  | 'admin'
  | 'rodape';

export interface MenuItem {
  key: string;
  label: string;
  icon?: string;
  /** Rota de destino. Ausente em itens desabilitados e em ações. */
  href?: string;
  /** Ação especial tratada pela UI (ex.: confirmação de logout). */
  action?: 'logout';
  /** Item ainda não desenvolvido: renderizado desabilitado, sem navegação. */
  disabled?: boolean;
  badge?: string;
}

export interface MenuSection {
  key: MenuSectionKey;
  title: string;
  items: MenuItem[];
}

export interface AthleteContext {
  playerId: string;
  /** CTs com vínculo ativo. Vazio = atleta avulso. */
  ctIds: string[];
  isMinor: boolean;
}

export interface CoachContext {
  /** CTs com vínculo de treinador ativo. Vazio = treinador avulso. */
  ctIds: string[];
}

export interface GestorContext {
  ctIds: string[];
  ctStatus: CtStatus | null;
}

/** Campos aditivos de GET /api/auth/me usados para montar o menu. */
export interface MeAccess {
  canOperate: boolean;
  isAdmin: boolean;
  isSuporte: boolean;
  athlete: AthleteContext | null;
  coach: CoachContext | null;
}

/** Entrada da função pura `buildMenu`. */
export interface MenuContext {
  isActive: boolean;
  mustChangePassword: boolean;
  canOperate: boolean;
  isAdmin: boolean;
  isSuporte: boolean;
  gestor: GestorContext | null;
  coach: CoachContext | null;
  athlete: AthleteContext | null;
}
