/**
 * Split de scoring-protections.test.ts — PROTEÇÃO #3 (Sets Won Floor Check):
 * prevenção de regressão de sets won, progresso normal e empate (mesmo valor).
 * Asserções 1:1.
 */
describe('PROTEÇÃO #3: Sets Won Floor Check', () => {
  it("deve prevenir regressão de sets won", () => {
    const bankSetsWon = { player1: 1, player2: 1 };
    const newSetsWon = { player1: 0, player2: 2 }; // Player 1 regrediu de 1 para 0
    const regression =
      newSetsWon.player1 < bankSetsWon.player1 ||
      newSetsWon.player2 < bankSetsWon.player2;
    expect(regression).toBe(true); // Regressão detectada!
  });

  it("deve permitir progresso normal de sets won", () => {
    const bankSetsWon = { player1: 1, player2: 0 };
    const newSetsWon = { player1: 2, player2: 0 }; // Player 1 venceu mais um set
    const regression =
      newSetsWon.player1 < bankSetsWon.player1 ||
      newSetsWon.player2 < bankSetsWon.player2;
    expect(regression).toBe(false); // Sem regressão
  });

  it("deve permitir empate em sets won (mesmo valor)", () => {
    const bankSetsWon = { player1: 1, player2: 1 };
    const newSetsWon = { player1: 1, player2: 1 }; // Mesmo estado
    const regression =
      newSetsWon.player1 < bankSetsWon.player1 ||
      newSetsWon.player2 < bankSetsWon.player2;
    expect(regression).toBe(false); // Sem regressão (permite re-hidratação)
  });
});
