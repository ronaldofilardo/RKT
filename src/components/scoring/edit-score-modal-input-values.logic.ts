import type { TennisFormat } from "@/core/scoring/types";
import { SCORING_LIMITS } from "@/lib/constants";
import { getMaxValidGames } from '@/core/scoring/edit-score-domain';

export function computeGameInputChange(params: {
  value: string;
  isMatchTiebreakSet: boolean;
  matchFormat: TennisFormat;
  otherInput?: string;
  currentSets: { player1: number; player2: number };
  player: 'p1' | 'p2';
  currentInputVal: string;
  minGames?: number;
}): { shouldSet: boolean; valueToSet: string; clearTiebreak: boolean } {
  const { value, isMatchTiebreakSet, matchFormat, otherInput, minGames } = params;
  if (value === "") {
    return { shouldSet: true, valueToSet: "", clearTiebreak: true };
  }
  if (!/^\d+$/.test(value)) {
    return { shouldSet: false, valueToSet: "", clearTiebreak: false };
  }
  const num = parseInt(value, 10);

  if (minGames !== undefined && minGames > 0 && num < minGames) {
    return { shouldSet: true, valueToSet: String(minGames), clearTiebreak: false };
  }

  const otherGames = otherInput ? (parseInt(otherInput, 10) || 0) : 0;
  const maxGames = isMatchTiebreakSet
    ? SCORING_LIMITS.TIEBREAK_INPUT_CAP
    : getMaxValidGames(otherGames, matchFormat);

  const valueToSet = num > maxGames ? String(maxGames) : num.toString();
  return { shouldSet: true, valueToSet, clearTiebreak: true };
}

export function computeTiebreakInputChange(params: {
  value: string;
  player: 'p1' | 'p2';
  currentGamePoints?: { player1: number | string; player2: number | string };
  currentTbInputVal: string;
  minPoints?: number;
}): { shouldSet: boolean; valueToSet: string } {
  const { value, minPoints } = params;
  if (value === '') {
    return { shouldSet: true, valueToSet: '' };
  }
  const v = parseInt(value, 10);
  if (isNaN(v) || v < 0) {
    return { shouldSet: false, valueToSet: '' };
  }
  if (minPoints !== undefined && minPoints > 0 && v < minPoints) {
    return { shouldSet: true, valueToSet: String(minPoints) };
  }
  const capped = Math.min(v, SCORING_LIMITS.TIEBREAK_INPUT_CAP);
  return { shouldSet: true, valueToSet: String(capped) };
}
