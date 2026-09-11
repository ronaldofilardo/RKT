/**
 * @jest-environment jsdom
 */
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { EditScoreModal } from "@/components/scoring/EditScoreModal";

jest.mock("next/navigation", () => ({ useRouter: () => ({ push: jest.fn(), replace: jest.fn() }) }));

describe("Bug (2026-09-07) — 6-6 + tiebreak vencido pelo player1 no set decisivo", () => {
  it("deve encerrar a partida corretamente quando player1 vence o tiebreak 7-5 no set decisivo", async () => {
    const onMatchFinishedMock = jest.fn();
    const onConfirmMock = jest.fn();
    const completedSets = [
      { games: { player1: 6, player2: 3 }, winner: "player1" as const },
      { games: { player1: 3, player2: 6 }, winner: "player2" as const },
    ];
    render(
      <EditScoreModal
        isOpen
        matchFormat="BEST_OF_3"
        playerNames={{ p1: "Play1", p2: "Play2" }}
        currentSets={{ player1: 0, player2: 0 }}
        currentServer="player1"
        completedSets={completedSets}
        currentGamePoints={{ player1: 0, player2: 0 }}
        floorCurrentSets={null}
        onConfirm={onConfirmMock}
        onCancel={jest.fn()}
        onMatchFinished={onMatchFinishedMock}
      />
    );
    const inputs = screen.getAllByPlaceholderText("0");
    fireEvent.change(inputs[0], { target: { value: "6" } });
    fireEvent.change(inputs[1], { target: { value: "6" } });
    await waitFor(() => expect(screen.getByText(/Tie-Break/i)).toBeInTheDocument());
    const tbInputs = screen.getAllByPlaceholderText("0").slice(2);
    fireEvent.change(tbInputs[0], { target: { value: "7" } });
    fireEvent.change(tbInputs[1], { target: { value: "5" } });

    const confirmButton = screen.getByText("Confirmar");
    fireEvent.click(confirmButton);

    expect(screen.queryByText(/Vencedor do tiebreak não corresponde/i)).not.toBeInTheDocument();
    expect(onConfirmMock).toHaveBeenCalled();
    await waitFor(() => {
      expect(onMatchFinishedMock).toHaveBeenCalledWith("player1");
    });
  });
});
