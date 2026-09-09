/**
 * Regressão (2026-09-08): mensagem de validação em inglês ("Enter the set
 * result") aparecia numa UI 100% em português no modal Editar Placar.
 */
import { validateSetResult } from "@/components/scoring/editScoreHelpers";

describe("validateSetResult — mensagens em português", () => {
  it("usa 'Informe o resultado do set' (não mais o texto em inglês) quando ambos os games estão zerados", () => {
    const result = validateSetResult({ p1Games: 0, p2Games: 0 }, "BEST_OF_3");
    expect(result.isValid).toBe(false);
    expect(result.error).toBe("Informe o resultado do set");
    expect(result.error).not.toMatch(/enter/i);
  });
});
