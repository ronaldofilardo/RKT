/** @jest-environment jsdom */
import React from "react";
import { render, screen } from "@testing-library/react";
import { MatchCard } from "@/components/dashboard/MatchCard";
import { game, matchCard, scoreState, setScore } from "./matchCardTestData";

describe("MatchCard — coluna de pontos", () => {
  it("exibe pontuação centralizada nas colunas dos sets e pontos", () => {
    const match = matchCard({
      format: "BEST_OF_5",
      p1Name: "P. C",
      p2Name: "Player D",
      scoreState: scoreState({
        sets: [setScore(3, 2), setScore(4, 4)],
        currentGame: game(2, 1),
      }),
    });

    const { container } = render(<MatchCard match={match} />);

    expect(container.textContent).toContain("3");
    expect(container.textContent).toContain("2");
    expect(container.textContent).toContain("4");
    expect(container.textContent).toContain("15");
    expect(container.textContent).toContain("30");
  });

  it("exibe apenas pontos com label 'Pontos' quando sets está vazio", () => {
    const match = matchCard({
      p1Name: "S. Jogador",
      p2Name: "P. Oliveira",
      scheduledAt: "2026-07-14T11:11:00.000Z",
      scoreState: scoreState({ sets: [], currentGame: game(2, 1) }),
    });

    render(<MatchCard match={match} />);

    expect(screen.getByText("30")).toBeTruthy();
    expect(screen.getByText("15")).toBeTruthy();
    expect(screen.getByText("S. Jogador")).toBeTruthy();
    expect(screen.getByText("P. Oliveira")).toBeTruthy();
  });
});
