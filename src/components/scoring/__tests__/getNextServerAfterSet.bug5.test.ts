/**
 * Regression tests for getNextServerAfterSet (bug #5, 2026-08-07).
 * Reported behavior: ao corrigir placar no modo MT, o sistema não troca o
 * sacador de acordo com a contagem — mantém o mesmo sacador.
 *
 * Hypothesis (validated in docs/fix-tasks/scoring-edit-score-2026-08-07.md):
 * the bug is a downstream of #4 — tiebreakScore arrived null, so the branch
 * `if (isMatchTiebreakSet && tiebreakPoints)` in getNextServerAfterSet
 * (editScoreHelpers.ts:244) silently fell through to the fallback path that
 * returns `currentServer` only.
 *
 * After fix #4 (tiebreakScore now propagated in useEditScoreModal),
 * getNextServerAfterSet receives a populated tiebreakPoints, so the parity
 * check (totalPoints % 2) fires correctly.
 */

import { getNextServerAfterSet } from '@/components/scoring/editScoreHelpers';

describe('Bug #5: getNextServerAfterSet alternates server in MT', () => {
  const baseParams = {
    currentServer: 'player1' as const,
    p1Games: 0,
    p2Games: 0,
    format: 'BEST_OF_3_MATCH_TB' as const,
    completedSets: [
      { player1: 6, player2: 4 },
      { player1: 3, player2: 6 },
    ],
  };

  it('MT 0x0 (no points yet): returns current server', () => {
    // totalPoints=0 → 0%2===0 → currentServer (player1)
    const next = getNextServerAfterSet({
      ...baseParams,
      tiebreakPoints: { player1: 0, player2: 0 },
    });
    expect(next).toBe('player1');
  });

  it('MT 1x0: alternates server (totalPoints=1, ímpar)', () => {
    // totalPoints=1 → 1%2===1 → other player (player2)
    const next = getNextServerAfterSet({
      ...baseParams,
      tiebreakPoints: { player1: 1, player2: 0 },
    });
    expect(next).toBe('player2');
  });

  it('MT 2x0: back to current server (totalPoints=2, par)', () => {
    const next = getNextServerAfterSet({
      ...baseParams,
      tiebreakPoints: { player1: 2, player2: 0 },
    });
    expect(next).toBe('player1');
  });

  it('MT 3x2: alternates (totalPoints=5, ímpar)', () => {
    const next = getNextServerAfterSet({
      ...baseParams,
      tiebreakPoints: { player1: 3, player2: 2 },
    });
    expect(next).toBe('player2');
  });

  it('MT 7x5 complete (12 total points, par): current server', () => {
    // MT complete: 12 points → 12%2===0 → currentServer
    const next = getNextServerAfterSet({
      ...baseParams,
      tiebreakPoints: { player1: 7, player2: 5 },
    });
    expect(next).toBe('player1');
  });

  it('MT 10x8 complete (18 total points, par): current server', () => {
    const next = getNextServerAfterSet({
      ...baseParams,
      tiebreakPoints: { player1: 10, player2: 8 },
    });
    expect(next).toBe('player1');
  });

  it('MT 11x9 complete (20 total points, par): current server', () => {
    const next = getNextServerAfterSet({
      ...baseParams,
      tiebreakPoints: { player1: 11, player2: 9 },
    });
    expect(next).toBe('player1');
  });

  it('BEST_OF_5 5th-set MT: alternates correctly', () => {
    const bo5Params = {
      currentServer: 'player2' as const,
      p1Games: 0,
      p2Games: 0,
      format: 'BEST_OF_5' as const,
      completedSets: [
        { player1: 6, player2: 4 },
        { player1: 3, player2: 6 },
        { player1: 6, player2: 4 },
        { player1: 3, player2: 6 },
      ],
    };
    // totalPoints=1 → other (player1)
    const next = getNextServerAfterSet({
      ...bo5Params,
      tiebreakPoints: { player1: 1, player2: 0 },
    });
    expect(next).toBe('player1');
  });

  it('MATCH_TB_10 single-set: alternates by totalPoints parity', () => {
    const matchTbParams = {
      currentServer: 'player2' as const,
      p1Games: 0,
      p2Games: 0,
      format: 'MATCH_TB_10' as const,
      completedSets: [],
    };
    // totalPoints=1 → other (player1)
    expect(getNextServerAfterSet({ ...matchTbParams, tiebreakPoints: { player1: 1, player2: 0 } }))
      .toBe('player1');
    // totalPoints=2 → current (player2)
    expect(getNextServerAfterSet({ ...matchTbParams, tiebreakPoints: { player1: 2, player2: 0 } }))
      .toBe('player2');
  });
});
