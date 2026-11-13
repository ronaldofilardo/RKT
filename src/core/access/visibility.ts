import type { Actor, MatchAccess } from './types';
import { activeCtIds } from './scope';

export type { MatchAccess };

export interface ReadMatchOptions {
  /** Gancho futuro: permite que atleta participante leia a anotação oficial designada pelo clube. */
  allowParticipantOfficialRead?: boolean;
  /** Permite que o gestor do CT de um dos atletas participantes acesse o relatório/timeline. */
  allowParticipantClubGestor?: boolean;
}

function isOwner(actor: Actor, m: MatchAccess): boolean {
  return !!m.createdByUserId && m.createdByUserId === actor.userId;
}

function isOwnerCtGestor(actor: Actor, m: MatchAccess): boolean {
  if (!m.ctId) return false;
  if (actor.activeContextId === 'PARTICULAR') return false;
  if (actor.activeContextId && actor.activeContextId !== m.ctId) return false;
  return activeCtIds(actor, 'GESTOR').includes(m.ctId);
}

function isParticipantClubGestor(actor: Actor, m: MatchAccess): boolean {
  if (actor.activeContextId === 'PARTICULAR') return false;
  const gestorCts = activeCtIds(actor, 'GESTOR');
  if (gestorCts.length === 0) return false;
  const targetCts = actor.activeContextId ? [actor.activeContextId] : gestorCts;
  return targetCts.some((ct) => m.participantCtIds.includes(ct));
}

/**
 * Quem pode ler a anotação e seus relatórios (`report:view`). Nega por padrão.
 * Isolamento estrito: apenas o anotador dono e o Gestor ativo do CT dono da anotação.
 */
export function canReadMatch(
  actor: Actor | null | undefined,
  m: MatchAccess,
  options?: ReadMatchOptions,
): boolean {
  if (!actor || !actor.isActive || m.isTemplate) return false;
  if (isOwner(actor, m)) return true;
  if (isOwnerCtGestor(actor, m)) return true;
  if (options?.allowParticipantClubGestor && isParticipantClubGestor(actor, m)) return true;

  if (
    options?.allowParticipantOfficialRead &&
    m.isOfficialClubAnnotation &&
    actor.athletePlayerId &&
    m.participantPlayerIds.includes(actor.athletePlayerId)
  ) {
    return true;
  }

  return false;
}

/**
 * Quem pode anotar (registrar ponto / alterar estado). Nega por padrão.
 * Isolamento estrito: apenas o anotador dono (`createdByUserId`) e nunca em cartazes (`isTemplate`).
 */
export function canAnnotateMatch(actor: Actor | null | undefined, m: MatchAccess): boolean {
  if (!actor || !actor.isActive || m.isTemplate) return false;
  if (!isOwner(actor, m)) return false;

  if (actor.activeContextId) {
    if (actor.activeContextId === 'PARTICULAR' && m.ctId) return false;
    if (actor.activeContextId !== 'PARTICULAR' && m.ctId !== actor.activeContextId) return false;
  }

  return true;
}

/** Quem pode ler comentários da partida (soberania da anotação: anotador dono e gestor do CT dono). */
export function canReadMatchComments(actor: Actor | null | undefined, m: MatchAccess): boolean {
  if (!actor || !actor.isActive || m.isTemplate) return false;
  return isOwner(actor, m) || isOwnerCtGestor(actor, m);
}

/** Quem pode acompanhar a transmissão ao vivo (concessão explícita por convite ou leitura autorizada). */
export function canWatchMatch(
  actor: Actor | null | undefined,
  m: MatchAccess,
  hasExplicitShareGrant = false,
): boolean {
  if (!actor || !actor.isActive || m.isTemplate) return false;
  if (hasExplicitShareGrant) return true;
  return canReadMatch(actor, m);
}
