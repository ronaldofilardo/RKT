/**
 * @jest-environment jsdom
 */

import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { EditScoreModal } from "../EditScoreModal";

describe("EditScoreModal - Bloqueio de redução abaixo do placar atual (Piso de Games e Tiebreak)", () => {
  const defaultProps = {
    isOpen: true,
    matchFormat: "BEST_OF_3" as const,
    playerNames: { p1: "Ronaldo Filardo", p2: "Jannik Sinner" },
    currentSets: { player1: 6, player2: 6 },
    currentServer: "player1" as const,
    completedSets: [
      { games: { player1: 0, player2: 6 }, winner: "player2" as const },
      { games: { player1: 6, player2: 0 }, winner: "player1" as const },
    ],
    currentGamePoints: { player1: 5, player2: 5 },
    isTiebreak: true,
    floorCurrentSets: { player1: 6, player2: 6 },
    floorTiebreak: { player1: 5, player2: 5 },
    onConfirm: jest.fn(),
    onCancel: jest.fn(),
  };

  it("não permite reduzir games do set abaixo do placar atual (6x6)", () => {
    render(<EditScoreModal {...defaultProps} />);

    const p1GameInput = screen.getByLabelText("Games Ronaldo Filardo") as HTMLInputElement;
    const p2GameInput = screen.getByLabelText("Games Jannik Sinner") as HTMLInputElement;

    expect(p1GameInput).toHaveAttribute("min", "6");
    expect(p2GameInput).toHaveAttribute("min", "6");

    // Tentativa de reduzir para 5
    fireEvent.change(p1GameInput, { target: { value: "5" } });
    expect(p1GameInput.value).toBe("6");

    fireEvent.change(p2GameInput, { target: { value: "4" } });
    expect(p2GameInput.value).toBe("6");
  });

  it("não permite reduzir tiebreak abaixo dos pontos atuais (5x5)", () => {
    render(<EditScoreModal {...defaultProps} />);

    const p1TbInput = screen.getByLabelText("Tiebreak Ronaldo Filardo") as HTMLInputElement;
    const p2TbInput = screen.getByLabelText("Tiebreak Jannik Sinner") as HTMLInputElement;

    expect(p1TbInput).toHaveAttribute("min", "5");
    expect(p2TbInput).toHaveAttribute("min", "5");

    // Tentativa de reduzir tiebreak para 4 ou 0
    fireEvent.change(p1TbInput, { target: { value: "4" } });
    expect(p1TbInput.value).toBe("5");

    fireEvent.change(p2TbInput, { target: { value: "2" } });
    expect(p2TbInput.value).toBe("5");
  });

  it("permite aumentar o placar acima do atual (ex.: 7x5 no tiebreak)", () => {
    render(<EditScoreModal {...defaultProps} />);

    const p1TbInput = screen.getByLabelText("Tiebreak Ronaldo Filardo") as HTMLInputElement;
    fireEvent.change(p1TbInput, { target: { value: "7" } });
    expect(p1TbInput.value).toBe("7");
  });
});
