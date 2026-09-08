/**
 * @jest-environment jsdom
 *
 * Regression test — Bug (2026-09-07): "Editar Placar" calculava o próximo
 * sacador com base no placar ORIGINAL de um set já concluído, mesmo quando
 * o usuário corrigia o placar desse set no modal antes de confirmar.
 *
 * Cenário: Set 1 concluído 6-2 (soma par de games). O usuário corrige o
 * placar do jogador 2 nesse set de 2 para 3 (6-3, soma ímpar) e confirma
 * SEM adicionar um set novo (apenas salvando a correção). O sacador
 * retornado deve ser recalculado a partir do placar CORRIGIDO (soma 9,
 * ímpar -> inverte currentServer), e não simplesmente o `currentServer`
 * original repassado sem ajuste (que era o comportamento antes da correção,
 * pois qualquer edição de set concluído era ignorada nesse cálculo).
 */

import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { EditScoreModal } from "@/components/scoring/EditScoreModal";

describe("useEditScoreModal — sacador recalculado após editar set concluído", () => {
  const baseProps = {
    isOpen: true,
    matchFormat: "BEST_OF_3" as const,
    playerNames: { p1: "João", p2: "Pedro" },
    currentSets: { player1: 0, player2: 0 },
    currentServer: "player1" as const,
    completedSets: [
      { games: { player1: 6, player2: 2 } as Record<"player1" | "player2", number>, winner: "player1" as const },
    ],
    currentGamePoints: { player1: 0, player2: 0 },
    floorCurrentSets: null,
    onCancel: jest.fn(),
  };

  it("recalcula o sacador com base no placar editado do set concluído, não no original", () => {
    const onConfirm = jest.fn();
    render(<EditScoreModal {...baseProps} onConfirm={onConfirm} />);

    // Corrige o placar do jogador 2 no Set 1 de 2 para 3 (6-2 -> 6-3) via o
    // input numérico do resumo de sets completados (EditableSetsSummary).
    const p2CompletedInput = screen.getByDisplayValue("2");
    fireEvent.change(p2CompletedInput, { target: { value: "3" } });

    // Confirma sem preencher um set novo — deve salvar só a correção.
    const confirmButton = screen.getByRole("button", { name: "Confirmar" });
    expect(confirmButton).not.toBeDisabled();
    fireEvent.click(confirmButton);

    expect(onConfirm).toHaveBeenCalledTimes(1);
    const [savedSets, nextServer] = onConfirm.mock.calls[0];

    // Placar salvo reflete a correção.
    expect(savedSets[0]).toMatchObject({ p1Games: 6, p2Games: 3 });

    // Sacador recalculado a partir do placar CORRIGIDO (6+3=9, ímpar) ->
    // inverte currentServer ("player1" -> "player2"). Antes da correção,
    // o código repassava currentServer ("player1") sem ajuste.
    expect(nextServer).toBe("player2");
  });
});
