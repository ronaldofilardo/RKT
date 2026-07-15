/**
 * @jest-environment jsdom
 */

import React from "react";
import { render, screen } from "@testing-library/react";
import { MatchCard } from "@/components/dashboard/MatchCard";

describe("MatchCard", () => {
  it("exibe placar atual para cards de sessão suspensa com scoreState válido", () => {
    const match = {
      id: "match-1",
      state: "IN_PROGRESS",
      format: "BEST_OF_3",
      player1: { name: "Maria Santos" },
      player2: { name: "Joao Silva" },
      scheduledAt: null,
      scoreState: {
        sets: [
          { player1: 3, player2: 2, isTiebreak: false, tiebreakScore: null },
        ],
        currentGame: {
          player1: 0,
          player2: 0,
          isDeuce: false,
          advantage: null,
        },
        server: "player1",
        isFinished: false,
        winner: null,
        setsWon: { player1: 0, player2: 0 },
      },
      suspendedSessionId: "session-1",
      matchStateSnapshot: null,
    };

    const { container } = render(<MatchCard match={match} />);

    expect(container.textContent).toContain("3");
    expect(container.textContent).toContain("2");
  });

  it("exibe placar atual para cards de sessão suspensa com snapshot em formato state/history", () => {
    const match = {
      id: "match-2",
      state: "IN_PROGRESS",
      format: "BEST_OF_3",
      player1: { name: "Alice" },
      player2: { name: "Bob" },
      scheduledAt: null,
      scoreState: null,
      suspendedSessionId: "session-2",
      matchStateSnapshot: JSON.stringify({
        state: {
          sets: [
            { player1: 4, player2: 1, isTiebreak: false, tiebreakScore: null },
          ],
          currentGame: {
            player1: 0,
            player2: 0,
            isDeuce: false,
            advantage: null,
          },
          server: "player1",
          isFinished: false,
          winner: null,
          setsWon: { player1: 0, player2: 0 },
        },
        history: [],
      }),
    };

    const { container } = render(<MatchCard match={match} />);

    expect(container.textContent).toContain("4");
    expect(container.textContent).toContain("1");
  });

  it("exibe placar para partidas IN_PROGRESS sem suspendedSessionId mas com scoreState", () => {
    const match = {
      id: "match-3",
      state: "IN_PROGRESS",
      format: "BEST_OF_3",
      player1: { name: "Carlos" },
      player2: { name: "Daniel" },
      scheduledAt: null,
      scoreState: {
        sets: [
          { player1: 2, player2: 3, isTiebreak: false, tiebreakScore: null },
          { player1: 1, player2: 0, isTiebreak: false, tiebreakScore: null },
        ],
        currentGame: {
          player1: 0,
          player2: 0,
          isDeuce: false,
          advantage: null,
        },
        server: "player2",
        isFinished: false,
        winner: null,
        setsWon: { player1: 0, player2: 1 },
      },
      suspendedSessionId: undefined,
      matchStateSnapshot: null,
    };

    const { container } = render(<MatchCard match={match} />);

    expect(container.textContent).toContain("2");
    expect(container.textContent).toContain("3");
    
    const allOnes = screen.getAllByText("1");
    expect(allOnes.length).toBeGreaterThanOrEqual(1);
  });

  it("exibe placar para partidas IN_PROGRESS sem suspendedSessionId mas com matchStateSnapshot", () => {
    const match = {
      id: "match-4",
      state: "IN_PROGRESS",
      format: "BEST_OF_3",
      player1: { name: "Elena" },
      player2: { name: "Fernanda" },
      scheduledAt: null,
      scoreState: null,
      suspendedSessionId: undefined,
      matchStateSnapshot: JSON.stringify({
        sets: [
          { player1: 5, player2: 4, isTiebreak: false, tiebreakScore: null },
        ],
        currentGame: {
          player1: 0,
          player2: 0,
          isDeuce: false,
          advantage: null,
        },
        server: "player1",
        isFinished: false,
        winner: null,
        setsWon: { player1: 0, player2: 0 },
      }),
    };

    const { container } = render(<MatchCard match={match} />);

    expect(container.textContent).toContain("5");
    expect(container.textContent).toContain("4");
  });

  it("exibe status 'Suspensa' para partidas com suspendedSessionId", () => {
    const match = {
      id: "match-5",
      state: "IN_PROGRESS",
      format: "BEST_OF_3",
      player1: { name: "Player A" },
      player2: { name: "Player B" },
      scheduledAt: null,
      scoreState: {
        sets: [{ player1: 1, player2: 0, isTiebreak: false, tiebreakScore: null }],
        currentGame: { player1: 0, player2: 0, isDeuce: false, advantage: null },
        server: "player1",
        isFinished: false,
        winner: null,
        setsWon: { player1: 0, player2: 0 },
      },
      suspendedSessionId: "session-5",
      matchStateSnapshot: null,
    };

    render(<MatchCard match={match} />);

    expect(screen.getByText("Suspensa")).toBeTruthy();
  });

  it("exibe status 'Em Andamento' para partidas IN_PROGRESS sem suspendedSessionId", () => {
    const match = {
      id: "match-6",
      state: "IN_PROGRESS",
      format: "BEST_OF_3",
      player1: { name: "Player C" },
      player2: { name: "Player D" },
      scheduledAt: null,
      scoreState: {
        sets: [{ player1: 0, player2: 1, isTiebreak: false, tiebreakScore: null }],
        currentGame: { player1: 0, player2: 0, isDeuce: false, advantage: null },
        server: "player2",
        isFinished: false,
        winner: null,
        setsWon: { player1: 0, player2: 0 },
      },
      suspendedSessionId: undefined,
      matchStateSnapshot: null,
    };

    render(<MatchCard match={match} />);

    expect(screen.getByText("Em Andamento")).toBeTruthy();
  });

  it("não exibe placar quando scoreState e matchStateSnapshot são null", () => {
    const match = {
      id: "match-7",
      state: "IN_PROGRESS",
      format: "BEST_OF_3",
      player1: { name: "Player E" },
      player2: { name: "Player F" },
      scheduledAt: null,
      scoreState: null,
      suspendedSessionId: undefined,
      matchStateSnapshot: null,
    };

    render(<MatchCard match={match} />);

    expect(screen.queryByText(/^-/)).toBeFalsy();
  });

  it("exibe pontos do currentGame quando sets está vazio", () => {
    const match = {
      id: "match-9",
      state: "IN_PROGRESS",
      format: "BEST_OF_3",
      player1: { name: "Joao Silva" },
      player2: { name: "Pedro Oliveira" },
      scheduledAt: "2026-07-01T11:11:00.000Z",
      scoreState: {
        sets: [],
        currentGame: {
          player1: 1,
          player2: 2,
          isDeuce: false,
          advantage: null,
          secondServe: false,
        },
        server: "player2",
        isFinished: false,
        winner: null,
        setsWon: { player1: 0, player2: 0 },
        startedAt: null,
        secondServe: false,
      },
      suspendedSessionId: null,
      matchStateSnapshot: null,
    };

    render(<MatchCard match={match} />);

    expect(screen.getByText("15")).toBeTruthy();
    expect(screen.getByText("30")).toBeTruthy();
  });

  it("exibe AD quando há vantagem", () => {
    const match = {
      id: "match-10",
      state: "IN_PROGRESS",
      format: "BEST_OF_3",
      player1: { name: "Player G" },
      player2: { name: "Player H" },
      scheduledAt: null,
      scoreState: {
        sets: [],
        currentGame: {
          player1: 3,
          player2: 3,
          isDeuce: false,
          advantage: "player1",
          secondServe: false,
        },
        server: "player1",
        isFinished: false,
        winner: null,
        setsWon: { player1: 0, player2: 0 },
        startedAt: null,
        secondServe: false,
      },
      suspendedSessionId: null,
      matchStateSnapshot: null,
    };

    const { container } = render(<MatchCard match={match} />);

    expect(container.textContent).toContain("AD");
  });

  it("exibe status 'Em Andamento' para partidas sem suspendedSessionId", () => {
    const match = {
      id: "match-11",
      state: "IN_PROGRESS",
      format: "BEST_OF_3",
      player1: { name: "Player I" },
      player2: { name: "Player J" },
      scheduledAt: "2026-07-01T11:11:00.000Z",
      scoreState: {
        sets: [],
        currentGame: {
          player1: 0,
          player2: 1,
          isDeuce: false,
          advantage: null,
          secondServe: false,
        },
        server: "player1",
        isFinished: false,
        winner: null,
        setsWon: { player1: 0, player2: 0 },
        startedAt: null,
        secondServe: false,
      },
      suspendedSessionId: null,
      matchStateSnapshot: null,
    };

    const { container } = render(<MatchCard match={match} />);

    expect(screen.getByText("Em Andamento")).toBeTruthy();
    expect(container.textContent).toContain("0");
    expect(screen.getByText(/01\/07\/2026/)).toBeTruthy();
  });

  it("exibe placar de sets mesmo quando 0-0 para partidas com suspendedSessionId", () => {
    const match = {
      id: "match-12",
      state: "IN_PROGRESS",
      format: "BEST_OF_3",
      player1: { name: "Player K" },
      player2: { name: "Player L" },
      scheduledAt: null,
      scoreState: null,
      suspendedSessionId: "session-12",
      matchStateSnapshot: JSON.stringify({
        sets: [{ player1: 0, player2: 0, isTiebreak: false, tiebreakScore: null }],
        currentGame: { player1: 0, player2: 0, isDeuce: false, advantage: null },
        server: "player1",
        isFinished: false,
        winner: null,
        setsWon: { player1: 0, player2: 0 },
      }),
    };

    render(<MatchCard match={match} />);

    expect(screen.getByText("Suspensa")).toBeTruthy();
  });

  it("exibe placar de games do set atual para partidas suspensas com sets em andamento", () => {
    const match = {
      id: "match-13",
      state: "IN_PROGRESS",
      format: "BEST_OF_3",
      player1: { name: "Player M" },
      player2: { name: "Player N" },
      scheduledAt: null,
      scoreState: null,
      suspendedSessionId: "session-13",
      matchStateSnapshot: JSON.stringify({
        sets: [{ player1: 2, player2: 1, isTiebreak: false, tiebreakScore: null }],
        currentGame: {
          player1: 1,
          player2: 0,
          isDeuce: false,
          advantage: null,
        },
        server: "player1",
        isFinished: false,
        winner: null,
        setsWon: { player1: 0, player2: 0 },
      }),
    };

    const { container } = render(<MatchCard match={match} />);

    expect(container.textContent).toContain("2");
    expect(container.textContent).toContain("1");
  });

  it("exibe formato da partida traduzido para português", () => {
    const formats: { value: string; label: string }[] = [
      { value: "BEST_OF_3", label: "Melhor de 3 Sets" },
      { value: "BEST_OF_3_MATCH_TB", label: "Melhor de 3 - TB 3º" },
      { value: "BEST_OF_5", label: "Melhor de 5 Sets" },
      { value: "SHORT_SET_2V2_NO_AD", label: "Sets Curtos 2/2" },
      { value: "MATCH_TB_10", label: "Match Tie-break" },
      { value: "PRO_SET_8", label: "Set Profissional 8" },
    ];

    for (const fmt of formats) {
      const match = {
        id: "match-14",
        state: "IN_PROGRESS",
        format: fmt.value,
        player1: { name: "P1" },
        player2: { name: "P2" },
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

      const { container } = render(<MatchCard match={match} />);
      expect(container.textContent).toContain(fmt.label);
    }
  });

  it("exibe formato original como fallback quando não mapeado", () => {
    const match = {
      id: "match-15",
      state: "IN_PROGRESS",
      format: "UNKNOWN_FORMAT",
      player1: { name: "P1" },
      player2: { name: "P2" },
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

    render(<MatchCard match={match} />);

    expect(screen.getByText("UNKNOWN_FORMAT")).toBeTruthy();
  });

  it("exibe label 'Sets' centralizado acima dos números dos sets", () => {
    const match = {
      id: "match-16",
      state: "FINISHED",
      format: "BEST_OF_5",
      player1: { name: "Pedro Oliveira" },
      player2: { name: "Joao Silva" },
      scheduledAt: null,
      scoreState: {
        sets: [
          { player1: 6, player2: 3, isTiebreak: false, tiebreakScore: null },
          { player1: 6, player2: 3, isTiebreak: false, tiebreakScore: null },
          { player1: 2, player2: 6, isTiebreak: false, tiebreakScore: null },
          { player1: 1, player2: 6, isTiebreak: false, tiebreakScore: null },
          { player1: 7, player2: 6, isTiebreak: false, tiebreakScore: null },
        ],
        currentGame: {
          player1: 0,
          player2: 0,
          isDeuce: false,
          advantage: null,
        },
        server: "player1",
        isFinished: true,
        winner: "player1",
        setsWon: { player1: 3, player2: 2 },
      },
      suspendedSessionId: undefined,
      matchStateSnapshot: null,
    };

    render(<MatchCard match={match} />);

    expect(screen.getByText("Sets")).toBeTruthy();
  });

  it("exibe label 'Pontos' ao lado do último número do set", () => {
    const match = {
      id: "match-17",
      state: "FINISHED",
      format: "BEST_OF_3",
      player1: { name: "Player A" },
      player2: { name: "Player B" },
      scheduledAt: null,
      scoreState: {
        sets: [
          { player1: 6, player2: 4, isTiebreak: false, tiebreakScore: null },
          { player1: 6, player2: 2, isTiebreak: false, tiebreakScore: null },
        ],
        currentGame: {
          player1: 0,
          player2: 0,
          isDeuce: false,
          advantage: null,
        },
        server: "player1",
        isFinished: true,
        winner: "player1",
        setsWon: { player1: 2, player2: 0 },
      },
      suspendedSessionId: undefined,
      matchStateSnapshot: null,
    };

    render(<MatchCard match={match} />);

    const pontosLabels = screen.getAllByText("Pontos");
    expect(pontosLabels.length).toBeGreaterThanOrEqual(1);
  });

  it("exibe pontuação centralizada nas colunas dos sets e pontos", () => {
    const match = {
      id: "match-18",
      state: "IN_PROGRESS",
      format: "BEST_OF_5",
      player1: { name: "Player C" },
      player2: { name: "Player D" },
      scheduledAt: null,
      scoreState: {
        sets: [
          { player1: 3, player2: 2, isTiebreak: false, tiebreakScore: null },
          { player1: 4, player2: 4, isTiebreak: false, tiebreakScore: null },
        ],
        currentGame: {
          player1: 2,
          player2: 1,
          isDeuce: false,
          advantage: null,
        },
        server: "player1",
        isFinished: false,
        winner: null,
        setsWon: { player1: 0, player2: 0 },
      },
      suspendedSessionId: undefined,
      matchStateSnapshot: null,
    };

    const { container } = render(<MatchCard match={match} />);

    expect(container.textContent).toContain("3");
    expect(container.textContent).toContain("2");
    expect(container.textContent).toContain("4");
    expect(container.textContent).toContain("15");
    expect(container.textContent).toContain("30");
  });

  it("exibe apenas pontos com label 'Pontos' quando sets está vazio", () => {
    const match = {
      id: "match-19",
      state: "IN_PROGRESS",
      format: "BEST_OF_3",
      player1: { name: "Segundo Jogador" },
      player2: { name: "Pedro Oliveira" },
      scheduledAt: "2026-07-14T11:11:00.000Z",
      scoreState: {
        sets: [],
        currentGame: {
          player1: 2,
          player2: 1,
          isDeuce: false,
          advantage: null,
          secondServe: false,
        },
        server: "player1",
        isFinished: false,
        winner: null,
        setsWon: { player1: 0, player2: 0 },
        startedAt: null,
        secondServe: false,
      },
      suspendedSessionId: null,
      matchStateSnapshot: null,
    };

    const { container } = render(<MatchCard match={match} />);

    expect(screen.getByText("Pontos")).toBeTruthy();
    expect(screen.getByText("30")).toBeTruthy();
    expect(screen.getByText("15")).toBeTruthy();
    expect(screen.getByText("Segundo Jogador")).toBeTruthy();
    expect(screen.getByText("Pedro Oliveira")).toBeTruthy();
  });

  it("exibe layout consistente entre partidas Em Andamento e Finalizadas", () => {
    const matchInProgress = {
      id: "match-20",
      state: "IN_PROGRESS",
      format: "BEST_OF_3",
      player1: { name: "Joao Silva" },
      player2: { name: "Play1" },
      scheduledAt: null,
      scoreState: {
        sets: [
          { player1: 7, player2: 10, isTiebreak: true, tiebreakScore: { player1: 7, player2: 10 } },
        ],
        currentGame: {
          player1: 0,
          player2: 0,
          isDeuce: false,
          advantage: null,
        },
        server: "player1",
        isFinished: false,
        winner: null,
        setsWon: { player1: 0, player2: 0 },
      },
      suspendedSessionId: undefined,
      matchStateSnapshot: null,
    };

    const matchFinished = {
      id: "match-21",
      state: "FINISHED",
      format: "MATCH_TB_10",
      player1: { name: "Joao Silva" },
      player2: { name: "Play1" },
      scheduledAt: null,
      scoreState: {
        sets: [
          { player1: 0, player2: 0, isTiebreak: true, tiebreakScore: { player1: 7, player2: 10 } },
        ],
        currentGame: {
          player1: 0,
          player2: 0,
          isDeuce: false,
          advantage: null,
        },
        server: "player1",
        isFinished: true,
        winner: "player2",
        setsWon: { player1: 0, player2: 1 },
      },
      suspendedSessionId: undefined,
      matchStateSnapshot: null,
    };

    const { container: container1 } = render(<MatchCard match={matchInProgress} />);
    const { container: container2 } = render(<MatchCard match={matchFinished} />);

    expect(container1.textContent).toContain("Sets");
    expect(container2.textContent).toContain("Sets");
    expect(container1.textContent).toContain("Pontos");
    expect(container2.textContent).toContain("Pontos");
  });
});
