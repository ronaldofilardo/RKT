/** @jest-environment jsdom */
import React from "react";
import { render, screen } from "@testing-library/react";
import { MatchCard } from "@/components/dashboard/MatchCard";
import { game, matchCard, scoreState, setScore, snapshot, snapshotEnveloped } from "./matchCardTestData";

describe("MatchCard — placar de sessão suspensa", () => {
  it("exibe placar atual para cards de sessão suspensa com scoreState válido", () => {
    const match = matchCard({
      p1Name: "M. Santos",
      p2Name: "J. Silva",
      scoreState: scoreState({ sets: [setScore(3, 2)] }),
      suspendedSessionId: "session-1",
    });

    const { container } = render(<MatchCard match={match} />);

    expect(container.textContent).toContain("3");
    expect(container.textContent).toContain("2");
  });

  it("exibe placar atual para cards de sessão suspensa com snapshot em formato state/history", () => {
    const match = matchCard({
      p1Name: "Alice",
      p2Name: "Bob",
      suspendedSessionId: "session-2",
      matchStateSnapshot: snapshotEnveloped({ sets: [setScore(4, 1)] }),
    });

    const { container } = render(<MatchCard match={match} />);

    expect(container.textContent).toContain("4");
    expect(container.textContent).toContain("1");
  });

  it("exibe status 'Suspensa' para partidas com suspendedSessionId", () => {
    const match = matchCard({
      p1Name: "P. A",
      p2Name: "Player B",
      scoreState: scoreState({ sets: [setScore(1, 0)] }),
      suspendedSessionId: "session-5",
    });

    render(<MatchCard match={match} />);

    expect(screen.getByText("Suspensa")).toBeTruthy();
  });

  it("exibe placar de sets mesmo quando 0-0 para partidas com suspendedSessionId", () => {
    const match = matchCard({
      p1Name: "Player K",
      p2Name: "Player L",
      matchStateSnapshot: snapshot({ sets: [setScore(0, 0)] }),
      suspendedSessionId: "session-12",
    });

    render(<MatchCard match={match} />);

    expect(screen.getByText("Suspensa")).toBeTruthy();
  });

  it("exibe placar de games do set atual para partidas suspensas com sets em andamento", () => {
    const match = matchCard({
      p1Name: "P. M",
      p2Name: "Player N",
      matchStateSnapshot: snapshot({ sets: [setScore(2, 1)], currentGame: game(1, 0) }),
      suspendedSessionId: "session-13",
    });

    const { container } = render(<MatchCard match={match} />);

    expect(container.textContent).toContain("2");
    expect(container.textContent).toContain("1");
  });
});
