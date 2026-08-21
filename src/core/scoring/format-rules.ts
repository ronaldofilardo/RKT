import type { ScoringEngineConfig, SetScore, TennisFormat } from './types';

export function createEmptySetForFormat(format: ScoringEngineConfig['format']): SetScore {
  return { player1: getInitialGames(format), player2: getInitialGames(format), isTiebreak: false, tiebreakScore: null };
}

export function getInitialGames(format: ScoringEngineConfig['format']): number {
  return format === 'SHORT_SET_2V2_NO_AD' ? 2 : 0;
}

export function getSetsToWin(config: ScoringEngineConfig): number {
  return setsToWinForFormat(config.format);
}

export function setsToWinForFormat(format: TennisFormat): number {
  switch (format) {
    case 'BEST_OF_5':
      return 3;
    case 'BEST_OF_3':
    case 'BEST_OF_3_MATCH_TB':
    case 'SHORT_SET_2V2_NO_AD':
    case 'BEST_OF_3_NO_AD':
      return 2;
    case 'MATCH_TB_10':
    case 'PRO_SET_8':
      return 1;
    default:
      return 1;
  }
}

export function totalSetsForFormat(format: TennisFormat): number {
  switch (format) {
    case 'BEST_OF_5':
      return 5;
    case 'BEST_OF_3':
    case 'BEST_OF_3_MATCH_TB':
    case 'BEST_OF_3_NO_AD':
    case 'SHORT_SET_2V2_NO_AD':
      return 3;
    case 'MATCH_TB_10':
    case 'PRO_SET_8':
      return 1;
    default:
      return 1;
  }
}

export function usesNoAd(config: ScoringEngineConfig): boolean {
  return config.format === 'SHORT_SET_2V2_NO_AD' || config.format === 'BEST_OF_3_NO_AD';
}

export function isFinalSet(config: ScoringEngineConfig): boolean {
  return isFinalSetFormat(config.format);
}

export function isFinalSetFormat(format: TennisFormat): boolean {
  return format === 'PRO_SET_8';
}

export function getGamesToTiebreak(config: ScoringEngineConfig): number {
  return getTiebreakAtForFormat(config.format);
}

export function getTiebreakAtForFormat(format: TennisFormat): number {
  switch (format) {
    case 'PRO_SET_8':
      return 9;
    case 'SHORT_SET_2V2_NO_AD':
      return 4;
    default:
      return 6;
  }
}

export function shouldHaveTiebreak(format: TennisFormat): boolean {
  if (format === 'MATCH_TB_10') return false;
  return true;
}