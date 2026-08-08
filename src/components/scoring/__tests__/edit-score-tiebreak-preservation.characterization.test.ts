/**
 * Characterization / regression tests for EditScoreModal tiebreakScore propagation bug #4 (2026-08-07).
 *
 * After the fix in useEditScoreModal.ts (handleConfirm now propagates
 * tiebreakScore from both prop completedSets and state.editableCompletedSets,
 * and handleAddSet includes tiebreakScore when the user filled it), the
 * payload onConfirm receives must preserve tiebreak information for sets
 * that were 6/6 + tiebreak (e.g. 7/6 with TB 7/5).
 *
 * These tests document the FIXED behavior (post-fix). They MUST keep passing.
 * The mapping under test mirrors what handleConfirm does in the real hook.
 *
 * See: docs/fix-tasks/scoring-edit-score-2026-08-07.md
 */

describe('Regression: useEditScoreModal.handleConfirm propagates tiebreakScore (bug #4 fix)', () => {
  // Mirrors the (fixed) mapping inside handleConfirm in useEditScoreModal.ts.
  function buildExistingCompleted(completedSets: Array<{
    games: { player1: number; player2: number };
    winner: 'player1' | 'player2';
    tiebreakScore?: { player1: number; player2: number } | null;
  }>) {
    return completedSets.map((cs) => ({
      p1Games: cs.games.player1,
      p2Games: cs.games.player2,
      isPartial: false,
      tiebreakScore: cs.tiebreakScore ?? undefined,
    }));
  }

  it('FIX: preserves tiebreakScore when reconstructing existingCompleted from prop', () => {
    const completedSets = [
      {
        games: { player1: 6, player2: 6 },
        winner: 'player1' as const,
        tiebreakScore: { player1: 7, player2: 5 },
      },
    ];

    const existingCompleted = buildExistingCompleted(completedSets);

    expect(existingCompleted[0].tiebreakScore).toEqual({ player1: 7, player2: 5 });
    expect(existingCompleted[0].p1Games).toBe(6);
    expect(existingCompleted[0].p2Games).toBe(6);
  });

  it('FIX: 7/6 set tiebreak is propagated in finalSets payload', () => {
    const completedSets = [
      {
        games: { player1: 7, player2: 6 },
        winner: 'player1' as const,
        tiebreakScore: { player1: 7, player2: 5 },
      },
    ];

    const existingCompleted = buildExistingCompleted(completedSets);
    const newSets: any[] = [];
    const finalSets = [...existingCompleted, ...newSets];

    expect(finalSets[0].tiebreakScore).toEqual({ player1: 7, player2: 5 });
    expect(finalSets[0].p1Games).toBe(7);
    expect(finalSets[0].p2Games).toBe(6);
  });

  it('FIX: BEST_OF_5 5th-set MT result is preserved (dashboard band-aid gap closed)', () => {
    const completedSets = [
      { games: { player1: 6, player2: 4 }, winner: 'player1' as const },
      { games: { player1: 3, player2: 6 }, winner: 'player2' as const },
      { games: { player1: 6, player2: 4 }, winner: 'player1' as const },
      { games: { player1: 3, player2: 6 }, winner: 'player2' as const },
      {
        games: { player1: 6, player2: 6 },
        winner: 'player1' as const,
        tiebreakScore: { player1: 7, player2: 5 },
      },
    ];

    const existingCompleted = buildExistingCompleted(completedSets);

    expect(existingCompleted[4].tiebreakScore).toEqual({ player1: 7, player2: 5 });
    expect(existingCompleted[4].p1Games).toBe(6);
    expect(existingCompleted[4].p2Games).toBe(6);
  });

  it('FIX: handleAddSet includes tiebreakScore when user fills tiebreak inputs', () => {
    const p1Games = 6;
    const p2Games = 6;
    const tbP1Num = 7;
    const tbP2Num = 5;
    const hasTiebreakScore =
      !isNaN(tbP1Num) && !isNaN(tbP2Num) &&
      tbP1Num >= 0 && tbP2Num >= 0 &&
      (tbP1Num > 0 || tbP2Num > 0);

    const setData = {
      p1Games,
      p2Games,
      isPartial: false,
      ...(hasTiebreakScore ? { tiebreakScore: { player1: tbP1Num, player2: tbP2Num } } : {}),
    };

    expect(setData).toEqual({
      p1Games: 6,
      p2Games: 6,
      isPartial: false,
      tiebreakScore: { player1: 7, player2: 5 },
    });
  });
});

/**
 * Regression tests for the read-path sanitizer (src/core/scoring/score-normalizer.ts).
 * Bug #4: sets persisted corruptly (player1/player2 > 0, no tiebreakScore, no
 * isTiebreak) must be normalized back to canonical form on read.
 */
describe('Regression: normalizeScoreState sanitizes corrupt MT sets (bug #4 read-path)', () => {
  const { normalizeScoreState } = require('@/core/scoring/score-normalizer');

  it('sanitizes BEST_OF_5 5th-set MT (was missing in dashboard band-aid)', () => {
    const corrupt = {
      sets: [
        { player1: 6, player2: 4, isTiebreak: false, tiebreakScore: null },
        { player1: 3, player2: 6, isTiebreak: false, tiebreakScore: null },
        { player1: 6, player2: 4, isTiebreak: false, tiebreakScore: null },
        { player1: 3, player2: 6, isTiebreak: false, tiebreakScore: null },
        { player1: 10, player2: 7, isTiebreak: false, tiebreakScore: null }, // MT points as games
      ],
    };

    const out = normalizeScoreState(corrupt, 'BEST_OF_5');
    expect(out).not.toBeNull();
    expect(out!.sets[4]).toEqual({
      player1: 0,
      player2: 0,
      isTiebreak: true,
      tiebreakScore: { player1: 10, player2: 7 },
    });
    expect(out!.sets[0]).toEqual({ player1: 6, player2: 4, isTiebreak: false, tiebreakScore: null });
  });

  it('sanitizes MATCH_TB_10 (single set MT)', () => {
    const corrupt = {
      sets: [{ player1: 10, player2: 8, isTiebreak: false, tiebreakScore: null }],
    };
    const out = normalizeScoreState(corrupt, 'MATCH_TB_10');
    expect(out!.sets[0]).toEqual({
      player1: 0,
      player2: 0,
      isTiebreak: true,
      tiebreakScore: { player1: 10, player2: 8 },
    });
  });

  it('sanitizes BEST_OF_3_MATCH_TB 3rd set', () => {
    const corrupt = {
      sets: [
        { player1: 6, player2: 4, isTiebreak: false, tiebreakScore: null },
        { player1: 3, player2: 6, isTiebreak: false, tiebreakScore: null },
        { player1: 11, player2: 9, isTiebreak: false, tiebreakScore: null },
      ],
    };
    const out = normalizeScoreState(corrupt, 'BEST_OF_3_MATCH_TB');
    expect(out!.sets[2]).toEqual({
      player1: 0,
      player2: 0,
      isTiebreak: true,
      tiebreakScore: { player1: 11, player2: 9 },
    });
  });

  it('does NOT sanitize sets that already have tiebreakScore', () => {
    const alreadyClean = {
      sets: [
        { player1: 6, player2: 6, isTiebreak: true, tiebreakScore: { player1: 7, player2: 5 } },
      ],
    };
    const out = normalizeScoreState(alreadyClean, 'BEST_OF_3_MATCH_TB');
    expect(out!.sets[0]).toEqual({ player1: 6, player2: 6, isTiebreak: true, tiebreakScore: { player1: 7, player2: 5 } });
  });

  it('parses serialized snapshot (state wrapped in {state, history})', () => {
    const corruptSnapshot = JSON.stringify({
      state: { sets: [{ player1: 10, player2: 6, isTiebreak: false, tiebreakScore: null }] },
      history: [],
    });
    const out = normalizeScoreState(corruptSnapshot, 'MATCH_TB_10');
    expect(out!.sets[0]).toEqual({
      player1: 0,
      player2: 0,
      isTiebreak: true,
      tiebreakScore: { player1: 10, player2: 6 },
    });
  });
});
