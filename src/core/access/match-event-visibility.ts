/**
 * Núcleo puro de descoberta de cartazes (eventos).
 * Distinção entre "ver que a partida existe para anotar a própria versão"
 * (acesso ao Cartaz) e "ver a marcação de alguém" (acesso à Anotação).
 *
 * Regra R-03: ≤ 100 linhas.
 */

import type { Actor } from './types';

/** Dados mínimos do cartaz (template) necessários para decidir descoberta. */
export interface MatchTemplateAccess {
  eventScope: 'PUBLIC' | 'PRIVATE_CLUB' | 'PRIVATE_COACH' | 'PRIVATE_PLAYERS' | 'PRIVATE_PERSONAL';
  createdByUserId?: string | null;
  ctId?: string | null;
  /** IDs dos jogadores participantes (player1Id, player2Id, player1PartnerId, player2PartnerId). */
  participantPlayerIds: readonly string[];
}

function isParticipantOrRelated(actor: Actor, participantPlayerIds: readonly string[]): boolean {
  if (actor.athletePlayerId && participantPlayerIds.includes(actor.athletePlayerId)) return true;
  if (actor.guardianOfPlayerIds.some((id) => participantPlayerIds.includes(id))) return true;
  if (actor.followedPlayerIds?.some((id) => participantPlayerIds.includes(id))) return true;
  return false;
}

/**
 * Verifica se o ator pode descobrir o cartaz para criar sua própria anotação.
 * "Descobrir" = ver que a partida existe e pode clicar em "Anotar minha versão".
 */
export function canDiscoverMatchTemplate(
  actor: Actor | null | undefined,
  template: MatchTemplateAccess,
): boolean {
  if (!actor || !actor.isActive) return false;

  switch (template.eventScope) {
    case 'PUBLIC':
      // Qualquer usuário autenticado ativo pode anotar a própria versão.
      return true;

    case 'PRIVATE_CLUB': {
      // Gestor ou treinador ativo do CT dono, atleta participante,
      // responsável de menor participante ou treinador particular do atleta.
      if (template.ctId) {
        const staffCtIds = actor.memberships
          .filter((m) => m.status === 'ACTIVE' && (m.kind === 'GESTOR' || m.kind === 'TREINADOR') && m.ctId === template.ctId);
        if (staffCtIds.length > 0) return true;
      }
      return isParticipantOrRelated(actor, template.participantPlayerIds);
    }

    case 'PRIVATE_COACH': {
      // O próprio treinador criador OU atletas participantes OU responsáveis OU treinador que acompanha.
      if (template.createdByUserId && template.createdByUserId === actor.userId) return true;
      return isParticipantOrRelated(actor, template.participantPlayerIds);
    }

    case 'PRIVATE_PLAYERS': {
      // O criador do cartaz sempre o descobre (ex.: anotador ou responsável que
      // não é um dos jogadores marcados) — sem isso ele não veria o próprio cartaz.
      if (template.createdByUserId && template.createdByUserId === actor.userId) return true;
      return isParticipantOrRelated(actor, template.participantPlayerIds);
    }

    case 'PRIVATE_PERSONAL':
    default:
      // Apenas o próprio criador.
      return !!template.createdByUserId && template.createdByUserId === actor.userId;
  }
}