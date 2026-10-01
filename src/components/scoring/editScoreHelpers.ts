import type { TennisFormat } from '@/core/scoring/types';
import {
  shouldHaveTiebreak,
  getTiebreakAtForFormat,
} from '@/core/scoring/format-rules';
import { isMatchTiebreakSetIndex as isMatchTiebreakSetIndexCanonical } from '@/lib/matchConfig';
import { SCORING_LIMITS, TIEBREAK } from '@/lib/constants';

export interface SetEditData {
  p1Games: number;
  p2Games: number;
  isPartial: boolean;
  tiebreakScore?: { player1: number; player2: number };
  currentGamePoints?: { player1: number | string; player2: number | string };
}

interface SetValidation {
  isValid: boolean;
  error?: string;
  winner?: 'player1' | 'player2';
  hasTiebreak?: boolean;
  isPartial?: boolean;
  tiebreakRequired?: boolean;
}

export function getMaxValidGames(_otherGames: number, format: TennisFormat): number {
  if (format === 'MATCH_TB_10') return SCORING_LIMITS.TIEBREAK_INPUT_CAP;
  if (!shouldHaveTiebreak(format)) return SCORING_LIMITS.TIEBREAK_INPUT_CAP;

  const tiebreakAt = getTiebreakAtForFormat(format);

  // Cap fixo (tiebreakAt + 1) permite qualquer placar válido no input.
  // Placares impossíveis (ex.: 10-8 em PRO_SET_8) são bloqueados por validateSetResult
  // com mensagem clara (Item 5 do PLANO_AJUSTAR_PLACAR).
  return tiebreakAt + 1;
}

export function validateSetResult(
  result: { p1Games: number; p2Games: number },
  format: TennisFormat,
): SetValidation {
  const { p1Games, p2Games } = result;

  if (p1Games < 0 || p2Games < 0) {
    return { isValid: false, error: 'Games cannot be negative' };
  }

  if (p1Games === 0 && p2Games === 0) {
    return { isValid: true, isPartial: true };
  }

  if (format === 'MATCH_TB_10') {
    return validateMatchTiebreak(p1Games, p2Games);
  }

  const hasTiebreak = shouldHaveTiebreak(format);
  const tiebreakAt = getTiebreakAtForFormat(format);

  const gamesNeeded = format === 'PRO_SET_8' ? 8
    : (format === 'SHORT_SET_2V2_NO_AD' ? 4 : 6);

  return validateStandardSet(p1Games, p2Games, gamesNeeded, true, hasTiebreak, tiebreakAt);
}

export function validateMatchTiebreakInput(
  result: { p1Points: number; p2Points: number },
): SetValidation {
  const { p1Points, p2Points } = result;

  if (p1Points < 0 || p2Points < 0) {
    return { isValid: false, error: 'Points cannot be negative' };
  }

  if (p1Points === 0 && p2Points === 0) {
    return { isValid: true, isPartial: true };
  }

  // Match tiebreak: first to 10 with 2-point lead
  if (p1Points >= TIEBREAK.MIN_WIN_POINTS_MATCH && p1Points - p2Points >= TIEBREAK.WIN_MARGIN) {
    return { isValid: true, winner: 'player1' };
  }
  if (p2Points >= TIEBREAK.MIN_WIN_POINTS_MATCH && p2Points - p1Points >= TIEBREAK.WIN_MARGIN) {
    return { isValid: true, winner: 'player2' };
  }
  // Allow partial scores up to max points (flexible for edits)
  if (p1Points > SCORING_LIMITS.MAX_TIEBREAK_POINTS_MATCH || p2Points > SCORING_LIMITS.MAX_TIEBREAK_POINTS_MATCH) {
    return { isValid: false, error: `Maximum ${SCORING_LIMITS.MAX_TIEBREAK_POINTS_MATCH} points in match tiebreak` };
  }
  // Partial score (in progress)
  return {
    isValid: true,
    isPartial: true,
  };
}

function validateGameBounds(
  p1Games: number,
  p2Games: number,
  hasTiebreak: boolean,
  tiebreakAt: number,
): SetValidation | null {
  if (p1Games < 0 || p2Games < 0) {
    return { isValid: false, error: 'Games cannot be negative' };
  }

  if (p1Games === 0 && p2Games === 0) {
    return { isValid: true, isPartial: true };
  }

  if (hasTiebreak) {
    const maxValid = tiebreakAt + 1;
    if (p1Games > maxValid || p2Games > maxValid) {
      return { isValid: false, error: `Maximum ${maxValid} games in a set` };
    }
    if (p1Games === maxValid && p2Games === maxValid) {
      return {
        isValid: false,
        error: `Set score ${p1Games}x${p2Games} is not possible — tiebreak ends ${maxValid}x${tiebreakAt}`,
      };
    }
  }

  return null;
}

function checkTiebreakThreshold(
  p1Games: number,
  p2Games: number,
  tiebreakAt: number,
): SetValidation | null {
  if (p1Games === tiebreakAt && p2Games === tiebreakAt) {
    return {
      isValid: false,
      hasTiebreak: true,
      tiebreakRequired: true,
      error: 'Tiebreak required',
    };
  }

  if (p1Games === tiebreakAt + 1 && p2Games === tiebreakAt) {
    return { isValid: true, winner: 'player1', hasTiebreak: true, tiebreakRequired: true };
  }

  if (p2Games === tiebreakAt + 1 && p1Games === tiebreakAt) {
    return { isValid: true, winner: 'player2', hasTiebreak: true, tiebreakRequired: true };
  }

  return null;
}

function validateTiebreakLoserGames(
  winner: 'player1' | 'player2',
  p1Games: number,
  p2Games: number,
  gamesNeeded: number,
  tiebreakAt: number,
): SetValidation | null {
  const winnerGames = winner === 'player1' ? p1Games : p2Games;
  const loserGames = winner === 'player1' ? p2Games : p1Games;

  if (winnerGames === gamesNeeded + 1 && loserGames < gamesNeeded - 1) {
    return {
      isValid: false,
      hasTiebreak: true,
      error: `Set score ${p1Games}x${p2Games} is not possible — set would have ended earlier`,
    };
  }

  if (
    tiebreakAt > gamesNeeded &&
    winnerGames === tiebreakAt + 1 &&
    loserGames !== tiebreakAt
  ) {
    return {
      isValid: false,
      hasTiebreak: true,
      error: `Set score ${p1Games}x${p2Games} is not possible — ${tiebreakAt + 1} games only from ${tiebreakAt}x${tiebreakAt} tiebreak`,
    };
  }

  return null;
}

function resolveStandardWinner(
  p1Games: number,
  p2Games: number,
  gamesNeeded: number,
): 'player1' | 'player2' | null {
  if (p1Games >= gamesNeeded && p1Games - p2Games >= 2) return 'player1';
  if (p2Games >= gamesNeeded && p2Games - p1Games >= 2) return 'player2';
  return null;
}

function validateStandardSet(
  p1Games: number,
  p2Games: number,
  gamesNeeded: number,
  _withAdvantage: boolean,
  hasTiebreak: boolean,
  tiebreakAt: number,
): SetValidation {
  const boundsValidation = validateGameBounds(p1Games, p2Games, hasTiebreak, tiebreakAt);
  if (boundsValidation) return boundsValidation;

  if (hasTiebreak) {
    const tbThreshold = checkTiebreakThreshold(p1Games, p2Games, tiebreakAt);
    if (tbThreshold) return tbThreshold;
  }

  const winner = resolveStandardWinner(p1Games, p2Games, gamesNeeded);

  if (winner && hasTiebreak) {
    const loserValidation = validateTiebreakLoserGames(winner, p1Games, p2Games, gamesNeeded, tiebreakAt);
    if (loserValidation) return loserValidation;
  }

  if (!winner) {
    return { isValid: true, isPartial: true };
  }

  return {
    isValid: true,
    winner,
    hasTiebreak: hasTiebreak && (p1Games === tiebreakAt + 1 || p2Games === tiebreakAt + 1),
  };
}

function validateMatchTiebreak(p1Points: number, p2Points: number): SetValidation {
  if (p1Points >= TIEBREAK.MIN_WIN_POINTS_MATCH && p1Points - p2Points >= TIEBREAK.WIN_MARGIN) {
    return { isValid: true, winner: 'player1' };
  }
  if (p2Points >= TIEBREAK.MIN_WIN_POINTS_MATCH && p2Points - p1Points >= TIEBREAK.WIN_MARGIN) {
    return { isValid: true, winner: 'player2' };
  }
  if (p1Points > SCORING_LIMITS.MAX_TIEBREAK_POINTS_MATCH || p2Points > SCORING_LIMITS.MAX_TIEBREAK_POINTS_MATCH) {
    return { isValid: false, error: `Match Tiebreak: maximum ${SCORING_LIMITS.MAX_TIEBREAK_POINTS_MATCH} points` };
  }
  return {
    isValid: true,
    isPartial: true,
  };
}

export function isTiebreakScoreImpossible(p1: number, p2: number): boolean {
  if (p1 < 0 || p2 < 0) return false;
  if (p1 === p2) return false;

  const winner = Math.max(p1, p2);
  const loser = Math.min(p1, p2);

  if (loser < 6 && winner > 7) return true;
  if (loser >= 6 && winner > loser + 2) return true;

  return false;
}

export function getNextServerAfterSet(params: {
  currentServer: 'player1' | 'player2';
  /**
   * Sacador do Game 1 de TODA a partida (valor fixo — normalmente
   * `match.initialServerId`). Usado como âncora para recalcular o
   * sacador do set seguinte a partir da contagem total de games, em vez
   * do sacador "ao vivo" (que pode estar desatualizado em relação ao
   * placar sendo editado). Se omitido, cai para `currentServer` (mantém
   * o comportamento anterior, com os bugs conhecidos — ver comentário em
   * `computeServerForNextSetAfterTiebreak` em core/scoring/tiebreak.ts).
   */
  initialServer?: 'player1' | 'player2';
  p1Games: number;
  p2Games: number;
  format: TennisFormat;
  tiebreakPoints?: { player1: number; player2: number } | null;
  completedSets?: Array<{ player1: number; player2: number }>;
}): 'player1' | 'player2' {
  const { currentServer, initialServer = currentServer, p1Games, p2Games, format, tiebreakPoints, completedSets = [] } = params;

  // Calcular setsWon a partir dos completedSets
  const p1Sets = completedSets.filter(s => s.player1 > s.player2).length;
  const p2Sets = completedSets.filter(s => s.player2 > s.player1).length;
  
  // Usar função canônica para determinar se é MT
  const lastSetIndex = completedSets.length;
  const isMatchTiebreakSet = isMatchTiebreakSetIndexCanonical(
    lastSetIndex,
    { player1: p1Sets, player2: p2Sets },
    format as any,
  );

  // For Match Tiebreak: server alternates every 2 points (standard tiebreak).
  // First point: currentServer serves, then alternate every 2 points.
  // When tiebreakPoints is available, use it directly. When null (e.g. editing
  // a MT set from completedSets), derive total points from p1Games + p2Games
  // since in MT the "games" field actually stores the tiebreak points.
  if (isMatchTiebreakSet) {
    const totalPoints = tiebreakPoints
      ? tiebreakPoints.player1 + tiebreakPoints.player2
      : p1Games + p2Games;
    // In standard tiebreak: server serves 1 point, then alternate every 2 points.
    // Even totalPoints → same as initial server; odd → alternate.
    if (totalPoints % 2 === 0) {
      return currentServer;
    }
    return currentServer === 'player1' ? 'player2' : 'player1';
  }

  // BUG FIX (2026-09-22): sets normais e sets decididos por tiebreak comum
  // (ex.: 7-6, 10-9 em PRO_SET_8) usam a MESMA fórmula — contagem total de
  // games da partida (o placar final do set já inclui o tiebreak: 7-6 =
  // 13 games) módulo 2, a partir de uma âncora FIXA (initialServer, quem
  // sacou o game 1 de toda a partida).
  //
  // Antes: um set decidido por tiebreak comum sempre "mantinha o mesmo
  // sacador" (ramo especial isTiebreakWin), o que contraria a regra
  // oficial (ITF): quem serviu o 1º ponto do tiebreak passa a RECEBER no
  // set seguinte, ou seja, o saque troca. E mesmo o ramo geral (não
  // tiebreak) usava `currentServer` — o sacador AO VIVO, já calculado a
  // partir do placar de ANTES da edição — como se fosse uma âncora fixa,
  // o que dá resposta errada sempre que a correção do set em andamento
  // muda a paridade do total de games (ex.: corrigir 2-1 para 3-1).
  const totalGamesInMatch = completedSets.reduce(
    (sum, set) => sum + set.player1 + set.player2,
    p1Games + p2Games
  );

  if (totalGamesInMatch % 2 === 0) return initialServer;
  return initialServer === 'player1' ? 'player2' : 'player1';
}
