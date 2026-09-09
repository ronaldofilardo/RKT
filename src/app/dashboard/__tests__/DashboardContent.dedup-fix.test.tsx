/**
 * @jest-environment jsdom
 */
/**
 * Regressão (2026-09-08): uma partida com sessão de anotação abandonada
 * aparecia duas vezes no dashboard — uma em "Anotações Suspensas" e outra
 * na lista normal (badge "Em Andamento"), porque `matches` (de
 * /api/matches) não era filtrado contra `suspendedFromApi`.
 */
import React from "react";
import { render, screen } from "@testing-library/react";
import { DashboardContent } from "@/app/dashboard/DashboardContent";

function makeMatch(overrides: Record<string, any> = {}) {
  return {
    id: "match-1",
    state: "IN_PROGRESS",
    format: "BEST_OF_3",
    player1: { name: "Eduardo" },
    player2: { name: "Mateus" },
    scheduledAt: null,
    scoreState: null,
    ...overrides,
  };
}

const noop = () => {};

describe("DashboardContent — dedup de partidas suspensas", () => {
  it("BUG (2026-09-08): não deve renderizar a mesma partida duas vezes quando ela está em suspendedFromApi", () => {
    const suspendedMatch = makeMatch({
      id: "match-1",
      suspendedSessionId: "session-1",
      matchStateSnapshot: "snapshot",
    });
    // O mesmo id volta em `matches` (resposta plana de /api/matches),
    // sem suspendedSessionId — é exatamente o cenário do bug.
    const plainMatch = makeMatch({ id: "match-1" });

    render(
      <DashboardContent
        loading={false}
        view="dashboard"
        finishedMatches={[]}
        matches={[plainMatch]}
        suspendedFromApi={[suspendedMatch]}
        handleNavigate={noop}
        handleMatchClick={noop}
        handleMatchReport={noop}
        handleMatchFinish={noop}
        handleMatchDelete={noop}
      />
    );

    // "Eduardo" (nome de um dos jogadores) deve aparecer só uma vez —
    // antes do fix, aparecia duas vezes (um card em cada seção).
    const occurrences = screen.getAllByText("Eduardo");
    expect(occurrences).toHaveLength(1);
  });

  it("continua mostrando normalmente uma partida que NÃO está suspensa", () => {
    const plainMatch = makeMatch({ id: "match-2", player1: { name: "Carlos" } });

    render(
      <DashboardContent
        loading={false}
        view="dashboard"
        finishedMatches={[]}
        matches={[plainMatch]}
        suspendedFromApi={[]}
        handleNavigate={noop}
        handleMatchClick={noop}
        handleMatchReport={noop}
        handleMatchFinish={noop}
        handleMatchDelete={noop}
      />
    );

    expect(screen.getAllByText("Carlos")).toHaveLength(1);
  });
});
