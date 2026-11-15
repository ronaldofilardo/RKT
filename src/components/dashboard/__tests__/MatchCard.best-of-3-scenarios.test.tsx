/** @jest-environment jsdom */
import React from "react";
import { render, screen } from "@testing-library/react";
import { MatchCard } from "@/components/dashboard/MatchCard";
import { game, matchCard, scoreState, setScore } from "./matchCardTestData";

describe("MatchCard — cenários de placar BEST_OF_3", () => {
  it("BEST_OF_3 com 1 set mostra placar de sets (sem pontos do game)", () => {
    const match = matchCard({
      scoreState: scoreState({
        sets: [setScore(3, 2)],
        currentGame: { ...game(3, 3), isDeuce: true },
      }),
    });

    render(<MatchCard match={match} />);

    expect(screen.queryAllByText("40").length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText("3")).toBeTruthy();
    expect(screen.getByText("2")).toBeTruthy();
  });

  it("BEST_OF_3_MATCH_TB com 2 sets 1-1 e 3º set em tiebreak mostra '-'", () => {
    const match = matchCard({
      format: "BEST_OF_3_MATCH_TB",
      scoreState: scoreState({
        sets: [setScore(6, 4), setScore(4, 6), setScore(0, 0, { player1: 5, player2: 3 })],
        setsWon: { player1: 1, player2: 1 },
      }),
    });

    const { container } = render(<MatchCard match={match} />);

    expect(container.textContent).toContain("-");
  });

  it("BEST_OF_3 com 1-1 e set normal em andamento mostra pontos reais", () => {
    const match = matchCard({
      scoreState: scoreState({
        sets: [setScore(6, 4), setScore(4, 6)],
        currentGame: game(3, 2),
        setsWon: { player1: 1, player2: 1 },
      }),
    });

    const { container } = render(<MatchCard match={match} />);

    expect(container.textContent).not.toContain("15");
    expect(container.textContent).toContain("30");
    expect(container.textContent).toContain("6");
    expect(container.textContent).toContain("4");
  });
});
