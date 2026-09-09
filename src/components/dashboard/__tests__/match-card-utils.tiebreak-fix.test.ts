/**
 * Regressão (2026-09-08): card de partida em /dashboard mostrava só os
 * pontos do tiebreak (ex.: "1") para o set atual em 6x6, perdendo o placar
 * de games do set. formatCompactSetScore ganhou o parâmetro
 * isDecisiveMatchTiebreak e isSetIndexMatchTiebreak generaliza
 * isCurrentSetMatchTiebreak para qualquer índice de set.
 */
import {
  formatCompactSetScore,
  isSetIndexMatchTiebreak,
  isCurrentSetMatchTiebreak,
} from "@/components/dashboard/match-card-utils";

describe("formatCompactSetScore", () => {
  it("set normal sem tiebreak mostra só os games", () => {
    const set = { player1: 6, player2: 4, isTiebreak: false, tiebreakScore: null };
    expect(formatCompactSetScore(set, "player1")).toBe("6");
    expect(formatCompactSetScore(set, "player2")).toBe("4");
  });

  it("BUG (2026-09-08): tiebreak EM ANDAMENTO (games 6x6) deve mostrar games + pontos, não só os pontos", () => {
    const set = {
      player1: 6,
      player2: 6,
      isTiebreak: true,
      tiebreakScore: { player1: 1, player2: 1 },
    };
    // Antes do fix, isso retornava apenas "1" (perdendo os games 6x6).
    expect(formatCompactSetScore(set, "player1")).toBe("6 [1]");
    expect(formatCompactSetScore(set, "player2")).toBe("6 [1]");
  });

  it("tiebreak JÁ RESOLVIDO (7x6) continua mostrando games + pontos do TB", () => {
    const set = {
      player1: 7,
      player2: 6,
      isTiebreak: true,
      tiebreakScore: { player1: 10, player2: 8 },
    };
    expect(formatCompactSetScore(set, "player1")).toBe("7 [10]");
    expect(formatCompactSetScore(set, "player2")).toBe("6 [8]");
  });

  it("Match Tiebreak decisivo (isDecisiveMatchTiebreak=true) mostra só os pontos", () => {
    const set = {
      player1: 0,
      player2: 0,
      isTiebreak: true,
      tiebreakScore: { player1: 10, player2: 7 },
    };
    expect(formatCompactSetScore(set, "player1", true)).toBe("10 [7]");
    expect(formatCompactSetScore(set, "player2", true)).toBe("7");
  });
});

describe("isSetIndexMatchTiebreak", () => {
  it("retorna false para formatos que não usam Match Tiebreak", () => {
    const sets = [{ player1: 6, player2: 4, isTiebreak: false, tiebreakScore: null }];
    expect(isSetIndexMatchTiebreak(sets, 0, "BEST_OF_3")).toBe(false);
  });

  it("identifica o 5º set (índice 4) como decisivo em BEST_OF_5 2-2", () => {
    const sets = [
      { player1: 6, player2: 4, isTiebreak: false, tiebreakScore: null },
      { player1: 4, player2: 6, isTiebreak: false, tiebreakScore: null },
      { player1: 6, player2: 4, isTiebreak: false, tiebreakScore: null },
      { player1: 4, player2: 6, isTiebreak: false, tiebreakScore: null },
      { player1: 0, player2: 0, isTiebreak: true, tiebreakScore: { player1: 3, player2: 2 } },
    ];
    expect(isSetIndexMatchTiebreak(sets, 4, "BEST_OF_5")).toBe(true);
  });

  it("NÃO identifica um set intermediário comum como decisivo, mesmo em tiebreak", () => {
    // 3º set de um BEST_OF_5 (índice 2), em tiebreak comum de set (6x6) —
    // não é o set decisivo, mesmo que esteja em tiebreak.
    const sets = [
      { player1: 6, player2: 4, isTiebreak: false, tiebreakScore: null },
      { player1: 4, player2: 6, isTiebreak: false, tiebreakScore: null },
      { player1: 6, player2: 6, isTiebreak: true, tiebreakScore: { player1: 2, player2: 1 } },
    ];
    expect(isSetIndexMatchTiebreak(sets, 2, "BEST_OF_5")).toBe(false);
  });

  it("continua consistente com isCurrentSetMatchTiebreak para o último índice", () => {
    const sets = [
      { player1: 6, player2: 4, isTiebreak: false, tiebreakScore: null },
      { player1: 4, player2: 6, isTiebreak: false, tiebreakScore: null },
      { player1: 0, player2: 0, isTiebreak: true, tiebreakScore: { player1: 5, player2: 3 } },
    ];
    expect(isSetIndexMatchTiebreak(sets, sets.length - 1, "BEST_OF_3_MATCH_TB")).toBe(
      isCurrentSetMatchTiebreak(sets, "BEST_OF_3_MATCH_TB")
    );
    expect(isCurrentSetMatchTiebreak(sets, "BEST_OF_3_MATCH_TB")).toBe(true);
  });
});
