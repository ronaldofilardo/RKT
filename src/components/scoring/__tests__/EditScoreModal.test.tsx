/**
 * @jest-environment jsdom
 */

import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { EditScoreModal } from "@/components/scoring/EditScoreModal";

describe("EditScoreModal - Pontos do Game Atual", () => {
  const defaultProps = {
    isOpen: true,
    matchFormat: "BEST_OF_3" as const,
    playerNames: { p1: "Joao Silva", p2: "Pedro Oliveira" },
    currentSets: { player1: 0, player2: 0 },
    currentServer: "player1" as const,
    completedSets: [] as Array<{
      games: Record<"player1" | "player2", number>;
      winner: "player1" | "player2";
    }>,
    currentGamePoints: { player1: 0, player2: 0 },
    floorCurrentSets: null,
    onConfirm: jest.fn(),
    onCancel: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("deve aceitar alteração nos pontos do game atual", () => {
    render(<EditScoreModal {...defaultProps} />);

    const selects = screen.getAllByRole("combobox");
    expect(selects.length).toBeGreaterThanOrEqual(2);

    const p1Select = selects[0] as HTMLSelectElement;
    const p2Select = selects[1] as HTMLSelectElement;

    fireEvent.change(p1Select, { target: { value: "15" } });
    fireEvent.change(p2Select, { target: { value: "30" } });

    expect(p1Select.value).toBe("15");
    expect(p2Select.value).toBe("30");
  });

  it("deve mostrar o título 'Pontos no Game Atual'", () => {
    render(<EditScoreModal {...defaultProps} />);

    expect(screen.getByText("Pontos no Game Atual")).toBeTruthy();
  });

  it("deve permitir selecionar 0, 15, 30, 40 como opções", () => {
    render(<EditScoreModal {...defaultProps} />);

    const selects = screen.getAllByRole("combobox");
    const p1Select = selects[0] as HTMLSelectElement;

    const options = Array.from(p1Select.options).map((opt) => opt.value);
    expect(options).toContain("0");
    expect(options).toContain("15");
    expect(options).toContain("30");
    expect(options).toContain("40");
  });

  it("deve mostrar opção AD quando o oponente tem 40", () => {
    render(<EditScoreModal {...defaultProps} />);

    const selects = screen.getAllByRole("combobox");
    const p2Select = selects[1] as HTMLSelectElement;

    fireEvent.change(p2Select, { target: { value: "40" } });

    const options = Array.from(p2Select.options).map((opt) => opt.value);
    expect(options).toContain("AD");
  });

  it("deve manter os pontos selecionados após mudança", () => {
    render(<EditScoreModal {...defaultProps} />);

    const selects = screen.getAllByRole("combobox");
    const p1Select = selects[0] as HTMLSelectElement;

    fireEvent.change(p1Select, { target: { value: "30" } });
    expect(p1Select.value).toBe("30");

    fireEvent.change(p1Select, { target: { value: "40" } });
    expect(p1Select.value).toBe("40");
  });

  it("deve desabilitar pontos no game atual em formato MATCH_TB_10", () => {
    render(
      <EditScoreModal
        {...defaultProps}
        matchFormat="MATCH_TB_10"
        currentSets={{ player1: 5, player2: 3 }}
      />
    );

    const selects = screen.getAllByRole("combobox");
    const p1Select = selects[0] as HTMLSelectElement;
    const p2Select = selects[1] as HTMLSelectElement;

    expect(p1Select).toBeDisabled();
    expect(p2Select).toBeDisabled();
  });

  it("deve desabilitar pontos no game atual em BEST_OF_3_MATCH_TB no set 3", () => {
    render(
      <EditScoreModal
        {...defaultProps}
        matchFormat="BEST_OF_3_MATCH_TB"
        completedSets={[
          { games: { player1: 6, player2: 4 }, winner: "player1" },
          { games: { player1: 3, player2: 6 }, winner: "player2" },
        ]}
        currentSets={{ player1: 5, player2: 3 }}
      />
    );

    const selects = screen.getAllByRole("combobox");
    const p1Select = selects[0] as HTMLSelectElement;
    const p2Select = selects[1] as HTMLSelectElement;

    expect(p1Select).toBeDisabled();
    expect(p2Select).toBeDisabled();
  });

  it("deve habilitar pontos no game atual em BEST_OF_3_MATCH_TB no set 1", () => {
    render(
      <EditScoreModal
        {...defaultProps}
        matchFormat="BEST_OF_3_MATCH_TB"
        currentSets={{ player1: 3, player2: 2 }}
      />
    );

    const selects = screen.getAllByRole("combobox");
    const p1Select = selects[0] as HTMLSelectElement;
    const p2Select = selects[1] as HTMLSelectElement;

    expect(p1Select).not.toBeDisabled();
    expect(p2Select).not.toBeDisabled();
  });

  it("deve mostrar mensagem de match tiebreak desativado", () => {
    render(
      <EditScoreModal
        {...defaultProps}
        matchFormat="MATCH_TB_10"
        currentSets={{ player1: 5, player2: 3 }}
      />
    );

    const mensagens = screen.getAllByText(/Match Tie-Break usa pontos corridos/i);
    expect(mensagens.length).toBeGreaterThanOrEqual(1);
  });
});
