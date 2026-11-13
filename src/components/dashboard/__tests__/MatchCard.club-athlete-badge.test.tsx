/**
 * @jest-environment jsdom
 */

import React from "react";
import { render, screen } from "@testing-library/react";
import { MatchCard } from "@/components/dashboard/MatchCard";

describe("MatchCard - Badges de Clube e Atleta ('Meu Clube' vs 'Meu Atleta')", () => {
  it("exibe 'Meu Clube' para atleta pertencente ao CT ativo e o clube externo para o adversário", () => {
    const match = {
      id: "match-ct-1",
      state: "IN_PROGRESS",
      format: "BEST_OF_3",
      ctId: "ct-rkt-id",
      player1: {
        id: "p1",
        name: "João",
        club: "CT RKT",
        playerCts: [{ ctId: "ct-rkt-id" }],
      },
      player2: {
        id: "p2",
        name: "Alfeu",
        club: "MTC",
        playerCts: [{ ctId: "ct-outro-id" }],
      },
      scheduledAt: null,
      scoreState: {
        sets: [{ player1: 0, player2: 0, isTiebreak: false, tiebreakScore: null }],
        currentGame: { player1: 15, player2: 0, isDeuce: false, advantage: null },
        server: "player1",
        isFinished: false,
        winner: null,
        setsWon: { player1: 0, player2: 0 },
      },
      suspendedSessionId: undefined,
      matchStateSnapshot: null,
    };

    render(<MatchCard match={match} ctId="ct-rkt-id" ctName="CT RKT" />);

    expect(screen.getByText("Meu Clube")).toBeInTheDocument();
    expect(screen.getByText("MTC")).toBeInTheDocument();
  });

  it("exibe 'Meu Atleta' para treinador avulso (PARTICULAR) listando partida do seu próprio atleta", () => {
    const match = {
      id: "match-coach-1",
      state: "IN_PROGRESS",
      format: "BEST_OF_3",
      ctId: null,
      player1: {
        id: "p-meu-atleta",
        name: "João",
        club: null,
        createdByUserId: "coach-user-id",
      },
      player2: {
        id: "p-adversario",
        name: "Samuel",
        club: null,
        createdByUserId: "outro-user-id",
      },
      scheduledAt: null,
      scoreState: {
        sets: [{ player1: 0, player2: 0, isTiebreak: false, tiebreakScore: null }],
        currentGame: { player1: 0, player2: 0, isDeuce: false, advantage: null },
        server: "player1",
        isFinished: false,
        winner: null,
        setsWon: { player1: 0, player2: 0 },
      },
      suspendedSessionId: undefined,
      matchStateSnapshot: null,
    };

    render(
      <MatchCard
        match={match}
        ctId="PARTICULAR"
        userId="coach-user-id"
        followedPlayerIds={["p-meu-atleta"]}
      />
    );

    expect(screen.getByText("Meu Atleta")).toBeInTheDocument();
    expect(screen.getByText("Outros")).toBeInTheDocument();
  });

  it("exibe badge 'Criada por [nome]' ao lado do adversário quando a partida possui createdByName", () => {
    const match = {
      id: "match-with-creator",
      state: "IN_PROGRESS",
      format: "BEST_OF_3",
      ctId: "ct-rkt-id",
      createdByName: "Carlos Gestor",
      player1: {
        id: "p1",
        name: "João",
        club: "CT RKT",
        playerCts: [{ ctId: "ct-rkt-id" }],
      },
      player2: {
        id: "p2",
        name: "Pedro",
        club: "Outro Clube",
        playerCts: [{ ctId: "ct-outro-id" }],
      },
      scheduledAt: null,
      scoreState: {
        sets: [{ player1: 0, player2: 0, isTiebreak: false, tiebreakScore: null }],
        currentGame: { player1: 0, player2: 0, isDeuce: false, advantage: null },
        server: "player1",
        isFinished: false,
        winner: null,
        setsWon: { player1: 0, player2: 0 },
      },
    };

    render(<MatchCard match={match} ctId="ct-rkt-id" ctName="CT RKT" />);

    expect(screen.getByText("Meu Clube")).toBeInTheDocument();
    expect(screen.getByText("Criada por Carlos Gestor")).toBeInTheDocument();
  });
});

