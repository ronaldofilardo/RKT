import { activeCtIds } from './scope';
import type { Actor } from './types';

/** Dados da partida necessários para decidir quem lê (§6.3). */
export interface MatchAccess {
  createdByUserId?: string | null;
  /** CT dono da partida. */
  ctId?: string | null;
  annotatorUserIds: readonly string[];
  participantPlayerIds: readonly string[];
  /** CTs dos participantes (via PlayerCT). */
  participantCtIds: readonly string[];
}

function staffCtIds(actor: Actor): string[] {
  return [...activeCtIds(actor, 'GESTOR'), ...activeCtIds(actor, 'TREINADOR')];
}

function isCreatorOrAnnotator(actor: Actor, m: MatchAccess): boolean {
  return m.createdByUserId === actor.userId || m.annotatorUserIds.includes(actor.userId);
}

function isOwnerCtStaff(actor: Actor, m: MatchAccess): boolean {
  return !!m.ctId && staffCtIds(actor).includes(m.ctId);
}

/** Quem pode ler a partida e seus relatórios (`report:view`). Nega por padrão. */
export function canReadMatch(actor: Actor | null | undefined, m: MatchAccess): boolean {
  if (!actor || !actor.isActive) return false;
  if (isCreatorOrAnnotator(actor, m) || isOwnerCtStaff(actor, m)) return true;
  const ids = m.participantPlayerIds;
  if (actor.athletePlayerId && ids.includes(actor.athletePlayerId)) return true;
  if (actor.guardianOfPlayerIds.some((id) => ids.includes(id))) return true;
  const ctIds = staffCtIds(actor);
  return m.participantCtIds.some((id) => ctIds.includes(id));
}

/** Comentários do anotador: só criador, anotador e equipe do CT dono. */
export function canReadMatchComments(actor: Actor | null | undefined, m: MatchAccess): boolean {
  if (!actor || !actor.isActive) return false;
  return isCreatorOrAnnotator(actor, m) || isOwnerCtStaff(actor, m);
}
