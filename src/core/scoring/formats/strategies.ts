/**
 * Concrete `MatchFormatStrategy` implementations — one file per format.
 *
 * Registered into `matchFormatRegistry` via side-effect imports in `./index.ts`.
 *
 * @see docs/adr/ADR-0003-match-format-strategy.md
 */

import type { ScoringState } from '../types';
import type { MatchFormatStrategy } from './match-format-strategy';

/**
 * Build a strategy from declarative rules + a custom `isMatchTiebreakActive` predicate.
 * Reduces boilerplate while keeping each format file self-contained.
 */
function defineStrategy(
  rules: Omit<MatchFormatStrategy, 'isMatchTiebreakActive'>,
  isMatchTiebreakActive: (state: ScoringState) => boolean,
): MatchFormatStrategy {
  return { ...rules, isMatchTiebreakActive };
}

/**
 * Common predicate for "best-of-3 with match tiebreak as deciding set" formats:
 * the 3rd set becomes a match tiebreak when sets are 1x1.
 */
function bestOf3MatchTiebreakOnDeciding(state: ScoringState): boolean {
  const p1Sets = state.sets.filter((s) => !s.isTiebreak && s.player1 > s.player2).length;
  const p2Sets = state.sets.filter((s) => !s.isTiebreak && s.player2 > s.player1).length;
  return state.sets.length === 3 && p1Sets === 1 && p2Sets === 1;
}

function neverMatchTiebreak(): boolean {
  return false;
}

function alwaysMatchTiebreak(): boolean {
  return true;
}

export const bestOf3Strategy: MatchFormatStrategy = defineStrategy(
  {
    format: 'BEST_OF_3',
    setsToWin: 2,
    totalSets: 3,
    gamesPerSet: 6,
    tiebreakAt: 6,
    tiebreakPoints: 7,
    matchTiebreakPoints: 10,
    useAdvantage: true,
    useTiebreak: true,
    useNoAd: false,
    isMatchTiebreakFormat: false,
  },
  neverMatchTiebreak,
);

export const bestOf3NoAdStrategy: MatchFormatStrategy = defineStrategy(
  {
    format: 'BEST_OF_3_NO_AD',
    setsToWin: 2,
    totalSets: 3,
    gamesPerSet: 6,
    tiebreakAt: 6,
    tiebreakPoints: 7,
    matchTiebreakPoints: 10,
    useAdvantage: false,
    useTiebreak: true,
    useNoAd: true,
    isMatchTiebreakFormat: true,
  },
  bestOf3MatchTiebreakOnDeciding,
);

export const bestOf3MatchTbStrategy: MatchFormatStrategy = defineStrategy(
  {
    format: 'BEST_OF_3_MATCH_TB',
    setsToWin: 2,
    totalSets: 3,
    gamesPerSet: 6,
    tiebreakAt: 6,
    tiebreakPoints: 7,
    matchTiebreakPoints: 10,
    useAdvantage: true,
    useTiebreak: true,
    useNoAd: false,
    isMatchTiebreakFormat: true,
  },
  bestOf3MatchTiebreakOnDeciding,
);

export const bestOf5Strategy: MatchFormatStrategy = defineStrategy(
  {
    format: 'BEST_OF_5',
    setsToWin: 3,
    totalSets: 5,
    gamesPerSet: 6,
    tiebreakAt: 6,
    tiebreakPoints: 7,
    matchTiebreakPoints: 10,
    useAdvantage: true,
    useTiebreak: true,
    useNoAd: false,
    isMatchTiebreakFormat: true,
    decidingSetTiebreakPoints: 10,
  },
  (state: ScoringState): boolean => {
    // 5th set is deciding: 2x2 in sets. MT only kicks in once the deciding set
    // reaches 6/6 (tied to the set's `isTiebreak` flag, matching `engine.flow.ts:536`).
    const setNum = state.sets.length;
    if (setNum !== 5) return false;
    const p1Sets = state.sets.filter((s) => !s.isTiebreak && s.player1 > s.player2).length;
    const p2Sets = state.sets.filter((s) => !s.isTiebreak && s.player2 > s.player1).length;
    if (p1Sets !== 2 || p2Sets !== 2) return false;
    const fifthSet = state.sets[4];
    return fifthSet?.isTiebreak === true;
  },
);

export const matchTb10Strategy: MatchFormatStrategy = defineStrategy(
  {
    format: 'MATCH_TB_10',
    setsToWin: 1,
    totalSets: 1,
    gamesPerSet: 0,
    tiebreakAt: 0,
    tiebreakPoints: 10,
    matchTiebreakPoints: 10,
    useAdvantage: false,
    useTiebreak: false,
    useNoAd: false,
    isMatchTiebreakFormat: true,
  },
  alwaysMatchTiebreak,
);

export const proSet8Strategy: MatchFormatStrategy = defineStrategy(
  {
    format: 'PRO_SET_8',
    setsToWin: 1,
    totalSets: 1,
    gamesPerSet: 8,
    tiebreakAt: 9,
    tiebreakPoints: 7,
    matchTiebreakPoints: 10,
    useAdvantage: true,
    useTiebreak: true,
    useNoAd: false,
    isMatchTiebreakFormat: false,
  },
  neverMatchTiebreak,
);

export const shortSet2v2NoAdStrategy: MatchFormatStrategy = defineStrategy(
  {
    format: 'SHORT_SET_2V2_NO_AD',
    setsToWin: 2,
    totalSets: 3,
    gamesPerSet: 4,
    tiebreakAt: 4,
    tiebreakPoints: 7,
    matchTiebreakPoints: 10,
    useAdvantage: false,
    useTiebreak: true,
    useNoAd: true,
    isMatchTiebreakFormat: true,
  },
  bestOf3MatchTiebreakOnDeciding,
);
