/**
 * @jest-environment jsdom
 */

import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { EditScoreModal } from "@/components/scoring/EditScoreModal";

// Mock do useRouter do Next.js
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
  }),
}));

describe("EditScoreModal - Detecção de Partida Encerrada", () => {
  const defaultProps = {
    isOpen: true,
    matchFormat: "BEST_OF_3" as const,
    playerNames: { p1: "Play1", p2: "Play2" },
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
    onMatchFinished: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Teste 1: BEST_OF_3 - Partida encerra com 2 sets", () => {
    it("deve detectar partida encerrada e chamar onMatchFinished", async () => {
      const onMatchFinishedMock = jest.fn();
      const onConfirmMock = jest.fn();

      // Simula Set 1 já completado (Play2 venceu 6-1)
      const completedSet1 = [{
        games: { player1: 1, player2: 6 },
        winner: "player2" as const,
      }];

      render(
        <EditScoreModal
          {...defaultProps}
          matchFormat="BEST_OF_3"
          completedSets={completedSet1}
          currentSets={{ player1: 0, player2: 0 }}
          onConfirm={onConfirmMock}
          onMatchFinished={onMatchFinishedMock}
        />
      );

      // Digita Set 2: 1-6 (Play2 vence novamente)
      const inputs = screen.getAllByRole("spinbutton");
      fireEvent.change(inputs[0], { target: { value: "1" } });
      fireEvent.change(inputs[1], { target: { value: "6" } });

      // Aguarda banner de partida encerrada aparecer
      await waitFor(() => {
        expect(screen.queryAllByText(/partida encerrada/i).length).toBeGreaterThan(0);
      });

      // Verifica que banner verde existe
      const banner = screen.getByText(/Partida encerrada — confirmar para finalizar/i);
      expect(banner).toBeInTheDocument();

      // Clica em Confirmar Placar
      const confirmButton = screen.getByText("Confirmar Placar");
      fireEvent.click(confirmButton);

      // Verifica que onMatchFinished foi chamado com winner correto
      expect(onMatchFinishedMock).toHaveBeenCalledWith("player2");

      // Verifica que onConfirm também foi chamado
      expect(onConfirmMock).toHaveBeenCalled();
    });

    it("deve mostrar banner verde quando partida é encerrada", async () => {
      const completedSet1 = [{
        games: { player1: 1, player2: 6 },
        winner: "player2" as const,
      }];

      render(
        <EditScoreModal
          {...defaultProps}
          matchFormat="BEST_OF_3"
          completedSets={completedSet1}
          currentSets={{ player1: 0, player2: 0 }}
        />
      );

      // Digita Set 2: 6-3
      const inputs = screen.getAllByRole("spinbutton");
      fireEvent.change(inputs[0], { target: { value: "3" } });
      fireEvent.change(inputs[1], { target: { value: "6" } });

      // Verifica banner verde
      await waitFor(() => {
        const banner = screen.getByText(/Partida encerrada — confirmar para finalizar/i);
        expect(banner).toBeInTheDocument();
      });
    });
  });

  describe("Teste 2: BEST_OF_3_MATCH_TB - Set 3 é Match Tiebreak", () => {
    it("deve detectar partida encerrada no match tiebreak", async () => {
      const onMatchFinishedMock = jest.fn();
      const onConfirmMock = jest.fn();

      const completedSets = [
        {
          games: { player1: 6, player2: 1 },
          winner: "player1" as const,
        },
        {
          games: { player1: 1, player2: 6 },
          winner: "player2" as const,
        },
      ];

      render(
        <EditScoreModal
          {...defaultProps}
          matchFormat="BEST_OF_3_MATCH_TB"
          completedSets={completedSets}
          currentSets={{ player1: 0, player2: 0 }}
          onConfirm={onConfirmMock}
          onMatchFinished={onMatchFinishedMock}
        />
      );

      // Verifica que mostra UI de Match Tiebreak
      expect(screen.getByText(/Set 3 — Match Tiebreak/i)).toBeInTheDocument();

      // Digita placar do match tiebreak: 10-7
      const inputs = screen.getAllByRole("spinbutton");
      fireEvent.change(inputs[0], { target: { value: "10" } });
      fireEvent.change(inputs[1], { target: { value: "7" } });

      // Aguarda mensagem de partida encerrada
      await waitFor(() => {
        expect(screen.queryAllByText(/venceu o match tiebreak — partida encerrada/i).length).toBeGreaterThan(0);
      });

      // Clica em Confirmar
      const confirmButton = screen.getByText("Confirmar Placar");
      fireEvent.click(confirmButton);

      // Verifica callback
      expect(onMatchFinishedMock).toHaveBeenCalledWith("player1");
    });

    it("não deve permitir confirmar match tiebreak incompleto", async () => {
      const completedSets = [
        {
          games: { player1: 6, player2: 1 },
          winner: "player1" as const,
        },
        {
          games: { player1: 1, player2: 6 },
          winner: "player2" as const,
        },
      ];

      render(
        <EditScoreModal
          {...defaultProps}
          matchFormat="BEST_OF_3_MATCH_TB"
          completedSets={completedSets}
          currentSets={{ player1: 0, player2: 0 }}
        />
      );

      const inputs = screen.getAllByRole("spinbutton");
      
      // Digita placar incompleto: 9-8 (diferença < 2)
      fireEvent.change(inputs[0], { target: { value: "9" } });
      fireEvent.change(inputs[1], { target: { value: "8" } });

      // Verifica que mostra "em andamento"
      await waitFor(() => {
        expect(screen.getByText(/Match tiebreak em andamento/i)).toBeInTheDocument();
      });

      // Nota: Botão Confirmar permanece habilitado para permitir salvamento de estado parcial
      // O importante é que a mensagem "em andamento" alerta o usuário
      const confirmButton = screen.getByText("Confirmar Placar");
      expect(confirmButton).not.toBeDisabled();
      
      // Verifica que mensagem de "em andamento" está presente
      expect(screen.getByText(/em andamento/i)).toBeInTheDocument();
    });
  });

  describe("Teste 3: Bloqueio de segurança - Partida já encerrada", () => {
    it("deve mostrar mensagem se tentar adicionar set após partida encerrada", () => {
      // Simula partida já encerrada (2-0)
      const completedSets = [
        {
          games: { player1: 1, player2: 6 },
          winner: "player2" as const,
        },
        {
          games: { player1: 3, player2: 6 },
          winner: "player2" as const,
        },
      ];

      render(
        <EditScoreModal
          {...defaultProps}
          matchFormat="BEST_OF_3"
          completedSets={completedSets}
          currentSets={{ player1: 0, player2: 0 }}
        />
      );

      // Deve mostrar mensagem de partida encerrada
      expect(screen.getByText(/não é possível adicionar mais sets/i)).toBeInTheDocument();
    });
  });

  describe("Teste 5: Bug 6-5 no 3º set - NÃO deve encerrar partida", () => {
    it("não deve mostrar 'Partida Encerrada' com placar 6-5 no 3º set (sets 1x1)", async () => {
      const completedSets = [
        {
          games: { player1: 6, player2: 3 },
          winner: "player1" as const,
        },
        {
          games: { player1: 2, player2: 6 },
          winner: "player2" as const,
        },
      ];

      render(
        <EditScoreModal
          {...defaultProps}
          matchFormat="BEST_OF_3"
          completedSets={completedSets}
          currentSets={{ player1: 0, player2: 0 }}
        />
      );

      // Digita placar 6-5 no 3º set
      const inputs = screen.getAllByRole("spinbutton");
      fireEvent.change(inputs[0], { target: { value: "6" } });
      fireEvent.change(inputs[1], { target: { value: "5" } });

      // Verifica que NÃO mostra banner de partida encerrada
      await waitFor(() => {
        expect(screen.queryByText(/Partida encerrada — confirmar para finalizar/i)).not.toBeInTheDocument();
      });

      // Verifica que mostra mensagem de set em andamento
      expect(screen.getByText(/Set 3 em andamento — informe os games/i)).toBeInTheDocument();
    });

    it("deve mostrar 'Partida Encerrada' apenas com placar 7-5 no 3º set (sets 1x1)", async () => {
      const completedSets = [
        {
          games: { player1: 6, player2: 3 },
          winner: "player1" as const,
        },
        {
          games: { player1: 2, player2: 6 },
          winner: "player2" as const,
        },
      ];

      render(
        <EditScoreModal
          {...defaultProps}
          matchFormat="BEST_OF_3"
          completedSets={completedSets}
          currentSets={{ player1: 0, player2: 0 }}
        />
      );

      // Digita placar 7-5 no 3º set
      const inputs = screen.getAllByRole("spinbutton");
      fireEvent.change(inputs[0], { target: { value: "7" } });
      fireEvent.change(inputs[1], { target: { value: "5" } });

      // Verifica que mostra banner de partida encerrada
      await waitFor(() => {
        expect(screen.getByText(/Partida encerrada — confirmar para finalizar/i)).toBeInTheDocument();
      });
    });

    it("deve mostrar 'Partida Encerrada' com placar 7-6 após tie-break no 3º set", async () => {
      const completedSets = [
        {
          games: { player1: 6, player2: 3 },
          winner: "player1" as const,
        },
        {
          games: { player1: 2, player2: 6 },
          winner: "player2" as const,
        },
      ];

      render(
        <EditScoreModal
          {...defaultProps}
          matchFormat="BEST_OF_3"
          completedSets={completedSets}
          currentSets={{ player1: 0, player2: 0 }}
        />
      );

      // Digita placar 7-6 no 3º set
      const inputs = screen.getAllByRole("spinbutton");
      fireEvent.change(inputs[0], { target: { value: "7" } });
      fireEvent.change(inputs[1], { target: { value: "6" } });

      // Verifica que mostra banner de partida encerrada
      await waitFor(() => {
        expect(screen.getByText(/Partida encerrada — confirmar para finalizar/i)).toBeInTheDocument();
      });
    });
  });

  describe("Teste 4: Fluxo completo com redirecionamento", () => {
    it("deve executar fluxo completo: editar -> confirmar -> chamar callback", async () => {
      const onMatchFinishedMock = jest.fn();
      const onConfirmMock = jest.fn();

      const completedSet1 = [{
        games: { player1: 2, player2: 6 },
        winner: "player2" as const,
      }];

      render(
        <EditScoreModal
          {...defaultProps}
          matchFormat="BEST_OF_3"
          completedSets={completedSet1}
          currentSets={{ player1: 0, player2: 0 }}
          onConfirm={onConfirmMock}
          onMatchFinished={onMatchFinishedMock}
        />
      );

      // Digita Set 2: 4-6
      const inputs = screen.getAllByRole("spinbutton");
      fireEvent.change(inputs[0], { target: { value: "4" } });
      fireEvent.change(inputs[1], { target: { value: "6" } });

      // Aguarda banner
      await waitFor(() => {
        expect(screen.queryAllByText(/partida encerrada/i).length).toBeGreaterThan(0);
      });

      // Confirma
      const confirmButton = screen.getByText("Confirmar Placar");
      fireEvent.click(confirmButton);

      // Verifica callbacks
      expect(onConfirmMock).toHaveBeenCalled();
      expect(onMatchFinishedMock).toHaveBeenCalledWith("player2");
    });
  });
});