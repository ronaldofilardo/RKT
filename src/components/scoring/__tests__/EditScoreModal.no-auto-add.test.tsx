/**
 * @jest-environment jsdom
 * 
 * Test for the "Confirmar Set" button behavior.
 * 
 * Behavior: When user types a complete set score (e.g., 6-2), a "Confirmar Set"
 * button appears. The user clicks it to confirm the set and advance to the next.
 */

import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { EditScoreModal } from "@/components/scoring/EditScoreModal";

describe("EditScoreModal - Confirmar Set Button", () => {
  const defaultProps = {
    isOpen: true,
    matchFormat: "BEST_OF_3" as const,
    playerNames: { p1: "João", p2: "Pedro" },
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

describe("Confirmar Set button on complete score", () => {
    it("should show Confirmar Set button when typing 6-2 (valid completed set)", async () => {
      render(<EditScoreModal {...defaultProps} />);

      const inputs = screen.getAllByPlaceholderText("0");
      
      fireEvent.change(inputs[0], { target: { value: "6" } });
      fireEvent.change(inputs[1], { target: { value: "" } });
      fireEvent.change(inputs[1], { target: { value: "2" } });

      await waitFor(() => {
        expect(screen.getByText(/Confirmar Set 1/i)).toBeInTheDocument();
      });
    });

    it("should add set and clear inputs when clicking Confirmar Set", async () => {
      render(<EditScoreModal {...defaultProps} />);

      const inputs = screen.getAllByPlaceholderText("0");
      
      fireEvent.change(inputs[0], { target: { value: "6" } });
      fireEvent.change(inputs[1], { target: { value: "" } });
      fireEvent.change(inputs[1], { target: { value: "2" } });

      const confirmSetBtn = await screen.findByText(/Confirmar Set 1/i);
      fireEvent.click(confirmSetBtn);

      await waitFor(() => {
        expect(screen.getByText(/Sets Completados/i)).toBeInTheDocument();
      });

      const newInputs = screen.getAllByPlaceholderText("0");
      expect(newInputs[0]).toHaveAttribute('value', '');
      expect(newInputs[1]).toHaveAttribute('value', '');

      await waitFor(() => {
        expect(screen.getByText(/Set 2/i)).toBeInTheDocument();
      });
    });

    it("should show Confirmar Set button when typing 6-0", async () => {
      render(<EditScoreModal {...defaultProps} />);

      const inputs = screen.getAllByPlaceholderText("0");
      
      fireEvent.change(inputs[0], { target: { value: "6" } });
      fireEvent.change(inputs[1], { target: { value: "1" } });
      fireEvent.change(inputs[1], { target: { value: "0" } });

      await waitFor(() => {
        expect(screen.getByText(/Confirmar Set 1/i)).toBeInTheDocument();
      });
    });

    it("should NOT show Confirmar Set when set is incomplete (3-2)", async () => {
      const onConfirmMock = jest.fn();

      render(
        <EditScoreModal
          {...defaultProps}
          onConfirm={onConfirmMock}
        />
      );

      const inputs = screen.getAllByPlaceholderText("0");
      
      fireEvent.change(inputs[0], { target: { value: "3" } });
      fireEvent.change(inputs[1], { target: { value: "2" } });

      await waitFor(() => {
        expect(screen.queryByText(/Confirmar Set/i)).not.toBeInTheDocument();
      });

      const confirmButton = screen.getByText("Confirmar");
      await waitFor(() => {
        expect(confirmButton).not.toBeDisabled();
      });
    });
  });

  describe("Match tiebreak sets (no Confirmar Set after match tiebreak)", () => {
    it("should NOT show Confirmar Set after MATCH_TB_10 complete", async () => {
      render(
        <EditScoreModal
          {...defaultProps}
          matchFormat="MATCH_TB_10"
        />
      );

      const inputs = screen.getAllByPlaceholderText("0");
      
      fireEvent.change(inputs[0], { target: { value: "10" } });
      fireEvent.change(inputs[1], { target: { value: "" } });
      fireEvent.change(inputs[1], { target: { value: "7" } });

      await waitFor(() => {
        expect(screen.queryByText(/Confirmar Set/i)).not.toBeInTheDocument();
      });

      const messages = screen.getAllByText(/venceu o match tiebreak — partida encerrada/i);
      expect(messages.length).toBeGreaterThanOrEqual(1);
    });

    it("should NOT show Confirmar Set after BEST_OF_3_MATCH_TB set 3 complete", async () => {
      const completedSets = [
        { games: { player1: 6, player2: 4 }, winner: "player1" as const },
        { games: { player1: 3, player2: 6 }, winner: "player2" as const },
      ];

      render(
        <EditScoreModal
          {...defaultProps}
          matchFormat="BEST_OF_3_MATCH_TB"
          completedSets={completedSets}
        />
      );

      const inputs = screen.getAllByPlaceholderText("0");
      
      fireEvent.change(inputs[0], { target: { value: "10" } });
      fireEvent.change(inputs[1], { target: { value: "8" } });

      await waitFor(() => {
        expect(screen.queryAllByText(/venceu o match tiebreak — partida encerrada/i).length).toBeGreaterThan(0);
      });
      expect(screen.getByText(/Set 3/i)).toBeInTheDocument();
    });
  });

  describe("Multiple sets flow", () => {
    it("should allow adding multiple sets via Confirmar Set (6-2, then 3-6)", async () => {
      render(<EditScoreModal {...defaultProps} />);

      let inputs = screen.getAllByPlaceholderText("0");
      
      // Set 1: 6-2
      fireEvent.change(inputs[0], { target: { value: "6" } });
      fireEvent.change(inputs[1], { target: { value: "2" } });

      const confirmBtn1 = await screen.findByText(/Confirmar Set 1/i);
      fireEvent.click(confirmBtn1);

      await waitFor(() => {
        expect(screen.getByText(/Sets Completados/i)).toBeInTheDocument();
      });

      await waitFor(() => {
        expect(screen.getByText(/Set 2/i)).toBeInTheDocument();
      });

      // Set 2: 3-6
      inputs = screen.getAllByPlaceholderText("0");
      fireEvent.change(inputs[0], { target: { value: "3" } });
      fireEvent.change(inputs[1], { target: { value: "6" } });

      const confirmBtn2 = await screen.findByText(/Confirmar Set 2/i);
      fireEvent.click(confirmBtn2);

      await waitFor(() => {
        expect(screen.getByText(/Set 3/i)).toBeInTheDocument();
      });
    });
  });

  describe("Partial set (no winner) - confirm without adding", () => {
    it("should allow confirming partial set 3x2 via 'Confirmar Placar'", async () => {
      const onConfirmMock = jest.fn();

      render(
        <EditScoreModal
          {...defaultProps}
          onConfirm={onConfirmMock}
        />
      );

      const inputs = screen.getAllByPlaceholderText("0");
      
      fireEvent.change(inputs[0], { target: { value: "3" } });
      fireEvent.change(inputs[1], { target: { value: "2" } });

      await waitFor(() => {
        expect(screen.queryByText(/Sets Completados/i)).not.toBeInTheDocument();
      });

      const confirmButton = screen.getByText("Confirmar");
      await waitFor(() => {
        expect(confirmButton).not.toBeDisabled();
      });

      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(onConfirmMock).toHaveBeenCalled();
      });

      const callArgs = onConfirmMock.mock.calls[0][0];
      expect(callArgs).toHaveLength(1);
      expect(callArgs[0]).toEqual({
        p1Games: 3,
        p2Games: 2,
        isPartial: true,
        currentGamePoints: { player1: 0, player2: 0 },
      });
    });

    it("should allow confirming without filling scores when there are completed sets", async () => {
      const onConfirmMock = jest.fn();

      render(
        <EditScoreModal
          {...defaultProps}
          completedSets={[
            { games: { player1: 6, player2: 4 }, winner: "player1" },
          ]}
          onConfirm={onConfirmMock}
        />
      );

      const confirmButton = screen.getByText("Confirmar");
      
      await waitFor(() => {
        expect(confirmButton).not.toBeDisabled();
      });

      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(onConfirmMock).toHaveBeenCalled();
      });
    });
  });

  describe("Score like 6x5 (set tiebreak required) should not show Confirmar Set", () => {
    it("should not show Confirmar Set when typing 6-5", async () => {
      render(<EditScoreModal {...defaultProps} />);

      const inputs = screen.getAllByPlaceholderText("0");
      
      fireEvent.change(inputs[0], { target: { value: "6" } });
      fireEvent.change(inputs[1], { target: { value: "5" } });

      await waitFor(() => {
        expect(screen.queryByText(/Confirmar Set/i)).not.toBeInTheDocument();
      });

      await waitFor(() => {
        expect(screen.getByText(/em andamento/i)).toBeInTheDocument();
      });
    });
  });

  describe("BEST_OF_5 format - Confirmar Set", () => {
    it("should show Confirmar Set for 6x0 in BEST_OF_5", async () => {
      render(
        <EditScoreModal
          {...defaultProps}
          matchFormat="BEST_OF_5"
        />
      );

      const inputs = screen.getAllByPlaceholderText("0");
      
      fireEvent.change(inputs[0], { target: { value: "6" } });
      fireEvent.change(inputs[1], { target: { value: "1" } });
      fireEvent.change(inputs[1], { target: { value: "0" } });

      await waitFor(() => {
        expect(screen.getByText(/Confirmar Set 1/i)).toBeInTheDocument();
      });
    });
  });

  describe("Match already finished - no set input shown", () => {
    it("should show message when match already over", () => {
      const completedSets = [
        { games: { player1: 1, player2: 6 }, winner: "player2" as const },
        { games: { player1: 3, player2: 6 }, winner: "player2" as const },
      ];

      render(
        <EditScoreModal
          {...defaultProps}
          matchFormat="BEST_OF_3"
          completedSets={completedSets}
        />
      );

      expect(screen.queryAllByPlaceholderText("0")).toHaveLength(0);
    });
  });
});
