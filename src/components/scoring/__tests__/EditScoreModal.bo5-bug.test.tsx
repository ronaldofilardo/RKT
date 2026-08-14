/**
 * @jest-environment jsdom
 *
 * Regressão: ao digitar o placar de UMA vitória de set no 1º set de
 * uma partida BEST_OF_5 (0-0 em sets), o modal "Editar placar" não
 * deve anunciar "X venceu a partida" (setsToWin=3) nem bloquear a
 * edição como "Partida Encerrada".
 *
 * Cenário reportado: 0-0 em sets, 1º set em andamento; usuário digita
 * 6x2 e vê a mensagem prematura de vitória. Após confirmar, reabrir o
 * modal mostra "Partida Encerrada" mesmo sem a partida ter terminado.
 */
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { EditScoreModal } from "@/components/scoring/EditScoreModal";

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
}));

describe("EditScoreModal - bug BO5 0-0 venceu a partida prematuro", () => {
  const defaultProps = {
    isOpen: true,
    matchFormat: "BEST_OF_5" as const,
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
    onMatchFinished: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("1ª abertura (sem digitar) em BO5 0-0 NÃO mostra 'venceu a partida'", () => {
    const { container } = render(<EditScoreModal {...defaultProps} />);
    // eslint-disable-next-line no-console
    console.log("MODAL TEXT (BO5 abertura 0-0):", container.textContent);
    expect(screen.queryByText(/venceu a partida/i)).not.toBeInTheDocument();
  });

  it("1º set (0-0 em sets) com placar 6x2 NÃO mostra 'venceu a partida'", async () => {
    const { container } = render(<EditScoreModal {...defaultProps} />);

    const inputs = screen.getAllByPlaceholderText("0");
    fireEvent.change(inputs[0], { target: { value: "6" } });
    fireEvent.change(inputs[1], { target: { value: "2" } });

    await waitFor(() => {
      expect(screen.getByText(/João venceu o set/i)).toBeInTheDocument();
    });

    // Diagnóstico: captura do resumo exibido para inspeção.
    // eslint-disable-next-line no-console
    console.log("MODAL TEXT (BO5 6x2):", container.textContent);

    expect(screen.queryByText(/venceu a partida/i)).not.toBeInTheDocument();
    expect(
      screen.queryByText(/Partida encerrada — confirmar para finalizar/i),
    ).not.toBeInTheDocument();
  });

  it("1º set (0-0 em sets) NÃO bloqueia com 'Partida Encerrada'", () => {
    render(<EditScoreModal {...defaultProps} />);

    expect(
      screen.queryByText(/Partida já foi finalizada/i),
    ).not.toBeInTheDocument();
    expect(screen.getAllByPlaceholderText("0").length).toBeGreaterThan(0);
  });

  it("2ª abertura com 1 set já completado (1-0 em sets) no 2º set NÃO mostra 'venceu a partida' ao digitar 6x3", async () => {
    const completedSets = [
      {
        games: { player1: 6, player2: 2 } as Record<"player1" | "player2", number>,
        winner: "player1" as const,
      },
    ];

    render(
      <EditScoreModal
        {...defaultProps}
        completedSets={completedSets}
        currentSets={{ player1: 0, player2: 0 }}
      />,
    );

    expect(
      screen.queryByText(/Partida já foi finalizada/i),
    ).not.toBeInTheDocument();
    expect(screen.getByText(/1 — 0/i)).toBeInTheDocument();

    const inputs = screen.getAllByPlaceholderText("0");
    fireEvent.change(inputs[0], { target: { value: "6" } });
    fireEvent.change(inputs[1], { target: { value: "3" } });

    await waitFor(() => {
      expect(screen.getByText(/João venceu o set/i)).toBeInTheDocument();
    });

    expect(screen.queryByText(/venceu a partida/i)).not.toBeInTheDocument();
    expect(
      screen.queryByText(/Partida encerrada — confirmar para finalizar/i),
    ).not.toBeInTheDocument();
  });

  it("reproduz bug formato inválido: BEST_OF_5_MATCH_TB (sem definir em setsToWinForFormat) → setsToWin cai no default=1 → 'venceu a partida' prematuro", async () => {
    render(
      <EditScoreModal
        {...defaultProps}
        matchFormat={"BEST_OF_5_MATCH_TB" as any}
      />,
    );

    const inputs = screen.getAllByPlaceholderText("0");
    fireEvent.change(inputs[0], { target: { value: "6" } });
    fireEvent.change(inputs[1], { target: { value: "2" } });

    await waitFor(() => {
      expect(screen.queryByText(/venceu a partida/i)).toBeInTheDocument();
    });
  });

  // Bug reportado em produção: partida Melhor de 3 NO_AD com 1º set 6x3.
  // Sintoma: modal mostra "Melhor de 5 sets" + "Ronaldo venceu a partida"
  // + "Partida Encerrada" ao digitar o 1º set. Raiz: setsToWinForFormat
  // caía no `default: return 1` para BEST_OF_3_NO_AD (não estava mapeado).
  it("BEST_OF_3_NO_AD: 1º set 6x3 NÃO mostra 'venceu a partida' (setsToWin=2, não 1)", async () => {
    const { container } = render(
      <EditScoreModal
        {...defaultProps}
        matchFormat="BEST_OF_3_NO_AD"
        playerNames={{ p1: "Ronaldo", p2: "Mateus" }}
      />,
    );

    // Subtítulo deve dizer "Melhor de 3", não "Melhor de 5".
    expect(container.textContent).toMatch(/Melhor de 3/i);
    expect(container.textContent).not.toMatch(/Melhor de 5/i);

    const inputs = screen.getAllByPlaceholderText("0");
    fireEvent.change(inputs[0], { target: { value: "6" } });
    fireEvent.change(inputs[1], { target: { value: "3" } });

    await waitFor(() => {
      expect(screen.getByText(/Ronaldo venceu o set/i)).toBeInTheDocument();
    });

    expect(screen.queryByText(/venceu a partida/i)).not.toBeInTheDocument();
    expect(
      screen.queryByText(/Partida encerrada — confirmar para finalizar/i),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(/Partida já foi finalizada/i),
    ).not.toBeInTheDocument();
  });
});
