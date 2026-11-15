/** @jest-environment jsdom */
import React from "react";
import { render, screen } from "@testing-library/react";
import { MatchCard } from "@/components/dashboard/MatchCard";
import { game, matchCard, scoreState } from "./matchCardTestData";

describe("MatchCard — pontos do game atual", () => {
  it("exibe pontos do currentGame quando sets está vazio", () => {
    const match = matchCard({
      p1Name: "J. Silva",
      p2Name: "P. Oliveira",
      scheduledAt: "2026-07-01T11:11:00.000Z",
      scoreState: scoreState({ sets: [], currentGame: game(1, 2), server: "player2" }),
    });

    render(<MatchCard match={match} />);

    expect(screen.getByText("15")).toBeTruthy();
    expect(screen.getByText("30")).toBeTruthy();
  });

  it("exibe AD quando há vantagem", () => {
    const match = matchCard({
      p1Name: "P. G",
      p2Name: "Player H",
      scoreState: scoreState({ sets: [], currentGame: game(3, 3, "player1") }),
    });

    const { container } = render(<MatchCard match={match} />);

    expect(container.textContent).toContain("AD");
  });
});
