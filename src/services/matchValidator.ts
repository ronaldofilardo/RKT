import { ScoringEngine } from "@/core/scoring/engine";
import type { MatchFormat, MatchState, MatchFinishReason } from "@/schemas/contracts";

interface MatchData {
  format: MatchFormat;
  player1Id: string;
  player2Id: string;
  initialServerId?: string | null;
  scoreState?: unknown;
  state: MatchState;
}

interface ValidationResult {
  error?: string;
  valid: boolean;
}

export function validateFinishMatch(
  match: MatchData,
  scoreState?: unknown,
  reason?: MatchFinishReason,
): ValidationResult {
  if (match.state === 'FINISHED') {
    return { error: 'ALREADY_FINISHED: Partida já está finalizada', valid: false };
  }

  if (match.state === 'CANCELLED') {
    return { error: 'CANNOT_FINISH_CANCELLED: Partida cancelada não pode ser finalizada', valid: false };
  }

  if (reason === 'ABANDONED' || reason === 'WALKOVER' || reason === 'INJURY' || reason === 'OUTRO') {
    return { valid: true };
  }

  if (!scoreState && !match.scoreState) {
    return { error: 'CANNOT_FINISH: Partida sem pontuação registrada', valid: false };
  }

  if (!match.initialServerId) {
    return { error: 'MATCH_NOT_STARTED: Partida sem primeiro sacador definido', valid: false };
  }

  const stateToValidate = scoreState ? JSON.stringify(scoreState) : JSON.stringify(match.scoreState);
  const engine = ScoringEngine.fromSerialized(
    {
      format: match.format,
      player1Id: match.player1Id,
      player2Id: match.player2Id,
      initialServerId: match.initialServerId,
    },
    stateToValidate,
  );

  if (!engine.isFinished()) {
    return { error: 'CANNOT_FINISH: Motor de pontuação indica partida em andamento', valid: false };
  }

  // Valida se o winner está definido no estado do engine
  const winner = engine.getWinner();
  if (!winner) {
    return { error: 'CANNOT_FINISH: Estado do placar não define um vencedor', valid: false };
  }

  return { valid: true };
}

export function validateTransitionState(
  match: MatchData,
  newState: MatchState,
  scoreState?: unknown,
  options?: { allowScoreEdit?: boolean },
): ValidationResult {
  const ALLOWED_TRANSITIONS: Record<MatchState, MatchState[]> = {
    SCHEDULED: ["IN_PROGRESS", "CANCELLED"],
    IN_PROGRESS: ["IN_PROGRESS", "FINISHED", "CANCELLED"],
    FINISHED: [],
    CANCELLED: [],
  };

  if (!ALLOWED_TRANSITIONS[match.state].includes(newState)) {
    return {
      error: `INVALID_TRANSITION: Transição ${match.state} → ${newState} não permitida`,
      valid: false,
    };
  }

  if (newState === "FINISHED") {
    if (!match.scoreState && !scoreState) {
      return { error: "CANNOT_FINISH: Partida sem pontuação registrada", valid: false };
    }
    if (!match.initialServerId) {
      return { error: "MATCH_NOT_STARTED: Partida sem primeiro sacador definido", valid: false };
    }

    const stateToValidate = scoreState ? JSON.stringify(scoreState) : JSON.stringify(match.scoreState);
    const engine = ScoringEngine.fromSerialized(
      {
        format: match.format,
        player1Id: match.player1Id,
        player2Id: match.player2Id,
        initialServerId: match.initialServerId,
      },
      stateToValidate,
    );
    if (!engine.isFinished()) {
      return { error: "CANNOT_FINISH: Motor de pontuação indica partida em andamento", valid: false };
    }
  }

  if (scoreState && match.scoreState) {
    const oldState = match.scoreState as any;
    const newState_ = scoreState as any;
    const oldWon = oldState?.setsWon ?? { player1: 0, player2: 0 };
    const newWon = newState_?.setsWon ?? { player1: 0, player2: 0 };

    if (
      typeof newWon.player1 === "number" &&
      typeof newWon.player2 === "number" &&
      (newWon.player1 < oldWon.player1 || newWon.player2 < oldWon.player2)
    ) {
      return { error: "SCORE_REGRESSION: Placar não pode ser inferior ao estado atual", valid: false };
    }

    if (!options?.allowScoreEdit) {
      if (
        typeof newWon.player1 === "number" &&
        typeof newWon.player2 === "number" &&
        newWon.player1 === oldWon.player1 &&
        newWon.player2 === oldWon.player2 &&
        isCurrentGameRegressing(oldState?.currentGame, newState_?.currentGame)
      ) {
        const oldLastSet = oldState?.sets?.[(oldState.sets.length || 1) - 1];
        const newLastSet = newState_?.sets?.[(newState_.sets.length || 1) - 1];
        const sameCurrentGameContext =
          oldLastSet && newLastSet
            ? oldLastSet.player1 === newLastSet.player1 &&
              oldLastSet.player2 === newLastSet.player2
            : true;

        if (sameCurrentGameContext) {
          return { error: "SCORE_REGRESSION: Placar não pode ser inferior ao estado atual", valid: false };
        }
      }

      const oldLastSet = oldState?.sets?.[(oldState.sets.length || 1) - 1];
      const newLastSet = newState_?.sets?.[(newState_.sets.length || 1) - 1];

      if (oldLastSet && newLastSet && isTiebreakRegressing(oldLastSet, newLastSet)) {
        return { error: "SCORE_REGRESSION: Tie-break não pode regredir", valid: false };
      }
    }
  }

  return { valid: true };
}

export function getGameProgress(cg: any, player: string): number {
  if (!cg) return 0;
  const p = typeof cg[player] === 'number' ? cg[player] : 0;
  if (cg.isDeuce) {
    if (cg.advantage === player) return 4;
    return 3;
  }
  return p;
}

export function isCurrentGameRegressing(oldCG: any, newCG: any): boolean {
  if (!oldCG || !newCG) return false;

  const oldP1 = getGameProgress(oldCG, 'player1');
  const oldP2 = getGameProgress(oldCG, 'player2');
  const newP1 = getGameProgress(newCG, 'player1');
  const newP2 = getGameProgress(newCG, 'player2');

  return (
    (newP1 < oldP1 && newP2 <= oldP2) ||
    (newP2 < oldP2 && newP1 <= oldP1)
  );
}

export function isTiebreakRegressing(oldSet: any, newSet: any): boolean {
  if (!oldSet || !newSet) return false;
  
  const oldTb = oldSet.tiebreakScore;
  const newTb = newSet.tiebreakScore;
  
  if (oldTb && newTb) {
    return (
      (newTb.player1 < oldTb.player1 && newTb.player2 <= oldTb.player2) ||
      (newTb.player2 < oldTb.player2 && newTb.player1 <= oldTb.player1)
    );
  }
  
  if (oldTb && !newTb && oldSet.isTiebreak) {
    if (oldSet.player1 > 0 || oldSet.player2 > 0) {
      return (
        (newSet.player1 < oldSet.player1 && newSet.player2 <= oldSet.player2) ||
        (newSet.player2 < oldSet.player2 && newSet.player1 <= oldSet.player1)
      );
    }
  }
  
  if (oldSet.isTiebreak && !oldTb && oldSet.player1 >= 6 && oldSet.player2 >= 6) {
    if (newSet.player1 > 0 || newSet.player2 > 0) {
      return (
        (newSet.player1 < oldSet.player1 && newSet.player2 <= oldSet.player2) ||
        (newSet.player2 < oldSet.player2 && newSet.player1 <= oldSet.player1)
      );
    }
  }
  
  return false;
}