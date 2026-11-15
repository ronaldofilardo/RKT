/** @jest-environment jsdom */
import React from "react";
import { render, screen } from "@testing-library/react";
import { MatchCard } from "@/components/dashboard/MatchCard";
import { matchCard, scoreState, setScore } from "./matchCardTestData";

describe("MatchCard — labels 'Sets' e 'Pontos'", () => {
  it("exibe cabeçalhos 'Set N' acima dos números dos sets em partida finalizada", () => {
    const match = matchCard({
      state: "FINISHED",
      format: "BEST_OF_5",
      p1Name: "P. Oliveira",
      p2Name: "J. Silva",
      scoreState: scoreState({
        sets: [setScore(6, 3), setScore(6, 3), setScore(2, 6), setScore(1, 6), setScore(7, 6)],
        isFinished: true,
        winner: "player1",
        setsWon: { player1: 3, player2: 2 },
      }),
    });

    render(<MatchCard match={match} />);

    expect(screen.getByText("Set 1")).toBeTruthy();
    expect(screen.getByText("Set 5")).toBeTruthy();
  });

  it("NÃO exibe label 'Pontos' em partida FINALIZADA", () => {
    const match = matchCard({
      state: "FINISHED",
      p1Name: "P. A",
      p2Name: "Player B",
      scoreState: scoreState({
        sets: [setScore(6, 4), setScore(6, 2)],
        isFinished: true,
        winner: "player1",
        setsWon: { player1: 2, player2: 0 },
      }),
    });

    render(<MatchCard match={match} />);

    expect(screen.queryByText("Pontos")).toBeFalsy();
    expect(screen.getAllByText("6").length).toBeGreaterThanOrEqual(1);
  });

  it("exibe label 'Pontos' em partida Em Andamento", () => {
    const match = matchCard({
      p1Name: "J. Silva",
      p2Name: "Play1",
      scoreState: scoreState({ sets: [setScore(7, 10, { player1: 7, player2: 10 })] }),
    });

    const { container } = render(<MatchCard match={match} />);

    expect(container.textContent).toContain("Pontos");
  });

  it("NÃO encontra 'Pontos' no card finalizado com Match Tie break", () => {
    const match = matchCard({
      state: "FINISHED",
      format: "MATCH_TB_10",
      p1Name: "J. Silva",
      p2Name: "Play1",
      scoreState: scoreState({
        sets: [setScore(0, 0, { player1: 7, player2: 10 })],
        isFinished: true,
        winner: "player2",
        setsWon: { player1: 0, player2: 1 },
      }),
    });

    const { container } = render(<MatchCard match={match} />);

    expect(container.textContent).not.toContain("Pontos");
  });
});
