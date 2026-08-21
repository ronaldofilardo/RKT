import type { SetEditData } from '@/components/scoring/editScoreHelpers';
import {
  calculateSetsWon as calculateSetsWonImpl,
  isMatchTiebreakSet as isMatchTiebreakSetImpl,
  normalizeMatchTiebreakState as normalizeMatchTiebreakStateImpl,
  validateMatchTiebreakComplete as validateMatchTiebreakCompleteImpl,
} from './useSessionManager.utils.helpers';

export function normalizeMatchTiebreakState(scoreState: any, format: string): any {
  return normalizeMatchTiebreakStateImpl(scoreState, format);
}

export function validateMatchTiebreakComplete(
  setResults: SetEditData[],
  format: string,
): { valid: boolean; error?: string } {
  return validateMatchTiebreakCompleteImpl(setResults, format);
}

export function calculateSetsWon(
  setResults: SetEditData[],
  format: string,
): { player1: number; player2: number } {
  return calculateSetsWonImpl(setResults, format);
}

export function isMatchTiebreakSet(
  index: number,
  setResults: SetEditData[],
  format: string,
): boolean {
  return isMatchTiebreakSetImpl(index, setResults, format);
}
