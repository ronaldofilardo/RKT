/**
 * @jest-environment jsdom
 * 
 * Test for the fix: auto-add set when score is complete
 * 
 * Behavior: When user types a complete set score (e.g., 6-2), the system
 * automatically adds the set and opens the next set input.
 * No manual "Adicionar Set" button needed.
 */

import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { EditScoreModal } from "@/components/scoring/EditScoreModal";

describe("EditScoreModal - Auto-Add Set on Complete Score", () => {
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

describe("Auto-add set when score is complete", () => {
    it("should auto-add set when typing 6-2 (valid completed set)", async () => {
      const onConfirmMock = jest.fn();

      render(
        <EditScoreModal
          {...defaultProps}
          onConfirm={onConfirmMock}
        />
      );

      let inputs = screen.getAllByRole("spinbutton");
      
      // Type 6 for player1
      fireEvent.change(inputs[0], { target: { value: "6" } });
      // Clear player2 first (it starts at "0"), then type "2"
      fireEvent.change(inputs[1], { target: { value: "" } });
      fireEvent.change(inputs[1], { target: { value: "2" } });

      // Wait for auto-add to happen
      await waitFor(() => {
        expect(screen.getByText(/Sets Adicionados/i)).toBeInTheDocument();
      });

      // Re-query inputs (they're new after auto-add)
      inputs = screen.getAllByRole("spinbutton");
      // Inputs should be cleared for next set
      expect(inputs[0]).toHaveAttribute('value', '');
      expect(inputs[1]).toHaveAttribute('value', '');

      // Should show "Set 2" for next set
      await waitFor(() => {
        expect(screen.getByText(/Set 2/i)).toBeInTheDocument();
      });
    });

    it("should auto-add set when typing 6-0", async () => {
      render(<EditScoreModal {...defaultProps} />);

      let inputs = screen.getAllByRole("spinbutton");
      
      // Type 6 for player1
      fireEvent.change(inputs[0], { target: { value: "6" } });
      // Player2 starts at "0", change to "1" then back to "0" to trigger touch
      fireEvent.change(inputs[1], { target: { value: "1" } });
      fireEvent.change(inputs[1], { target: { value: "0" } });

      // Wait for auto-add
      await waitFor(() => {
        expect(screen.getByText(/Sets Adicionados/i)).toBeInTheDocument();
      });

      // Inputs cleared (re-query)
      inputs = screen.getAllByRole("spinbutton");
      expect(inputs[0]).toHaveAttribute('value', '');
      expect(inputs[1]).toHaveAttribute('value', '');
    });

    it("should NOT auto-add when set is incomplete (3-2)", async () => {
      const onConfirmMock = jest.fn();

      render(
        <EditScoreModal
          {...defaultProps}
          onConfirm={onConfirmMock}
        />
      );

      const inputs = screen.getAllByRole("spinbutton");
      
      // Type 3-2 (incomplete set)
      fireEvent.change(inputs[0], { target: { value: "3" } });
      fireEvent.change(inputs[1], { target: { value: "2" } });

      // Should NOT auto-add
      await waitFor(() => {
        expect(screen.queryByText(/Sets Adicionados/i)).not.toBeInTheDocument();
      });

      // But Confirmar Placar should be enabled
      const confirmButton = screen.getByText("Confirmar Placar");
      await waitFor(() => {
        expect(confirmButton).not.toBeDisabled();
      });
    });
  });

  describe("Match tiebreak sets (no auto-add after match tiebreak)", () => {
    it("should NOT auto-add after MATCH_TB_10 complete", async () => {
      render(
        <EditScoreModal
          {...defaultProps}
          matchFormat="MATCH_TB_10"
        />
      );

      const inputs = screen.getAllByRole("spinbutton");
      
      // Type 10-7 (complete match tiebreak)
      fireEvent.change(inputs[0], { target: { value: "10" } });
      fireEvent.change(inputs[1], { target: { value: "" } });
      fireEvent.change(inputs[1], { target: { value: "7" } });

      // Should NOT show "Sets Adicionados" (match ends)
      await waitFor(() => {
        expect(screen.queryByText(/Sets Adicionados/i)).not.toBeInTheDocument();
      });

      // Should show match ended message
      const messages = screen.getAllByText(/venceu o match tiebreak — partida encerrada/i);
      expect(messages.length).toBeGreaterThanOrEqual(1);
    });

    it("should NOT auto-add after BEST_OF_3_MATCH_TB set 3 complete", async () => {
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

      const inputs = screen.getAllByRole("spinbutton");
      
      // Type 10-8 (complete match tiebreak)
      fireEvent.change(inputs[0], { target: { value: "10" } });
      fireEvent.change(inputs[1], { target: { value: "8" } });

      // Should NOT auto-add (match ends)
      await waitFor(() => {
        expect(screen.queryByText(/Sets Adicionados/i)).not.toBeInTheDocument();
      });
    });
  });

  describe("Multiple sets flow", () => {
    it("should allow adding multiple sets automatically (6-2, then 3-6)", async () => {
      render(<EditScoreModal {...defaultProps} />);

      const inputs = screen.getAllByRole("spinbutton");
      
      // Set 1: 6-2 (João wins)
      fireEvent.change(inputs[0], { target: { value: "6" } });
      fireEvent.change(inputs[1], { target: { value: "2" } });

      // Auto-add happens
      await waitFor(() => {
        expect(screen.getByText(/Sets Adicionados/i)).toBeInTheDocument();
      });

      // Should now show Set 2
      await waitFor(() => {
        expect(screen.getByText(/Set 2/i)).toBeInTheDocument();
      });

      // Set 2: 3-6 (Pedro wins)
      const inputs2 = screen.getAllByRole("spinbutton");
      fireEvent.change(inputs2[0], { target: { value: "3" } });
      fireEvent.change(inputs2[1], { target: { value: "6" } });

      // Auto-add second set
      await waitFor(() => {
        expect(screen.getByText(/Sets Adicionados/i)).toBeInTheDocument();
      });

      // Should show Set 3 (match not over at 1-1)
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

      const inputs = screen.getAllByRole("spinbutton");
      
      // Type 3-2 (no winner, set not complete)
      fireEvent.change(inputs[0], { target: { value: "3" } });
      fireEvent.change(inputs[1], { target: { value: "2" } });

      // No auto-add (set not complete)
      await waitFor(() => {
        expect(screen.queryByText(/Sets Adicionados/i)).not.toBeInTheDocument();
      });

      // Confirmar Placar should be enabled
      const confirmButton = screen.getByText("Confirmar Placar");
      await waitFor(() => {
        expect(confirmButton).not.toBeDisabled();
      });

      // Click confirm
      fireEvent.click(confirmButton);

      // onConfirm should be called with the partial set
      await waitFor(() => {
        expect(onConfirmMock).toHaveBeenCalled();
      });

      // Verify the set data passed to onConfirm
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

      // Don't type anything, just confirm
      const confirmButton = screen.getByText("Confirmar Placar");
      
      await waitFor(() => {
        expect(confirmButton).not.toBeDisabled();
      });

      fireEvent.click(confirmButton);

      // Should confirm with just the completed set
      await waitFor(() => {
        expect(onConfirmMock).toHaveBeenCalled();
      });
    });
  });

  describe("Score like 6x5 (set tiebreak required) should not auto-add", () => {
    it("should not auto-add when typing 6-5", async () => {
      render(<EditScoreModal {...defaultProps} />);

      const inputs = screen.getAllByRole("spinbutton");
      
      // Type 6-5
      fireEvent.change(inputs[0], { target: { value: "6" } });
      fireEvent.change(inputs[1], { target: { value: "5" } });

      // Wait and verify no auto-add
      await waitFor(() => {
        expect(screen.queryByText(/Sets Adicionados/i)).not.toBeInTheDocument();
      });

      // Should show "em andamento" message
      await waitFor(() => {
        expect(screen.getByText(/em andamento/i)).toBeInTheDocument();
      });
    });
  });

  describe("BEST_OF_5 format - auto-add", () => {
    it("should auto-add 6x0 in BEST_OF_5", async () => {
      render(
        <EditScoreModal
          {...defaultProps}
          matchFormat="BEST_OF_5"
        />
      );

      let inputs = screen.getAllByRole("spinbutton");
      
      // Type 6-0 (player2 starts at "0", change to "1" then back to "0" to trigger touch)
      fireEvent.change(inputs[0], { target: { value: "6" } });
      fireEvent.change(inputs[1], { target: { value: "1" } });
      fireEvent.change(inputs[1], { target: { value: "0" } });

      // Auto-add should happen
      await waitFor(() => {
        expect(screen.getByText(/Sets Adicionados/i)).toBeInTheDocument();
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

      // Should show message that match is over
      expect(screen.getByText(/não é possível adicionar mais sets/i)).toBeInTheDocument();
    });
  });
});
