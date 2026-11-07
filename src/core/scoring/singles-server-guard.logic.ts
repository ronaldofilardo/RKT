import type { ScoringState } from "./types";

export interface CanChangeServerParams {
  matchType?: string | null;
  scoreState?: ScoringState | null;
  pointsHistoryCount?: number;
  isSinglesServerLocked?: boolean;
}

/**
 * Valida se a troca manual de sacador é permitida na partida atual:
 * - Em duplas: sempre permitida (regras da ITF e rotação de duplas).
 * - Em simples: permitida exclusivamente antes do início da pontuação
 *   (partida sem nenhum ponto marcado, 0-0 em games e sets, sem faltas pendentes)
 *   e desde que não tenha sido previamente travada.
 */
export function canChangeServerInMatch(params: CanChangeServerParams): boolean {
  const {
    matchType,
    scoreState,
    pointsHistoryCount = 0,
    isSinglesServerLocked = false,
  } = params;

  // Duplas mantêm as regras de negócio existentes (ITF Rule 14 / rotação just-in-time)
  if (matchType === "DOUBLES") {
    return true;
  }

  // Em simples, se já foi travada anteriormente nesta sessão ou no scoreState persistido, bloqueia
  if (isSinglesServerLocked || Boolean((scoreState as unknown as { singlesServerLocked?: boolean })?.singlesServerLocked)) {
    return false;
  }

  // Se já há pontos no histórico da partida, bloqueia
  if (pointsHistoryCount > 0) {
    return false;
  }

  // Se o scoreState ainda não está disponível, permite por padrão
  if (!scoreState) {
    return true;
  }

  // Se a partida foi finalizada, bloqueia
  if (scoreState.isFinished) {
    return false;
  }

  // Se há qualquer pontuação no game atual (15, 30, 40, ad, ou segundo saque em andamento)
  const currentGame = scoreState.currentGame;
  if (currentGame) {
    if (
      (currentGame.player1 || 0) > 0 ||
      (currentGame.player2 || 0) > 0 ||
      Boolean(currentGame.advantage) ||
      Boolean(currentGame.secondServe)
    ) {
      return false;
    }
  }

  // Se já há games fechados em qualquer set
  const sets = scoreState.sets ?? [];
  const hasGames = sets.some(
    (s) => (s.player1 || 0) > 0 || (s.player2 || 0) > 0
  );
  if (hasGames) {
    return false;
  }

  // Se há tiebreak com pontos
  const hasTiebreakPoints = sets.some(
    (s) =>
      s.tiebreakScore &&
      ((s.tiebreakScore.player1 || 0) > 0 || (s.tiebreakScore.player2 || 0) > 0)
  );
  if (hasTiebreakPoints) {
    return false;
  }

  return true;
}

