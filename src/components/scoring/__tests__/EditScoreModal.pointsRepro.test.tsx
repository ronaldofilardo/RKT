/**
 * @jest-environment jsdom
 *
 * Bug repro: Selecting ANY value from the "Pontos no Game Atual" droplist
 * reverts the UI back to "0".
 *
 * Special setup: Simulate production where parent passes a NEW
 * `completedSets` array on every render (inline array creation).
 */

import React, { useState } from "react";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { EditScoreModal } from "@/components/scoring/EditScoreModal";

// Parent that simulates production: re-renders EditScoreModal with NEW inline
// completedSets array on every tick (triggering useEffect with completedSets dep).
function ProductionLikeParent({
  currentGamePointsP1,
  currentGamePointsP2,
  currentSetsP1,
  currentSetsP2,
}: {
  currentGamePointsP1: string;
  currentGamePointsP2: string;
  currentSetsP1: number;
  currentSetsP2: number;
}) {
  const [tick, setTick] = useState(0);

  return (
    <div>
      <button data-testid="force-rerender" onClick={() => setTick((t) => t + 1)}>
        rerender
      </button>
      <EditScoreModal
        isOpen={true}
        matchFormat="BEST_OF_3"
        playerNames={{ p1: "Joao", p2: "Pedro" }}
        currentSets={{ player1: currentSetsP1, player2: currentSetsP2 }}
        currentServer="player1"
        completedSets={[
          // INLINE = NEW ARRAY ON EACH RENDER
        ]}
        currentGamePoints={{
          player1: currentGamePointsP1,
          player2: currentGamePointsP2,
        }}
        floorCurrentSets={null}
        onConfirm={jest.fn()}
        onCancel={jest.fn()}
      />
      <span data-testid="tick">{tick}</span>
    </div>
  );
}

describe("EditScoreModal - BUG: Pontos do Game Atual revertem para 0", () => {
  const baseProps = {
    isOpen: true,
    matchFormat: "BEST_OF_3" as const,
    playerNames: { p1: "Joao Silva", p2: "Pedro Oliveira" },
    currentSets: { player1: 4, player2: 3 },
    currentServer: "player1" as const,
    completedSets: [] as Array<{
      games: Record<"player1" | "player2", number>;
      winner: "player1" | "player2";
    }>,
    floorCurrentSets: null,
    onConfirm: jest.fn(),
    onCancel: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("deve manter o valor selecionado pelo usuário no droplist P1 (currentGamePoints=30x15)", () => {
    render(
      <EditScoreModal
        {...baseProps}
        currentGamePoints={{ player1: "30", player2: "15" }}
      />
    );

    const selects = screen.getAllByRole("combobox") as HTMLSelectElement[];
    expect(selects.length).toBeGreaterThanOrEqual(2);

    const p1Select = selects[0];
    const p2Select = selects[1];

    // Initial values from currentGamePoints
    expect(p1Select.value).toBe("30");
    expect(p2Select.value).toBe("15");

    // User selects "40" from droplist
    fireEvent.change(p1Select, { target: { value: "40" } });
    expect(p1Select.value).toBe("40");

    // User selects "30" from droplist
    fireEvent.change(p1Select, { target: { value: "30" } });
    expect(p1Select.value).toBe("30");
  });

  it("deve manter o valor selecionado pelo usuário no droplist P2 (currentGamePoints=0x0)", () => {
    render(
      <EditScoreModal
        {...baseProps}
        currentGamePoints={{ player1: "0", player2: "0" }}
      />
    );

    const selects = screen.getAllByRole("combobox") as HTMLSelectElement[];
    const p2Select = selects[1];

    expect(p2Select.value).toBe("0");

    fireEvent.change(p2Select, { target: { value: "15" } });
    expect(p2Select.value).toBe("15");

    fireEvent.change(p2Select, { target: { value: "40" } });
    expect(p2Select.value).toBe("40");
  });

  it("deve permitir selecionar 'AD' e manter o valor", () => {
    render(
      <EditScoreModal
        {...baseProps}
        currentGamePoints={{ player1: "40", player2: "40" }}
      />
    );

    const selects = screen.getAllByRole("combobox") as HTMLSelectElement[];
    const p1Select = selects[0];
    const p2Select = selects[1];

    // Both at deuce/40
    expect(p1Select.value).toBe("40");

    // AD should be available when opponent is at 40
    const p1Options = Array.from(p1Select.options).map((o) => o.value);
    expect(p1Options).toContain("AD");

    // Select AD from droplist
    fireEvent.change(p1Select, { target: { value: "AD" } });
    expect(p1Select.value).toBe("AD");
  });

  it("deve manter os pontos selecionados quando o usuário edita os games (cenario real reportado)", async () => {
    // Cenario reportado:
    // - ultimo placar no set 2 = 1x1 e 15-0
    // - usuario MANTENDO o placar (1x1) pode alterar de 15-15 em diante OK
    // - usuario ALTERANDO para 2x1 -> sistema zera os pontos e permite qqer valor BUG
    render(
      <EditScoreModal
        {...baseProps}
        currentSets={{ player1: 1, player2: 1 }}
        currentGamePoints={{ player1: "15", player2: "0" }}
      />
    );

    const selects = screen.getAllByRole("combobox") as HTMLSelectElement[];
    const inputs = screen.getAllByRole("spinbutton") as HTMLInputElement[];

    const p1Select = selects[0];
    const p2Select = selects[1];
    const p1Input = inputs[0];
    const p2Input = inputs[1];

    // Estado inicial reflete o que esta em jogo (1x1 e 15-0)
    expect(p1Input.value).toBe("1");
    expect(p2Input.value).toBe("1");
    expect(p1Select.value).toBe("15");
    expect(p2Select.value).toBe("0");

    // Usuario altera placar para 2x1 (mantem input do set, so troca games)
    fireEvent.change(p1Input, { target: { value: "2" } });

    // Pontos devem ser preservados (15-0) e NAO zerados
    // BUG: no comportamento atual, zeros voltam para "0"
    // Mas com esta correcao, devem continuar "15" e "0"
    expect(p1Select.value).not.toBe("0");

    // Selecionar 30 no droplist apos editar o game deve manter
    fireEvent.change(p1Select, { target: { value: "30" } });
    expect(p1Select.value).toBe("30");
  });

  it("deve manter os pontos selecionados apos o pai re-renderizar (cenario de producao)", () => {
    render(
      <ProductionLikeParent
        currentGamePointsP1="15"
        currentGamePointsP2="0"
        currentSetsP1={1}
        currentSetsP2={1}
      />
    );

    const selects = screen.getAllByRole("combobox") as HTMLSelectElement[];
    const p1Select = selects[0];

    // Initial: 15-0
    expect(p1Select.value).toBe("15");

    // User selects 30 via droplist
    fireEvent.change(p1Select, { target: { value: "30" } });
    expect(p1Select.value).toBe("30");

    // Simulate production: parent re-renders (props have new identity but same content)
    act(() => {
      fireEvent.click(screen.getByTestId("force-rerender"));
    });

    // After parent re-render, points should be preserved, NOT reset to "15" (initial)
    const selectsAfter = screen.getAllByRole("combobox") as HTMLSelectElement[];
    expect(selectsAfter[0].value).toBe("30");
  });
});
