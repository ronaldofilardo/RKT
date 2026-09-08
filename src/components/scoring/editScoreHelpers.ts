import type { TennisFormat } from '@/core/scoring/types';
import {
  shouldHaveTiebreak,
  getTiebreakAtForFormat,
} from '@/core/scoring/format-rules';
import { SCORING_LIMITS, TIEBREAK } from '@/lib/constants';

export interface SetEditData {
  p1Games: number;
  p2Games: number;
  isPartial: boolean;
  tiebreakScore?: { player1: number; player2: number };
  currentGamePoints?: { player1: number | string; player2: number | string };
}

export interface SetValidation {
  isValid: boolean;
  error?: string;
  winner?: 'player1' | 'player2';
  hasTiebreak?: boolean;
  isPartial?: boolean;
  tiebreakRequired?: boolean;
}

export function getMaxValidGames(otherGames: number, format: TennisFormat): number {
  if (format === 'MATCH_TB_10') return 30;
  if (!shouldHaveTiebreak(format)) return 30;

  const tiebreakAt = getTiebreakAtForFormat(format);

  // Cap dinâmico por "otherGames" removido: ele impedia digitar 7-x/7-6
  // (o 7 era truncado para 6 quando o adversário tinha <6 games) e impedia
  // digitar 10+ em sets de Match Tiebreak de formatos melhor-de-3. O cap fixo
  // (tiebreakAt + 1) permite qualquer placar válido no input; placares
  // impossíveis (ex.: 10-8 em PRO_SET_8) são bloqueados por validateSetResult
  // com mensagem clara (Item 5 do PLANO_AJUSTAR_PLACAR).
  void otherGames;
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
    return { isValid: false, error: 'Informe o resultado do set' };
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
    return { isValid: false, error: 'Enter the tiebreak result' };
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

function validateStandardSet(
  p1Games: number,
  p2Games: number,
  gamesNeeded: number,
  _withAdvantage: boolean,
  hasTiebreak: boolean,
  tiebreakAt: number,
): SetValidation {
  if (p1Games < 0 || p2Games < 0) {
    return { isValid: false, error: 'Games cannot be negative' };
  }

  if (p1Games === 0 && p2Games === 0) {
    return { isValid: false, error: 'Informe o resultado do set' };
  }

  // Over-max: in tiebreak formats, max games for a single player is tiebreakAt+1
  // (e.g. standard set tiebreak at 6→7, PRO_SET_8 tiebreak at 9→10).
  if (hasTiebreak) {
    const maxValid = tiebreakAt + 1;
    if (p1Games > maxValid || p2Games > maxValid) {
      return { isValid: false, error: `Maximum ${maxValid} games in a set` };
    }
    // Impossible tie at the tiebreak ceiling (e.g. 7-7, 10-10): a tiebreak set always
    // ends maxValid vs tiebreakAt (e.g. 7-6, 10-9). Both players reaching
    // maxValid cannot happen and previously fell through to isPartial.
    if (p1Games === maxValid && p2Games === maxValid) {
      return { isValid: false, error: `Set score ${p1Games}x${p2Games} is not possible — tiebreak ends ${maxValid}x${tiebreakAt}` };
    }
  }

  let winner: 'player1' | 'player2' | undefined;

  if (p1Games >= gamesNeeded && p1Games - p2Games >= 2) {
    winner = 'player1';
  } else if (p2Games >= gamesNeeded && p2Games - p1Games >= 2) {
    winner = 'player2';
  } else if (hasTiebreak && p1Games === tiebreakAt && p2Games === tiebreakAt) {
    return {
      isValid: false,
      hasTiebreak: true,
      tiebreakRequired: true,
      error: 'Tiebreak required',
    };
  }

  // If winner has gamesNeeded+1 (7), loser must have exactly gamesNeeded-1 (5) or gamesNeeded (6)
  // Scores like 7-0, 7-1, 7-2, 7-3, 7-4 are invalid — set would have ended earlier
  if (winner && hasTiebreak) {
    const winnerGames = winner === 'player1' ? p1Games : p2Games;
    const loserGames = winner === 'player1' ? p2Games : p1Games;
    if (winnerGames === gamesNeeded + 1 && loserGames < gamesNeeded - 1) {
      return {
        isValid: false,
        hasTiebreak: true,
        error: `Set score ${p1Games}x${p2Games} is not possible — set would have ended earlier`,
      };
    }
    // PRO_SET_8 (tiebreakAt > gamesNeeded): o placar de tiebreakAt+1 (10) só
    // é alcançável via tiebreak a partir de tiebreakAt x tiebreakAt (9x9).
    // 10x8 seria impossível: em 9x8 o set continua até 9x9, então o 10º game
    // só existe contra um perdedor com exatamente tiebreakAt games.
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
  }

  // Bug (2026-09-05): estes ramos cobrem o placar de games já resolvido por
  // tiebreak (ex.: 7x6). Antes retornavam `hasTiebreak: true` sem marcar
  // `tiebreakRequired: true`, então calculateValidation() considerava o set
  // "verdadeiramente completo" mesmo sem nenhum placar de tiebreak informado
  // (campos vazios tratados como 0x0). Isso liberava indevidamente o botão
  // Confirmar em formatos BEST_OF_5 (e outros com tiebreak) para um placar
  // 7x6/6x7 sem pontos de tiebreak reais, e o clique em Confirmar então
  // travava silenciosamente na tela de edição (handleConfirm/useEditScoreModal
  // faz `return` sem feedback quando canAddNextSet é falso por falta de
  // tiebreak completo). Adicionar tiebreakRequired: true faz o fluxo exigir
  // o placar do tiebreak antes de habilitar a confirmação, como já acontece
  // corretamente no ramo de 6x6.
  if (hasTiebreak && p1Games === tiebreakAt + 1 && p2Games === tiebreakAt) {
    return { isValid: true, winner: 'player1', hasTiebreak: true, tiebreakRequired: true };
  } else if (hasTiebreak && p2Games === tiebreakAt + 1 && p1Games === tiebreakAt) {
    return { isValid: true, winner: 'player2', hasTiebreak: true, tiebreakRequired: true };
  }

  if (!winner) {
    const p1Reached = p1Games >= gamesNeeded;
    const p2Reached = p2Games >= gamesNeeded;
    const anyReached = p1Reached || p2Reached;
    const marginOk = Math.abs(p1Games - p2Games) >= 2;
    const reachedTooClose = anyReached && !marginOk;

    if (reachedTooClose) {
      return { isValid: true, isPartial: true };
    }

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
  p1Games: number;
  p2Games: number;
  format: TennisFormat;
  tiebreakPoints?: { player1: number; player2: number } | null;
  completedSets?: Array<{ player1: number; player2: number }>;
}): 'player1' | 'player2' {
  const { currentServer, p1Games, p2Games, format, tiebreakPoints, completedSets = [] } = params;

  // Check if this is a Match Tiebreak set
  // For BEST_OF_5: 5th set is MT only when series is 2-2 (the MT activation
  // at 6-6 is handled elsewhere; during MT editing, games are 0-0).
  // For other formats: 3rd set is always MT when series is 1-1.
  const isMatchTiebreakSet = 
    format === 'MATCH_TB_10' ||
    (format === 'BEST_OF_5' && completedSets.length === 4 && 
     completedSets.filter(s => s.player1 > s.player2).length === 2 &&
     completedSets.filter(s => s.player2 > s.player1).length === 2) ||
    (format === 'BEST_OF_3_MATCH_TB' && completedSets.length === 2 &&
     completedSets.filter(s => s.player1 > s.player2).length === 1 &&
     completedSets.filter(s => s.player2 > s.player1).length === 1) ||
    ((format === 'SHORT_SET_2V2_NO_AD' || format === 'BEST_OF_3_NO_AD') && completedSets.length === 2 &&
     completedSets.filter(s => s.player1 > s.player2).length === 1 &&
     completedSets.filter(s => s.player2 > s.player1).length === 1);

  const winnerGames = Math.max(p1Games, p2Games);
  const loserGames = Math.min(p1Games, p2Games);
  const tiebreakAt = getTiebreakAtForFormat(format);

  const isTiebreakWin = winnerGames === tiebreakAt + 1 && loserGames === tiebreakAt;

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

  if (isTiebreakWin && tiebreakPoints) {
    const tbWinner = Math.max(tiebreakPoints.player1, tiebreakPoints.player2);
    const tbLoser = Math.min(tiebreakPoints.player1, tiebreakPoints.player2);
    // At this point, isMatchTiebreakSet already returned above, so we are
    // always in a regular tiebreak — MIN_WIN_POINTS_STANDARD is correct.
    const tbMin = TIEBREAK.MIN_WIN_POINTS_STANDARD;

    if (tbWinner >= tbMin && tbWinner - tbLoser >= TIEBREAK.WIN_MARGIN) {
      return currentServer;
    }
  }

  if (isTiebreakWin) {
    return currentServer;
  }

  const totalGamesInMatch = completedSets.reduce(
    (sum, set) => sum + set.player1 + set.player2,
    p1Games + p2Games
  );

  if (totalGamesInMatch % 2 === 0) {
    return currentServer;
  }

  return currentServer === 'player1' ? 'player2' : 'player1';
}
