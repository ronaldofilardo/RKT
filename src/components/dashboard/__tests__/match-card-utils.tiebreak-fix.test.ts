/**
 * @jest-environment jsdom
 */
import React from "react";
import { render } from "@testing-library/react";
import {
  formatCompactSetScore,
  isSetIndexMatchTiebreak,
  isCurrentSetMatchTiebreak,
} from "@/components/dashboard/match-card.logic";

describe("formatCompactSetScore", () => {
  it("set normal sem tiebreak mostra só os games", () => {
    const set = { player1: 6, player2: 4, isTiebreak: false, tiebreakScore: null };
    expect(formatCompactSetScore(set, "player1")).toBe("6");
    expect(formatCompactSetScore(set, "player2")).toBe("4");
  });

  it("tiebreak EM ANDAMENTO (games 6x6) deve mostrar games + pontos em superscript", () => {
    const set = {
      player1: 6,
      player2: 6,
      isTiebreak: true,
      tiebreakScore: { player1: 1, player2: 1 },
    };
    const r1 = render(React.createElement("div", null, formatCompactSetScore(set, "player1")));
    expect(r1.container.textContent).toBe("61");
    expect(r1.container.querySelector("sup")?.textContent).toBe("1");
  });

  it("tiebreak JÁ RESOLVIDO (7x6) mostra games + pontos do TB em sobrescrito para ambos", () => {
    const set = {
      player1: 7,
      player2: 6,
      isTiebreak: true,
      tiebreakScore: { player1: 10, player2: 8 },
    };
    const r1 = render(React.createElement("div", null, formatCompactSetScore(set, "player1")));
    expect(r1.container.textContent).toBe("710");
    expect(r1.container.querySelector("sup")?.textContent).toBe("10");

    const r2 = render(React.createElement("div", null, formatCompactSetScore(set, "player2")));
    expect(r2.container.textContent).toBe("68");
    expect(r2.container.querySelector("sup")?.textContent).toBe("8");
  });

  it("Match Tiebreak decisivo (isDecisiveMatchTiebreak=true) mostra vencedor com sup do oponente e perdedor direto", () => {
    const set = {
      player1: 0,
      player2: 0,
      isTiebreak: true,
      tiebreakScore: { player1: 10, player2: 7 },
    };
    const r1 = render(React.createElement("div", null, formatCompactSetScore(set, "player1", true)));
    expect(r1.container.textContent).toBe("107");
    expect(r1.container.querySelector("sup")?.textContent).toBe("7");
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
