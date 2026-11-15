/** @jest-environment jsdom */
import React from "react";
import { render, screen } from "@testing-library/react";
import { MatchCard } from "@/components/dashboard/MatchCard";
import { game, matchCard, scoreState, setScore, snapshot } from "./matchCardTestData";

describe("MatchCard — placar ao vivo (IN_PROGRESS)", () => {
  it("exibe placar para partidas IN_PROGRESS sem suspendedSessionId mas com scoreState", () => {
    const match = matchCard({
      p1Name: "Carlos",
      p2Name: "Daniel",
      scoreState: scoreState({
        sets: [setScore(2, 3), setScore(1, 0)],
        server: "player2",
        setsWon: { player1: 0, player2: 1 },
      }),
    });

    const { container } = render(<MatchCard match={match} />);

    expect(container.textContent).toContain("2");
    expect(container.textContent).toContain("3");
    expect(screen.getAllByText("1").length).toBeGreaterThanOrEqual(1);
  });

  it("exibe placar para partidas IN_PROGRESS sem suspendedSessionId mas com matchStateSnapshot", () => {
    const match = matchCard({
      p1Name: "Elena",
      p2Name: "Fernanda",
      matchStateSnapshot: snapshot({ sets: [setScore(5, 4)] }),
    });

    const { container } = render(<MatchCard match={match} />);

    expect(container.textContent).toContain("5");
    expect(container.textContent).toContain("4");
  });

  it("exibe status 'Em Andamento' para partidas IN_PROGRESS sem suspendedSessionId", () => {
    const match = matchCard({
      p1Name: "P. C",
      p2Name: "Player D",
      scoreState: scoreState({ sets: [setScore(0, 1)], server: "player2" }),
    });

    render(<MatchCard match={match} />);

    expect(screen.getByText("Em Andamento")).toBeTruthy();
  });

  it("não exibe placar quando scoreState e matchStateSnapshot são null", () => {
    const match = matchCard({ p1Name: "P. E", p2Name: "Player F" });

    render(<MatchCard match={match} />);

    expect(screen.queryByText(/^-/)).toBeFalsy();
  });

  it("exibe status 'Em Andamento' para partidas sem suspendedSessionId", () => {
    const match = matchCard({
      p1Name: "P. I",
      p2Name: "Player J",
      scheduledAt: "2026-07-01T11:11:00.000Z",
      scoreState: scoreState({ sets: [], currentGame: game(0, 1) }),
    });

    const { container } = render(<MatchCard match={match} />);

    expect(screen.getByText("Em Andamento")).toBeTruthy();
    expect(container.textContent).toContain("0");
    expect(screen.getByText(/01\/07\/2026/)).toBeTruthy();
  });
});
