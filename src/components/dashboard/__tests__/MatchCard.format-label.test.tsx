/** @jest-environment jsdom */
import React from "react";
import { render, screen } from "@testing-library/react";
import { MatchCard } from "@/components/dashboard/MatchCard";
import { matchCard, scoreState, setScore } from "./matchCardTestData";

describe("MatchCard — formato da partida", () => {
  it.each([
    ["BEST_OF_3", "Melhor de 3 sets com vantagem"],
    ["BEST_OF_3_MATCH_TB", "Melhor de 3 sets com vantagem e Match Tie break (MT)"],
    ["BEST_OF_5", "Melhor de 5 sets (Grand Slam)"],
    ["SHORT_SET_2V2_NO_AD", 'Melhor de 3 sets "no ad" e placar inicia em 2/2 e MT'],
    ["MATCH_TB_10", "Match Tie break"],
    ["PRO_SET_8", "Set profissional até 8 games com vantagem"],
  ])("exibe o formato %s traduzido para português", (format, label) => {
    const match = matchCard({ format, scoreState: scoreState({ sets: [setScore(0, 0)] }) });

    const { container } = render(<MatchCard match={match} />);

    expect(container.textContent).toContain(label);
  });

  it("exibe formato original como fallback quando não mapeado", () => {
    const match = matchCard({
      format: "UNKNOWN_FORMAT",
      scoreState: scoreState({ sets: [setScore(0, 0)] }),
    });

    render(<MatchCard match={match} />);

    expect(screen.getByText(/UNKNOWN_FORMAT/)).toBeTruthy();
  });
});
