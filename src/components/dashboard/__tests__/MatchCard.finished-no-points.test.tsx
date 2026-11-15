/** @jest-environment jsdom */
import React from "react";
import { render, screen } from "@testing-library/react";
import { MatchCard } from "@/components/dashboard/MatchCard";
import { matchCard, scoreState, setScore } from "./matchCardTestData";

describe("MatchCard — partida finalizada não exibe coluna Pontos", () => {
  it("partida FINALIZADA BEST_OF_3 com 3º set em tiebreak NÃO exibe coluna Pontos", () => {
    const match = matchCard({
      state: "FINISHED",
      format: "BEST_OF_3_NO_AD",
      p1Name: "Ronald",
      p2Name: "Mateus",
      scheduledAt: "2026-08-14T15:12:00.000Z",
      scoreState: scoreState({
        sets: [setScore(6, 3), setScore(5, 7), setScore(0, 0, { player1: 10, player2: 7 })],
        isFinished: true,
        winner: "player1",
        setsWon: { player1: 2, player2: 1 },
      }),
    });

    const { container } = render(<MatchCard match={match} />);

    expect(container.textContent).toContain("10");
    expect(container.textContent).toContain("7");
    expect(screen.queryByText("Pontos")).toBeFalsy();
    expect(screen.queryByText("-")).toBeFalsy();
  });

  it("partida FINALIZADA BEST_OF_5 com 5º set em tiebreak NÃO exibe coluna Pontos", () => {
    const match = matchCard({
      state: "FINISHED",
      format: "BEST_OF_5",
      p1Name: "Eduardo",
      p2Name: "Mateus",
      scheduledAt: "2026-08-14T14:11:00.000Z",
      scoreState: scoreState({
        sets: [setScore(3, 6), setScore(6, 4), setScore(3, 6), setScore(7, 5), setScore(0, 0, { player1: 10, player2: 2 })],
        isFinished: true,
        winner: "player1",
        setsWon: { player1: 3, player2: 2 },
      }),
    });

    const { container } = render(<MatchCard match={match} />);

    expect(container.textContent).toContain("10");
    expect(container.textContent).toContain("2");
    expect(screen.queryByText("Pontos")).toBeFalsy();
    expect(screen.queryByText("-")).toBeFalsy();
  });

  it("partida FINALIZADA com último set regular NÃO exibe coluna Pontos", () => {
    const match = matchCard({
      state: "FINISHED",
      scoreState: scoreState({
        sets: [setScore(6, 4), setScore(6, 2)],
        isFinished: true,
        winner: "player1",
        setsWon: { player1: 2, player2: 0 },
      }),
    });

    const { container } = render(<MatchCard match={match} />);

    expect(container.textContent).toContain("P1");
    expect(screen.queryByText("Pontos")).toBeFalsy();
    expect(screen.queryByText("-")).toBeFalsy();
  });
});
