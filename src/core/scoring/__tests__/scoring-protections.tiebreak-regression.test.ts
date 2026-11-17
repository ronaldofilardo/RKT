/**
 * Split de scoring-protections.test.ts — PROTEÇÃO #2 (regressão de tie-break):
 * regressão em tie-break regular, progresso normal e variante de match
 * tie-break mal persistido. Asserções 1:1.
 */
import { isTiebreakRegressing, isMalPersistedRegressing } from './scoringProtectionsTestKit';

describe('PROTEÇÃO #2: Regressão de Tie-Break', () => {
  it("deve detectar regressão em tie-break regular", () => {
    const oldTiebreak = { player1: 5, player2: 3, isTiebreak: true, tiebreakScore: { player1: 5, player2: 3 } };
    const newTiebreak = { player1: 3, player2: 3, isTiebreak: true, tiebreakScore: { player1: 3, player2: 3 } };
    expect(isTiebreakRegressing(oldTiebreak, newTiebreak)).toBe(true); // Regressão detectada!
  });

  it("deve permitir progresso normal em tie-break", () => {
    const oldTiebreak = { player1: 3, player2: 3, isTiebreak: true, tiebreakScore: { player1: 3, player2: 3 } };
    const newTiebreak = { player1: 5, player2: 3, isTiebreak: true, tiebreakScore: { player1: 5, player2: 3 } };
    expect(isTiebreakRegressing(oldTiebreak, newTiebreak)).toBe(false); // Sem regressão
  });

  it("deve detectar regressão em match tie-break mal persistido", () => {
    // Estado mal persistido: games no lugar de pontos
    const oldMatchTb = { player1: 8, player2: 5, isTiebreak: false, tiebreakScore: { player1: 8, player2: 5 } };
    const newMatchTb = { player1: 5, player2: 5, isTiebreak: false, tiebreakScore: { player1: 5, player2: 5 } };
    expect(isMalPersistedRegressing(oldMatchTb, newMatchTb)).toBe(true); // Regressão detectada!
  });
});
