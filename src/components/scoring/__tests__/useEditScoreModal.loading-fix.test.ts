/**
 * @jest-environment jsdom
 */
/**
 * Regressão (2026-09-08): onConfirm (na prática handleEditScore, assíncrono)
 * era chamado sem `await` dentro do handleConfirm de useEditScoreModal.
 * setIsConfirming(true) e o finally(false) rodavam praticamente no mesmo
 * tick, escondendo o overlay "Salvando placar..." muito antes da
 * persistência assíncrona terminar de fato — abrindo espaço para o usuário
 * clicar em "Confirmar" de novo antes do /scoring refletir o placar salvo.
 */
import { renderHook, act } from "@testing-library/react";
import { useEditScoreModal } from "@/components/scoring/useEditScoreModal";

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((res) => {
    resolve = res;
  });
  return { promise, resolve };
}

describe("useEditScoreModal — isConfirming aguarda onConfirm de verdade", () => {
  it("BUG (2026-09-08): isConfirming deve continuar true enquanto onConfirm (assíncrono) não resolve", async () => {
    const { promise: onConfirmPromise, resolve: resolveOnConfirm } = deferred<void>();
    const onConfirm = jest.fn(() => onConfirmPromise);
    const onCancel = jest.fn();

    const { result } = renderHook(() =>
      useEditScoreModal(
        {
          isOpen: true,
          matchFormat: "BEST_OF_3",
          playerNames: { p1: "Eduardo", p2: "Mateus" },
          currentSets: { player1: 0, player2: 0 },
          currentServer: "player1",
          completedSets: [
            { games: { player1: 6, player2: 3 }, winner: "player1" },
          ],
        },
        onConfirm,
        onCancel
      )
    );

    expect(result.current.isConfirming).toBe(false);

    let confirmCall!: Promise<void>;
    act(() => {
      confirmCall = result.current.handleConfirm();
    });

    // Antes do fix: onConfirm era chamado sem await, então isConfirming já
    // estava de volta a `false` neste ponto (bug). Com o fix, precisa
    // continuar `true` até resolveOnConfirm() ser chamado.
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(result.current.isConfirming).toBe(true);

    await act(async () => {
      resolveOnConfirm();
      await confirmCall;
    });

    expect(result.current.isConfirming).toBe(false);
  });
});
