import { isSetCompleted } from '@/app/match/[id]/scoring/scoringHelpers';
import { getMatchFormatRules, type TennisFormat } from '@/lib/matchConfig';
import type { ScoreboardSet } from './scoreboard-card.types';

type SetsWon = { player1: number; player2: number };

/** Projeção de sets para formatos curtos (placeholder 2-2 quando vazio). */
export function projectDisplayedSets(
  sets: ScoreboardSet[],
  tennisFormat: TennisFormat | undefined,
  isFinished: boolean
): ScoreboardSet[] {
  if (tennisFormat === 'SHORT_SET_2V2_NO_AD' && !isFinished) {
    if (sets.length === 0) {
      return [
        { player1: 2, player2: 2, isTiebreak: false, tiebreakScore: null },
        { player1: 2, player2: 2, isTiebreak: false, tiebreakScore: null },
      ];
    }
    if (sets.length === 1) {
      return [sets[0], { player1: 2, player2: 2, isTiebreak: false, tiebreakScore: null }];
    }
  }
  return sets;
}

/** Índice do set em disputa (-1 quando a partida terminou). */
export function findCurrentSetIndex(
  sets: ScoreboardSet[],
  tennisFormat: TennisFormat | undefined,
  setsWon: SetsWon | undefined,
  isFinished: boolean
): number {
  if (isFinished) return -1;
  if (sets.length === 0) return 0;
  for (let i = 0; i < sets.length; i++) {
    if (!isSetCompleted(sets[i], tennisFormat, i, setsWon)) return i;
  }
  return sets.length;
}

/** Número de sets necessários para vencer × 2 − 1 (fallback 4). */
export function getMaxSetsForFormat(tennisFormat: TennisFormat | undefined): number {
  if (!tennisFormat) return 4;
  try {
    const rules = getMatchFormatRules(tennisFormat);
    return rules.setsToWin * 2 - 1;
  } catch {
    return 4;
  }
}

/** Títulos das colunas de set por formato (fallback genérico "Set N"). */
export function getColumnTitles(
  tennisFormat: TennisFormat | undefined,
  displayedCount: number,
  maxSetsForFormat: number
): string[] {
  if (tennisFormat === 'MATCH_TB_10') {
    return ['TB'];
  }
  if (
    tennisFormat === 'BEST_OF_3_MATCH_TB' ||
    tennisFormat === 'SHORT_SET_2V2_NO_AD' ||
    tennisFormat === 'BEST_OF_3_NO_AD'
  ) {
    return ['Set 1', 'Set 2', 'TB'];
  }
  if (tennisFormat === 'BEST_OF_5') {
    return ['Set 1', 'Set 2', 'Set 3', 'Set 4', 'Set 5'];
  }
  if (tennisFormat === 'PRO_SET_8') {
    return ['Set 1'];
  }
  if (tennisFormat === 'BEST_OF_3') {
    return ['Set 1', 'Set 2', 'Set 3'];
  }
  return Array.from(
    { length: Math.max(displayedCount, maxSetsForFormat) },
    (_, i) => `Set ${i + 1}`
  );
}
