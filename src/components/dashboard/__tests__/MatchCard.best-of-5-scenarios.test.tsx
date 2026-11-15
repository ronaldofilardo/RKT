/** @jest-environment jsdom */
import React from "react";
import { render, screen } from "@testing-library/react";
import { MatchCard } from "@/components/dashboard/MatchCard";
import { game, matchCard, scoreState, setScore } from "./matchCardTestData";

describe("MatchCard — cenários de placar BEST_OF_5", () => {
  it("BEST_OF_5 com 1 set mostra pontos reais (não '-')", () => {
    const match = matchCard({
      format: "BEST_OF_5",
      p1Name: "Eduardo",
      p2Name: "Ronaldo",
      scoreState: scoreState({ sets: [setScore(1, 0)], currentGame: game(2, 1) }),
    });

    render(<MatchCard match={match} />);

    expect(screen.getByText("30")).toBeTruthy();
    expect(screen.getByText("15")).toBeTruthy();
  });

  it("BEST_OF_5 com 4 sets 2-2 e 5º set em tiebreak mostra placar do TB", () => {
    const match = matchCard({
      format: "BEST_OF_5",
      scoreState: scoreState({
        sets: [
          setScore(6, 4),
          setScore(4, 6),
          setScore(6, 4),
          setScore(4, 6),
          setScore(0, 0, { player1: 3, player2: 2 }),
        ],
        setsWon: { player1: 2, player2: 2 },
      }),
    });

    const { container } = render(<MatchCard match={match} />);

    // O 5º set (match tiebreak em andamento) mostra os pontos do TB
    expect(container.textContent).toContain("3");
    expect(container.textContent).toContain("2");
  });

  it("BEST_OF_5 com sets 3-1 mostra pontos reais (não é set decisivo)", () => {
    const match = matchCard({
      format: "BEST_OF_5",
      scoreState: scoreState({
        sets: [setScore(6, 4), setScore(4, 6), setScore(6, 4), setScore(3, 2)],
        currentGame: game(1, 2),
        setsWon: { player1: 2, player2: 1 },
      }),
    });

    const { container } = render(<MatchCard match={match} />);

    expect(container.textContent).toContain("15");
    expect(container.textContent).toContain("30");
    expect(container.textContent).toContain("6");
    expect(container.textContent).toContain("4");
  });
});
