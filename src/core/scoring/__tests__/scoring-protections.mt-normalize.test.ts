/**
 * Split de scoring-protections.test.ts — PROTEÇÃO #1 (MT como único set e
 * normalização): validação do MATCH_TB_10 e normalização de estado mal
 * persistido (games no lugar de pontos do tie-break). Asserções 1:1.
 */
import type { SetEditData } from '@/core/scoring/edit-score-domain';
import { normalizeMatchTiebreakState, malformedMtState } from './scoringProtectionsTestKit';

describe('PROTEÇÃO #1: MT único set e normalização', () => {
  it("deve permitir match tie-break como único set (formato MATCH_TB_10)", () => {
    const setResults: SetEditData[] = [
      { p1Games: 10, p2Games: 8, isPartial: false, tiebreakScore: { player1: 10, player2: 8 } },
    ];
    const matchTiebreakIdx = 0; // Único set
    const set = setResults[matchTiebreakIdx];
    const tbMin = 10;
    const p1Won = set.p1Games >= tbMin && set.p1Games - set.p2Games >= 2;
    expect(p1Won).toBe(true);
  });

  it("deve normalizar estado mal persistido de match tie-break", () => {
    // Estado mal persistido: games no lugar de pontos do tie-break
    const malformedState = malformedMtState([
      { player1: 10, player2: 7, isTiebreak: false, tiebreakScore: null },
    ]);
    const normalized = normalizeMatchTiebreakState(malformedState, 'BEST_OF_3_MATCH_TB');
    expect(normalized.sets[0].isTiebreak).toBe(true);
    expect(normalized.sets[0].tiebreakScore).toEqual({ player1: 10, player2: 7 });
    expect(normalized.sets[0].player1).toBe(0);
    expect(normalized.sets[0].player2).toBe(0);
  });

  it("deve normalizar estado mal persistido de MATCH_TB_10", () => {
    // Estado mal persistido: games no lugar de pontos do tie-break
    const malformedState = malformedMtState([
      { player1: 8, player2: 5, isTiebreak: false, tiebreakScore: null },
    ]);
    const normalized = normalizeMatchTiebreakState(malformedState, 'MATCH_TB_10');
    expect(normalized.sets[0].isTiebreak).toBe(true);
    expect(normalized.sets[0].tiebreakScore).toEqual({ player1: 8, player2: 5 });
    expect(normalized.sets[0].player1).toBe(0);
    expect(normalized.sets[0].player2).toBe(0);
  });
});
