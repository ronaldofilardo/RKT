import type { MatchFormatRules, TennisFormat } from './matchConfig';

export function isGrandSlamDecidingTiebreak(
  format: TennisFormat,
  currentSetNum: number,
  p1Sets: number,
  p2Sets: number,
): boolean {
  return format === 'BEST_OF_5'
    && currentSetNum === 5
    && p1Sets === 2
    && p2Sets === 2;
}

export function isBestOfThreeMatchTiebreak(
  format: TennisFormat,
  currentSetNum: number,
  p1Sets: number,
  p2Sets: number,
): boolean {
  const supported = format === 'BEST_OF_3_MATCH_TB'
    || format === 'SHORT_SET_2V2_NO_AD'
    || format === 'BEST_OF_3_NO_AD';
  return supported && currentSetNum === 3 && p1Sets === 1 && p2Sets === 1;
}

export function isCompleteByGameMargin(max: number, min: number, gamesPerSet: number): boolean {
  return max >= gamesPerSet && max - min >= 2;
}

export function isCompleteByTiebreakScore(
  max: number,
  min: number,
  rules: MatchFormatRules,
): boolean {
  return rules.useTiebreak
    && rules.tiebreakAt > 0
    && max === rules.tiebreakAt + 1
    && min === rules.tiebreakAt;
}

export function isAtTiebreakScore(p1: number, p2: number, rules: MatchFormatRules): boolean {
  return Boolean(rules.useTiebreak && rules.tiebreakAt > 0
    && p1 === rules.tiebreakAt && p2 === rules.tiebreakAt);
}
