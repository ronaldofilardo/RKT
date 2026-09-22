/**
 * Regressão (2026-09-08): mensagem de validação em inglês ("Enter the set
 * result") aparecia numa UI 100% em português no modal Editar Placar.
 */
import { validateSetResult } from "@/components/scoring/editScoreHelpers";

describe("validateSetResult — mensagens em português", () => {
  it("agora aceita 0-0 como válido e parcial (não exige mais preenchimento para iniciar a partida)", () => {
    const result = validateSetResult({ p1Games: 0, p2Games: 0 }, "BEST_OF_3");
    expect(result.isValid).toBe(true);
    expect(result.isPartial).toBe(true);
    expect(result.error).toBeUndefined();
  });
});
