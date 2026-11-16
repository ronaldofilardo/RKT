import type { Actor, MatchAccess } from './types';
import { activeCtIds } from './scope';

/**
 * Determina se o usuário autenticado está diretamente envolvido na partida:
 * 1. Atleta participante (em quadra).
 * 2. Responsável legal com vínculo ativo de qualquer um dos atletas.
 * 3. Gestor ativo do CT onde a partida ocorre ou dos CTs dos atletas.
 * 4. Treinador vinculado aos atletas participantes (followedPlayerIds).
 *
 * Se false, qualquer atleta menor terá seu nome obrigatoriamente randomizado.
 */
export function isDirectlyInvolvedInMatch(
  actor: Actor | null | undefined,
  match: MatchAccess,
): boolean {
  if (!actor || !actor.isActive) return false;

  const participants = match.participantPlayerIds ?? [];

  // 1. O próprio atleta em quadra
  if (actor.athletePlayerId && participants.includes(actor.athletePlayerId)) {
    return true;
  }

  // 2. Responsável legal ativo de qualquer atleta da partida
  const guardians = actor.guardianOfPlayerIds ?? [];
  if (guardians.some((id) => participants.includes(id))) {
    return true;
  }

  // 3. Gestor do CT da partida ou dos CTs dos atletas
  const gestorCts = activeCtIds(actor, 'GESTOR');
  if (gestorCts.length > 0) {
    if (match.ctId && gestorCts.includes(match.ctId)) return true;
    const participantCts = match.participantCtIds ?? [];
    if (participantCts.some((ct) => gestorCts.includes(ct))) return true;
  }

  // 4. Treinador acompanhando qualquer um dos atletas participantes
  const followed = actor.followedPlayerIds ?? [];
  if (followed.some((id) => participants.includes(id))) {
    return true;
  }

  // 5. Treinador de CT envolvido que anotou esta partida específica
  const isAnnotator =
    (match.createdByUserId && match.createdByUserId === actor.userId) ||
    (match.annotatorUserIds && match.annotatorUserIds.includes(actor.userId));
  if (isAnnotator) {
    const coachCts = activeCtIds(actor, 'TREINADOR');
    if (coachCts.length > 0) {
      if (match.ctId && coachCts.includes(match.ctId)) return true;
      const participantCts = match.participantCtIds ?? [];
      if (participantCts.some((ct) => coachCts.includes(ct))) return true;
    }
  }

  return false;
}
