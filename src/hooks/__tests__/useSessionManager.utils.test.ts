import {
  normalizeMatchTiebreakState,
  validateMatchTiebreakComplete,
  calculateSetsWon,
  isMatchTiebreakSet,
} from '../useSessionManager.utils';
import type { SetEditData } from '@/components/scoring/editScoreHelpers';

function set(p1: number, p2: number, opts: Partial<SetEditData> = {}): SetEditData {
  return { p1Games: p1, p2Games: p2, isPartial: false, ...opts };
}

function partial(p1: number, p2: number): SetEditData {
  return set(p1, p2, { isPartial: true });
}

function withTiebreak(p1: number, p2: number, tb1: number, tb2: number): SetEditData {
  return set(p1, p2, { tiebreakScore: { player1: tb1, player2: tb2 } });
}

describe('normalizeMatchTiebreakState', () => {
  it('returns null/undefined state as-is', () => {
    expect(normalizeMatchTiebreakState(null, 'MATCH_TB_10')).toBeNull();
    expect(normalizeMatchTiebreakState(undefined, 'MATCH_TB_10')).toBeUndefined();
  });

  it('returns state unchanged for non-match-tiebreak format', () => {
    const state = { sets: [{ player1: 6, player2: 4 }] };
    const result = normalizeMatchTiebreakState(state, 'BEST_OF_3');
    expect(result).toBe(state);
  });

  it('converts scores to tiebreak format for MATCH_TB_10', () => {
    const state = { sets: [{ player1: 5, player2: 3, isTiebreak: false }] };
    const result = normalizeMatchTiebreakState(state, 'MATCH_TB_10');
    expect(result.sets[0]).toEqual({
      player1: 0,
      player2: 0,
      isTiebreak: true,
      tiebreakScore: { player1: 5, player2: 3 },
    });
  });

  it('does not re-normalize an already tiebreak set', () => {
    const state = {
      sets: [{ player1: 0, player2: 0, isTiebreak: true, tiebreakScore: { player1: 7, player2: 5 } }],
    };
    const result = normalizeMatchTiebreakState(state, 'MATCH_TB_10');
    expect(result.sets[0].tiebreakScore).toEqual({ player1: 7, player2: 5 });
  });

  it('does not normalize a set with 0-0 scores', () => {
    const state = { sets: [{ player1: 0, player2: 0, isTiebreak: false }] };
    const result = normalizeMatchTiebreakState(state, 'MATCH_TB_10');
    expect(result.sets[0].isTiebreak).toBe(false);
  });

  it('replaces sets array for MATCH_TB_10 (single set format)', () => {
    const state = { sets: [{ player1: 3, player2: 1 }, { player1: 4, player2: 2 }] };
    const result = normalizeMatchTiebreakState(state, 'MATCH_TB_10');
    expect(result.sets).toHaveLength(1);
    expect(result.sets[0].tiebreakScore).toEqual({ player1: 3, player2: 1 });
  });

  it('handles BEST_OF_3_MATCH_TB by modifying last set', () => {
    const state = { sets: [null, null, { player1: 7, player2: 5, isTiebreak: false }] };
    const result = normalizeMatchTiebreakState(state, 'BEST_OF_3_MATCH_TB');
    expect(result.sets[2].isTiebreak).toBe(true);
    expect(result.sets[2].tiebreakScore).toEqual({ player1: 7, player2: 5 });
  });

  it('handles BEST_OF_5 by modifying last set', () => {
    const state = { sets: [{}, {}, {}, {}, { player1: 8, player2: 6, isTiebreak: false }] };
    const result = normalizeMatchTiebreakState(state, 'BEST_OF_5');
    expect(result.sets[4].isTiebreak).toBe(true);
  });

  it('handles SHORT_SET_2V2_NO_AD by modifying last set', () => {
    const state = { sets: [{}, {}, { player1: 4, player2: 3, isTiebreak: false }] };
    const result = normalizeMatchTiebreakState(state, 'SHORT_SET_2V2_NO_AD');
    expect(result.sets[2].isTiebreak).toBe(true);
  });

  it('handles BEST_OF_3_NO_AD by modifying last set', () => {
    const state = { sets: [{}, {}, { player1: 5, player2: 4, isTiebreak: false }] };
    const result = normalizeMatchTiebreakState(state, 'BEST_OF_3_NO_AD');
    expect(result.sets[2].isTiebreak).toBe(true);
  });
});

describe('validateMatchTiebreakComplete', () => {
  it('returns valid=true for formats without match tiebreak', () => {
    expect(validateMatchTiebreakComplete([], 'BEST_OF_3').valid).toBe(true);
    expect(validateMatchTiebreakComplete([], 'PRO_SET_8').valid).toBe(true);
  });

  it('returns valid=true when set array has not reached match tiebreak index', () => {
    const result = validateMatchTiebreakComplete(
      [set(6, 4), set(3, 6)],
      'BEST_OF_3_MATCH_TB',
    );
    expect(result.valid).toBe(true);
  });

  it('returns valid=true for MATCH_TB_10 when score meets 10-point margin requirement', () => {
    const result = validateMatchTiebreakComplete(
      [set(10, 8)],
      'MATCH_TB_10',
    );
    expect(result.valid).toBe(true);
  });

  it('returns valid=false for MATCH_TB_10 with incomplete score', () => {
    const result = validateMatchTiebreakComplete(
      [set(5, 3)],
      'MATCH_TB_10',
    );
    expect(result.valid).toBe(false);
  });

  it('returns valid=false for 10-9 score (insufficient margin)', () => {
    const result = validateMatchTiebreakComplete(
      [set(10, 9)],
      'MATCH_TB_10',
    );
    expect(result.valid).toBe(false);
    expect(result.error).toContain('MATCH_TIEBREAK_INCOMPLETE');
  });

  it('returns valid=true for partial set (in progress)', () => {
    const result = validateMatchTiebreakComplete(
      [partial(8, 7)],
      'MATCH_TB_10',
    );
    expect(result.valid).toBe(true);
  });

  it('validates tiebreakScore when present', () => {
    const result = validateMatchTiebreakComplete(
      [withTiebreak(0, 0, 10, 8)],
      'MATCH_TB_10',
    );
    expect(result.valid).toBe(true);
  });

  it('returns valid=false when tiebreakScore has insufficient margin', () => {
    const result = validateMatchTiebreakComplete(
      [withTiebreak(0, 0, 10, 9)],
      'MATCH_TB_10',
    );
    expect(result.valid).toBe(false);
  });

  it('returns valid=true when decider set not yet reached in BEST_OF_5', () => {
    const result = validateMatchTiebreakComplete(
      [set(6, 4), set(3, 6), set(6, 4), set(4, 6)],
      'BEST_OF_5',
    );
    expect(result.valid).toBe(true);
  });

  it('returns valid=true when BEST_OF_5 5th set score is 12-10', () => {
    const sets = [set(6, 4), set(4, 6), set(6, 4), set(4, 6), set(12, 10)];
    const result = validateMatchTiebreakComplete(sets, 'BEST_OF_5');
    expect(result.valid).toBe(true);
  });

  it('returns valid=true when best-of-3 with match TB not at 1-1 yet', () => {
    const result = validateMatchTiebreakComplete(
      [set(6, 4)],
      'BEST_OF_3_MATCH_TB',
    );
    expect(result.valid).toBe(true);
  });
});

describe('calculateSetsWon', () => {
  it('counts regular games', () => {
    const sets = [set(6, 4), set(3, 6), set(6, 2)];
    expect(calculateSetsWon(sets, 'BEST_OF_3')).toEqual({ player1: 2, player2: 1 });
  });

  it('counts sets won via regular tiebreak (7+ with margin)', () => {
    const sets = [withTiebreak(6, 6, 7, 5)];
    expect(calculateSetsWon(sets, 'BEST_OF_3')).toEqual({ player1: 1, player2: 0 });
  });

  it('does not count tiebreak with no margin', () => {
    const sets = [withTiebreak(6, 6, 7, 6)];
    expect(calculateSetsWon(sets, 'BEST_OF_3')).toEqual({ player1: 0, player2: 0 });
  });

  it('counts sets won via match tiebreak (10+ with margin)', () => {
    const sets = [set(6, 4), set(4, 6), withTiebreak(0, 0, 10, 7)];
    expect(calculateSetsWon(sets, 'BEST_OF_3_MATCH_TB')).toEqual({ player1: 2, player2: 1 });
  });

  it('does not count partial sets', () => {
    const sets = [partial(6, 4), partial(3, 6)];
    expect(calculateSetsWon(sets, 'BEST_OF_3')).toEqual({ player1: 0, player2: 0 });
  });

  it('skips partial sets and counts completed ones', () => {
    const sets = [set(6, 4), partial(3, 5)];
    expect(calculateSetsWon(sets, 'BEST_OF_3')).toEqual({ player1: 1, player2: 0 });
  });

  it('returns 0-0 for empty array', () => {
    expect(calculateSetsWon([], 'BEST_OF_3')).toEqual({ player1: 0, player2: 0 });
  });

  it('handles all sets won by player2', () => {
    const sets = [set(3, 6), set(4, 6)];
    expect(calculateSetsWon(sets, 'BEST_OF_3')).toEqual({ player1: 0, player2: 2 });
  });

  it('counts match tiebreak correctly for player2', () => {
    const sets = [set(6, 4), set(4, 6), withTiebreak(0, 0, 8, 10)];
    expect(calculateSetsWon(sets, 'BEST_OF_3_MATCH_TB')).toEqual({ player1: 1, player2: 2 });
  });

  it('does not count match tiebreak with insufficient margin', () => {
    const sets = [withTiebreak(0, 0, 10, 9)];
    expect(calculateSetsWon(sets, 'MATCH_TB_10')).toEqual({ player1: 0, player2: 0 });
  });
});

describe('isMatchTiebreakSet', () => {
  it('returns true for set 1 in MATCH_TB_10 format', () => {
    expect(isMatchTiebreakSet(0, [], 'MATCH_TB_10')).toBe(true);
  });

  it('returns false for set 2+ in MATCH_TB_10 format', () => {
    expect(isMatchTiebreakSet(1, [set(10, 8)], 'MATCH_TB_10')).toBe(false);
  });

  it('returns false for non-match-tiebreak formats', () => {
    expect(isMatchTiebreakSet(2, [set(6, 4), set(4, 6)], 'BEST_OF_3')).toBe(false);
  });

  it('returns true for set 3 (index 2) in BEST_OF_3_MATCH_TB when 1-1', () => {
    const sets = [set(6, 4), set(4, 6)];
    expect(isMatchTiebreakSet(2, sets, 'BEST_OF_3_MATCH_TB')).toBe(true);
  });

  it('returns false for set 3 in BEST_OF_3_MATCH_TB when not 1-1', () => {
    const sets = [set(6, 4), set(6, 4)];
    expect(isMatchTiebreakSet(2, sets, 'BEST_OF_3_MATCH_TB')).toBe(false);
  });

  it('returns true for set 5 (index 4) in BEST_OF_5 when 2-2 and 6-6', () => {
    const sets = [set(6, 4), set(4, 6), set(6, 4), set(4, 6), set(6, 6)];
    expect(isMatchTiebreakSet(4, sets, 'BEST_OF_5')).toBe(true);
  });

  it('returns false for set 5 in BEST_OF_5 when 2-2 but no 6-6', () => {
    const sets = [set(6, 4), set(4, 6), set(6, 4), set(4, 6), set(5, 4)];
    expect(isMatchTiebreakSet(4, sets, 'BEST_OF_5')).toBe(false);
  });

  it('returns false for set 5 in BEST_OF_5 when not 2-2', () => {
    const sets = [set(6, 4), set(6, 4), set(6, 4), set(4, 6), set(6, 6)];
    expect(isMatchTiebreakSet(4, sets, 'BEST_OF_5')).toBe(false);
  });

  it('returns true for set 3 in SHORT_SET_2V2_NO_AD when 1-1', () => {
    const sets = [set(4, 2), set(2, 4)];
    expect(isMatchTiebreakSet(2, sets, 'SHORT_SET_2V2_NO_AD')).toBe(true);
  });

  it('returns true for set 3 in BEST_OF_3_NO_AD when 1-1', () => {
    const sets = [set(6, 4), set(4, 6)];
    expect(isMatchTiebreakSet(2, sets, 'BEST_OF_3_NO_AD')).toBe(true);
  });

  it('skips partial sets when counting won sets', () => {
    const sets = [partial(6, 4), partial(3, 5)];
    expect(isMatchTiebreakSet(2, sets, 'BEST_OF_3_MATCH_TB')).toBe(false);
  });

  it('handles undefined entries in setResults', () => {
    const sets = [set(6, 4), undefined as any];
    expect(isMatchTiebreakSet(2, sets, 'BEST_OF_3_MATCH_TB')).toBe(false);
  });

  it('handles CompletedSet (no isPartial property)', () => {
    const completedSets = [{ p1Games: 6, p2Games: 4 }, { p1Games: 4, p2Games: 6 }] as any[];
    expect(isMatchTiebreakSet(2, completedSets, 'BEST_OF_3_MATCH_TB')).toBe(true);
  });
});
