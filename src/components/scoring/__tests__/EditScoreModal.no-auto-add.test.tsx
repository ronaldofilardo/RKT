/**
 * @jest-environment jsdom
 * 
 * Test for the fix: remove auto-add of set when typing score
 * 
 * Bug: When user typed "6" for player1, the system auto-added the set as 6x0
 * before the user could type player2's score.
 * 
 * Fix: Removed the useEffect that auto-called handleAddSet() when canAddNextSet
 * became true. Now the user must explicitly click "Adicionar Set" or "Confirmar Placar".
 */

import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { EditScoreModal } from "@/components/scoring/EditScoreModal";

describe("EditScoreModal - No Auto-Add on Score Entry", () => {
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

  describe("Bug fix: no auto-add when typing score", () => {
    it("should NOT auto-add set when typing 6 for p1 while p2 is 0", async () => {
      const onConfirmMock = jest.fn();

      render(
        <EditScoreModal
          {...defaultProps}
          onConfirm={onConfirmMock}
        />
      );

      const inputs = screen.getAllByRole("spinbutton");
      
      // Type 6 for player1 only (p2 defaults to "0")
      fireEvent.change(inputs[0], { target: { value: "6" } });

      // Wait and verify no auto-add happened
      await waitFor(() => {
        expect(screen.queryByText(/Sets Adicionados/i)).not.toBeInTheDocument();
      });

      // onConfirm should NOT have been called (no auto-confirm)
      expect(onConfirmMock).not.toHaveBeenCalled();
    });

    it("should NOT auto-add set when typing 6-2", async () => {
      const onConfirmMock = jest.fn();

      render(
        <EditScoreModal
          {...defaultProps}
          onConfirm={onConfirmMock}
        />
      );

      const inputs = screen.getAllByRole("spinbutton");
      
      // Type 6-2 (valid completed set)
      fireEvent.change(inputs[0], { target: { value: "6" } });
      fireEvent.change(inputs[1], { target: { value: "2" } });

      // Wait and verify no auto-add happened
      await waitFor(() => {
        expect(screen.queryByText(/Sets Adicionados/i)).not.toBeInTheDocument();
      });

      // onConfirm should NOT have been called
      expect(onConfirmMock).not.toHaveBeenCalled();
    });

    it("should NOT auto-add set when typing 6-0 via confirm button", async () => {
      const onConfirmMock = jest.fn();

      render(
        <EditScoreModal
          {...defaultProps}
          onConfirm={onConfirmMock}
        />
      );

      const inputs = screen.getAllByRole("spinbutton");
      
      // Type 6-0
      fireEvent.change(inputs[0], { target: { value: "6" } });
      fireEvent.change(inputs[1], { target: { value: "0" } });

      // No auto-add
      await waitFor(() => {
        expect(screen.queryByText(/Sets Adicionados/i)).not.toBeInTheDocument();
      });

      // Click Confirmar Placar to save
      const confirmButton = screen.getByText("Confirmar Placar");
      await waitFor(() => {
        expect(confirmButton).not.toBeDisabled();
      });
      fireEvent.click(confirmButton);

      // onConfirm should be called with the set
      await waitFor(() => {
        expect(onConfirmMock).toHaveBeenCalled();
      });
    });
  });

  describe("User explicitly adds set via button", () => {
    it("should add set to list when clicking 'Adicionar Set'", async () => {
      render(
        <EditScoreModal
          {...defaultProps}
        />
      );

      const inputs = screen.getAllByRole("spinbutton");
      
      // Type 6-2
      fireEvent.change(inputs[0], { target: { value: "6" } });
      fireEvent.change(inputs[1], { target: { value: "2" } });

      // Click "Adicionar Set"
      const addButton = screen.getByText(/Adicionar Set/i);
      await waitFor(() => {
        expect(addButton).not.toBeDisabled();
      });
      fireEvent.click(addButton);

      // Set should now appear in the list
      await waitFor(() => {
        expect(screen.getByText(/Sets Adicionados/i)).toBeInTheDocument();
      });

      // Inputs should be cleared for next set
      expect(inputs[0]).toHaveValue(null);
      expect(inputs[1]).toHaveValue(null);
    });

    it("should show next set input after adding a set", async () => {
      render(
        <EditScoreModal
          {...defaultProps}
        />
      );

      const inputs = screen.getAllByRole("spinbutton");
      
      // Type 6-2 and add
      fireEvent.change(inputs[0], { target: { value: "6" } });
      fireEvent.change(inputs[1], { target: { value: "2" } });

      const addButton = screen.getByText(/Adicionar Set/i);
      await waitFor(() => {
        expect(addButton).not.toBeDisabled();
      });
      fireEvent.click(addButton);

      // Should now show "Set 2" for the next set
      await waitFor(() => {
        expect(screen.getByText(/Set 2/i)).toBeInTheDocument();
      });
    });

    it("should add 6-0 only after clicking button", async () => {
      render(
        <EditScoreModal
          {...defaultProps}
        />
      );

      const inputs = screen.getAllByRole("spinbutton");
      
      // Type 6-0
      fireEvent.change(inputs[0], { target: { value: "6" } });
      fireEvent.change(inputs[1], { target: { value: "0" } });

      // No auto-add
      await waitFor(() => {
        expect(screen.queryByText(/Sets Adicionados/i)).not.toBeInTheDocument();
      });

      // Click to add
      const addButton = screen.getByText(/Adicionar Set/i);
      fireEvent.click(addButton);

      // Set should be in the list
      await waitFor(() => {
        expect(screen.getByText(/Sets Adicionados/i)).toBeInTheDocument();
      });
    });
  });

  describe("Partial set (no winner) can be confirmed without adding", () => {
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

      // "Adicionar Set" should be disabled (set not complete)
      const addButton = screen.getByText(/Adicionar Set/i);
      expect(addButton).toBeDisabled();

      // "Confirmar Placar" should be enabled
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

    it("should allow confirming without filling any scores when there are completed sets", async () => {
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
      render(
        <EditScoreModal
          {...defaultProps}
        />
      );

      const inputs = screen.getAllByRole("spinbutton");
      
      // Type 6-5
      fireEvent.change(inputs[0], { target: { value: "6" } });
      fireEvent.change(inputs[1], { target: { value: "5" } });

      // Wait and verify no auto-add
      await waitFor(() => {
        expect(screen.queryByText(/Sets Adicionados/i)).not.toBeInTheDocument();
      });

      // "Adicionar Set" should be disabled (set not complete - needs tiebreak)
      const addButton = screen.getByText(/Adicionar Set/i);
      expect(addButton).toBeDisabled();
    });

    it("should show em andamento for 6-5 (no winner yet)", async () => {
      render(
        <EditScoreModal
          {...defaultProps}
        />
      );

      const inputs = screen.getAllByRole("spinbutton");
      
      // Type 6-5
      fireEvent.change(inputs[0], { target: { value: "6" } });
      fireEvent.change(inputs[1], { target: { value: "5" } });

      await waitFor(() => {
        // 6-5 has no winner (diff < 2), so set is "em andamento"
        expect(screen.getByText(/em andamento/i)).toBeInTheDocument();
      });
    });
  });

  describe("BEST_OF_5 format - no auto-add", () => {
    it("should not auto-add 6x0 in BEST_OF_5", async () => {
      render(
        <EditScoreModal
          {...defaultProps}
          matchFormat="BEST_OF_5"
        />
      );

      const inputs = screen.getAllByRole("spinbutton");
      
      // Type 6 for p1 only
      fireEvent.change(inputs[0], { target: { value: "6" } });

      // No auto-add
      await waitFor(() => {
        expect(screen.queryByText(/Sets Adicionados/i)).not.toBeInTheDocument();
      });
    });
  });

  describe("MATCH_TB_10 format - no auto-add", () => {
    it("should not auto-add MT score before both values entered", async () => {
      render(
        <EditScoreModal
          {...defaultProps}
          matchFormat="MATCH_TB_10"
        />
      );

      const inputs = screen.getAllByRole("spinbutton");
      
      // Type 10 for p1 only
      fireEvent.change(inputs[0], { target: { value: "10" } });

      // No auto-add
      await waitFor(() => {
        expect(screen.queryByText(/Sets Adicionados/i)).not.toBeInTheDocument();
      });
    });
  });

  describe("Multiple sets flow", () => {
    it("should allow adding multiple sets manually (1-1 then add set 3)", async () => {
      render(
        <EditScoreModal
          {...defaultProps}
        />
      );

      const inputs = screen.getAllByRole("spinbutton");
      
      // Set 1: 6-2 (João wins)
      fireEvent.change(inputs[0], { target: { value: "6" } });
      fireEvent.change(inputs[1], { target: { value: "2" } });

      const addButton = screen.getByText(/Adicionar Set/i);
      await waitFor(() => {
        expect(addButton).not.toBeDisabled();
      });
      fireEvent.click(addButton);

      // Set 2: 3-6 (Pedro wins) → 1-1
      await waitFor(() => {
        expect(screen.getByText(/Set 2/i)).toBeInTheDocument();
      });

      const inputs2 = screen.getAllByRole("spinbutton");
      fireEvent.change(inputs2[0], { target: { value: "3" } });
      fireEvent.change(inputs2[1], { target: { value: "6" } });

      await waitFor(() => {
        expect(addButton).not.toBeDisabled();
      });
      fireEvent.click(addButton);

      // Both sets should be in the list
      await waitFor(() => {
        expect(screen.getByText(/Sets Adicionados/i)).toBeInTheDocument();
      });

      // Match not over yet (1-1), set 3 should be available
      await waitFor(() => {
        expect(screen.getByText(/Set 3/i)).toBeInTheDocument();
      });
    });
  });
});
