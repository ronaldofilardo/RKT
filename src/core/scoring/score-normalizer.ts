import type { TennisFormat } from './types';

/**
 * Sanea um scoreState legado/corrompido para o formato canonical.
 *
 * Bug #4 (2026-08-07): em produção, sets de Match Tiebreak eram persistidos
 * com pontos gravados em player1/player2 e SEM tiebreakScore (devido ao
 * antigo handleConfirm que descartava tiebreakScore). Esta função detecta
 * esse padrão e converte de volta para o formato canonical
 * ({ player1: 0, player2: 0, isTiebreak: true, tiebreakScore: { ... } }).
 *
 * Suporta os formatos: MATCH_TB_10, BEST_OF_3_MATCH_TB, BEST_OF_5 (5th set),
 * BEST_OF_3_NO_AD e SHORT_SET_2V2_NO_AD.
 *
 * Esta é a versão unificada — substitui a implementação fragmentada em
 * src/components/dashboard/match-card-utils.ts (que não cobria BEST_OF_5).
 */
export interface NormalizedScoreState {
  sets: Array<{
    player1: number;
    player2: number;
    isTiebreak?: boolean;
    tiebreakScore?: { player1: number; player2: number } | null;
  }>;
  currentGame?: {
    player1: number | string;
    player2: number | string;
    isDeuce?: boolean;
    advantage?: 'player1' | 'player2' | null;
  };
  setsWon?: { player1: number; player2: number };
  server?: 'player1' | 'player2';
}

/**
 * Determina se um índice de set em um formato dado deve ser tratado como
 * Match Tiebreak decisivo (5º set no BO5, 3º set em BO3 MT, etc.).
 * Unifica a heurística espalhada pelo código — ver docs/fix-tasks/scoring-edit-score-2026-08-07.md.
 */
export function isMatchTiebreakSetIndex(
  setIndex: number,
  _totalSets: number,
  format: TennisFormat,
  completedSetsBefore: { p1Won: number; p2Won: number } = { p1Won: 0, p2Won: 0 },
): boolean {
  const setNum = setIndex + 1;

  if (format === 'MATCH_TB_10') return setNum === 1;

  if (format === 'BEST_OF_5' && setNum === 5) {
    return completedSetsBefore.p1Won === 2 && completedSetsBefore.p2Won === 2;
  }

  if (
    (format === 'BEST_OF_3_MATCH_TB' ||
      format === 'BEST_OF_3_NO_AD' ||
      format === 'SHORT_SET_2V2_NO_AD') &&
    setNum === 3
  ) {
    return completedSetsBefore.p1Won === 1 && completedSetsBefore.p2Won === 1;
  }

  return false;
}

function parseRawScoreState(rawScoreState: any): any | null {
  if (!rawScoreState) return null;
  let parsed = rawScoreState;
  if (typeof parsed === 'string') {
    try {
      parsed = JSON.parse(parsed);
    } catch {
      return null;
    }
  }
  // Snapshot serializado contém { state, history } — extrair só o state.
  if (parsed?.state && Array.isArray(parsed?.history)) {
    parsed = parsed.state;
  }
  return parsed;
}

function looksLikeMatchTiebreakFormat(format: TennisFormat): boolean {
  return (
    format === 'MATCH_TB_10' ||
    format === 'BEST_OF_3_MATCH_TB' ||
    format === 'BEST_OF_5' ||
    format === 'BEST_OF_3_NO_AD' ||
    format === 'SHORT_SET_2V2_NO_AD'
  );
}

/**
 * Sanea um scoreState para o formato canonical.
 *
 * Heurística de detecção do bug: um set com (player1 > 0 || player2 > 0),
 * sem isTiebreak e sem tiebreakScore, em formato/posição que deveria ser MT.
 * Converte: pontos vão para tiebreakScore, games voltam a 0, isTiebreak: true.
 */
export function normalizeScoreState(
  rawScoreState: any,
  format?: TennisFormat,
): NormalizedScoreState | null {
  const parsed = parseRawScoreState(rawScoreState);
  if (!parsed) return null;
  if (!parsed.sets || !Array.isArray(parsed.sets)) {
    if (!parsed?.sets) return null;
  }

  if (format && looksLikeMatchTiebreakFormat(format)) {
    // Contar sets vencidos ANTES de cada índice (não-MT) para validar posição.
    let p1Won = 0;
    let p2Won = 0;
    const newSets = parsed.sets.map((set: any, idx: number) => {
      const isMtSet = isMatchTiebreakSetIndex(idx, parsed.sets.length, format, { p1Won, p2Won });

      // Detecta o padrão corrompido apenas em sets que deveriam ser MT.
      if (
        isMtSet &&
        set &&
        (set.player1 > 0 || set.player2 > 0) &&
        !set.isTiebreak &&
        !set.tiebreakScore
      ) {
        const sanitized = {
          ...set,
          tiebreakScore: { player1: set.player1, player2: set.player2 },
          player1: 0,
          player2: 0,
          isTiebreak: true,
        };
        // Conta como vitória do MT (não incrementa p1Won/p2Won para sets
        // futuros — este é o último set destes formatos).
        return sanitized;
      }

      // Set "normal": conta vencedor para a heurística dos próximos índices.
      if (set && !set.isTiebreak) {
        if (set.player1 > set.player2) p1Won++;
        else if (set.player2 > set.player1) p2Won++;
      } else if (set && set.isTiebreak && set.tiebreakScore) {
        // Tiebreak normal de fim de set: conta pelo games.
        if (set.player1 > set.player2) p1Won++;
        else if (set.player2 > set.player1) p2Won++;
      }
      return set;
    });
    parsed.sets = newSets;
  }

  if (parsed?.sets && parsed?.currentGame) {
    return parsed as NormalizedScoreState;
  }

  if (parsed?.sets && Array.isArray(parsed.sets)) {
    return {
      ...parsed,
      currentGame: parsed.currentGame ?? {
        player1: 0,
        player2: 0,
        isDeuce: false,
        advantage: null,
      },
    } as NormalizedScoreState;
  }

  return null;
}
