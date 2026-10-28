/**
 * @jest-environment jsdom
 */
import React from "react";
import { render } from "@testing-library/react";
import { formatCompactSetScore } from "@/components/dashboard/match-card.logic";

describe("Regression: Tiebreak display on MatchCard", () => {
  it("vencedor do tiebreak mostra so games; perdedor mostra games + pontos do TB em sobrescrito", () => {
    const set = {
      player1: 7,
      player2: 6,
      isTiebreak: true,
      tiebreakScore: { player1: 7, player2: 2 },
    };

    const c1 = render(React.createElement("div", null, formatCompactSetScore(set, "player1")));
    expect(c1.container.textContent).toBe("7");
    expect(c1.container.querySelector("sup")).toBeNull();

    const c2 = render(React.createElement("div", null, formatCompactSetScore(set, "player2")));
    expect(c2.container.textContent).toBe("62");
    expect(c2.container.querySelector("sup")?.textContent).toBe("2");
  });

  it("placar 8-6 com tiebreak resolvido: vencedor so games, perdedor com sobrescrito", () => {
    const setBugado = {
      player1: 8,
      player2: 6,
      isTiebreak: true,
      tiebreakScore: { player1: 7, player2: 2 },
    };
    const c1 = render(React.createElement("div", null, formatCompactSetScore(setBugado, "player1")));
    expect(c1.container.textContent).toBe("8");
    expect(c1.container.querySelector("sup")).toBeNull();

    const c2 = render(React.createElement("div", null, formatCompactSetScore(setBugado, "player2")));
    expect(c2.container.textContent).toBe("62");
    expect(c2.container.querySelector("sup")?.textContent).toBe("2");
  });
});
