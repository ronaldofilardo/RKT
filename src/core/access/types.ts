export type PlatformPreset = 'ADMIN' | 'SUPORTE';
export type MembershipKind = 'PLATAFORMA' | 'GESTOR' | 'TREINADOR';
export type MembershipStatus = 'ACTIVE' | 'SUSPENDED' | 'ENDED';

/** Perfil calculado a partir dos vínculos (não é armazenado). */
export type Profile =
  | 'ADMIN'
  | 'SUPORTE'
  | 'GESTOR'
  | 'TREINADOR'
  | 'ATLETA'
  | 'RESPONSAVEL'
  | 'OPERACIONAL';

/** Escopos: ver matriz §5. SELF = o próprio atleta. */
export type Scope =
  | 'ANY'
  | 'P'
  | 'CT'
  | 'PROP'
  | 'SELF'
  | 'RESP'
  | 'FOLLOW'
  | 'NON_PLATFORM_TARGET';

export interface ActorMembership {
  kind: MembershipKind;
  preset?: PlatformPreset | null;
  ctId?: string | null;
  status: MembershipStatus;
}

export interface Actor {
  userId: string;
  isActive: boolean;
  /** Base operacional (o "anotador"): cadastrar/buscar atletas, criar e anotar partidas. */
  canOperate: boolean;
  memberships: readonly ActorMembership[];
  /** Player ligado à conta (vínculo ATLETA), se houver. */
  athletePlayerId?: string | null;
  /** CTs do(s) atleta(s) ligado(s) à conta via PlayerCT (escopo "Meu clube"). */
  athleteCtIds: readonly string[];
  /** Players menores sob responsabilidade desta conta (vínculo ativo). */
  guardianOfPlayerIds: readonly string[];
  /** Atletas com vínculo de acompanhamento ativo deste treinador. */
  followedPlayerIds: readonly string[];
}

/** Recurso sobre o qual a ação é pedida. Campos ausentes = sem informação. */
export interface Resource {
  ctId?: string | null;
  ownerUserId?: string | null;
  playerId?: string | null;
  /** O alvo de uma gestão de vínculo é Admin/Suporte (plataforma). */
  targetsPlatform?: boolean;
}

export type DecisionReason = 'ok' | 'inactive' | 'no-permission' | 'out-of-scope';

export interface Decision {
  allow: boolean;
  reason: DecisionReason;
}
