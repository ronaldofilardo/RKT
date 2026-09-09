/**
 * @jest-environment jsdom
 */
/**
 * Regressão (2026-09-08): no dashboard, o card de uma partida com o set
 * atual em tiebreak comum (games 6x6) mostrava "1 1" (os pontos do tiebreak
 * duplicados), sem nenhum indício do placar de games (6x6) do set.
 */
import React from "react";
import { render } from "@testing-library/react";
import { MatchCard } from "@/components/dashboard/MatchCard";

describe("MatchCard — set atual em tiebreak comum", () => {
  it("mostra o placar de games do set (6) junto com o ponto do tiebreak (1), não só o ponto isolado", () => {
    const match = {
      id: "match-tb",
      state: "IN_PROGRESS",
      format: "BEST_OF_3",
      player1: { name: "Eduardo" },
      player2: { name: "Mateus" },
      scheduledAt: null,
      scoreState: {
        sets: [
          { player1: 6, player2: 3, isTiebreak: false, tiebreakScore: null },
          { player1: 6, player2: 7, isTiebreak: false, tiebreakScore: null },
          { player1: 6, player2: 6, isTiebreak: true, tiebreakScore: { player1: 1, player2: 1 } },
        ],
        currentGame: { player1: 0, player2: 0, isDeuce: false, advantage: null },
        server: "player1",
        isFinished: false,
        winner: null,
        setsWon: { player1: 1, player2: 1 },
      },
      suspendedSessionId: null,
      matchStateSnapshot: null,
    };

    const { container } = render(<MatchCard match={match} />);
    const text = container.textContent ?? "";

    // O placar de games do set atual (6) precisa aparecer combinado com o
    // ponto do tiebreak — antes do fix, "6 [1]" nunca aparecia no texto.
    expect(text).toContain("6");
    expect(text).toContain("6 [1]");
  });
});
