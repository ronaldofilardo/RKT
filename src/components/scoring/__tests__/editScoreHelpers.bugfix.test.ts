/**
 * Testes para as funções helper de edição de placar
 */

import { validateSetResult, validateMatchTiebreakInput, getNextServerAfterSet } from "../editScoreHelpers";

describe("editScoreHelpers - Validações e Server Rotation", () => {
  describe("validateMatchTiebreakInput", () => {
    it("deve validar match tiebreak completado (10-8)", () => {
      const result = validateMatchTiebreakInput({ p1Points: 10, p2Points: 8 });
      expect(result.isValid).toBe(true);
      expect(result.winner).toBe("player1");
      expect(result.isPartial).toBeUndefined();
    });

    it("deve validar match tiebreak completado (12-10)", () => {
      const result = validateMatchTiebreakInput({ p1Points: 12, p2Points: 10 });
      expect(result.isValid).toBe(true);
      expect(result.winner).toBe("player1");
    });

    it("deve validar match tiebreak completado para player2 (8-10)", () => {
      const result = validateMatchTiebreakInput({ p1Points: 8, p2Points: 10 });
      expect(result.isValid).toBe(true);
      expect(result.winner).toBe("player2");
    });

    it("deve retornar isPartial para tiebreak em andamento (9-8)", () => {
      const result = validateMatchTiebreakInput({ p1Points: 9, p2Points: 8 });
      expect(result.isValid).toBe(true);
      expect(result.isPartial).toBe(true);
      expect(result.winner).toBeUndefined();
    });

    it("deve retornar isPartial para tiebreak em andamento (5-5)", () => {
      const result = validateMatchTiebreakInput({ p1Points: 5, p2Points: 5 });
      expect(result.isValid).toBe(true);
      expect(result.isPartial).toBe(true);
    });

    it("deve retornar erro para diferença insuficiente (10-9)", () => {
      const result = validateMatchTiebreakInput({ p1Points: 10, p2Points: 9 });
      expect(result.isValid).toBe(true);
      expect(result.isPartial).toBe(true);
      expect(result.winner).toBeUndefined();
    });

    it("deve retornar erro para pontos negativos", () => {
      const result = validateMatchTiebreakInput({ p1Points: -1, p2Points: 5 });
      expect(result.isValid).toBe(false);
      expect(result.error).toContain("negative");
    });

    it("deve retornar erro para 0-0", () => {
      const result = validateMatchTiebreakInput({ p1Points: 0, p2Points: 0 });
      expect(result.isValid).toBe(false);
      expect(result.error).toContain("Enter the tiebreak result");
    });
  });

  describe("getNextServerAfterSet - Server Rotation com múltiplos sets", () => {
    it("deve alternar servidor após set sem tiebreak", () => {
      const next = getNextServerAfterSet({
        currentServer: "player1",
        p1Games: 6,
        p2Games: 4,
        format: "BEST_OF_3",
      });
      // 10 games (par) → servidor mantém
      expect(next).toBe("player1");
    });

    it("deve manter servidor após tiebreak win", () => {
      const next = getNextServerAfterSet({
        currentServer: "player1",
        p1Games: 7,
        p2Games: 6,
        format: "BEST_OF_3",
        tiebreakPoints: { player1: 7, player2: 5 },
      });
      expect(next).toBe("player1");
    });

    it("deve considerar total de games de sets anteriores para rotação", () => {
      // Set 1: 6-4 (10 games, par) → server mantém
      // Set 2: 6-4 (10 games, par) → server mantém
      // Total: 20 games (par) → server mantém
      const next = getNextServerAfterSet({
        currentServer: "player1",
        p1Games: 6,
        p2Games: 4,
        format: "BEST_OF_3",
        completedSets: [
          { player1: 6, player2: 4 }, // 10 games (par)
        ],
      });
      expect(next).toBe("player1");
    });

    it("deve alternar servidor se total de games for ímpar", () => {
      // Set 1: 6-3 (9 games, ímpar) → server alterna
      const next = getNextServerAfterSet({
        currentServer: "player1",
        p1Games: 6,
        p2Games: 4,
        format: "BEST_OF_3",
        completedSets: [
          { player1: 6, player2: 3 }, // 9 games (ímpar)
        ],
      });
      // Total: 9 + 10 = 19 (ímpar) → server alterna
      expect(next).toBe("player2");
    });

    it("deve funcionar sem completedSets (retrocompatibilidade)", () => {
      const next = getNextServerAfterSet({
        currentServer: "player2",
        p1Games: 6,
        p2Games: 3,
        format: "BEST_OF_3",
      });
      // 9 games (ímpar) → server alterna
      expect(next).toBe("player1");
    });
  });

  describe("validateSetResult - Validações de set padrão", () => {
    it("deve validar set completado 6-1", () => {
      const result = validateSetResult({ p1Games: 6, p2Games: 1 }, "BEST_OF_3");
      expect(result.isValid).toBe(true);
      expect(result.winner).toBe("player1");
      expect(result.isPartial).toBeUndefined();
    });

    it("deve validar set completado 1-6", () => {
      const result = validateSetResult({ p1Games: 1, p2Games: 6 }, "BEST_OF_3");
      expect(result.isValid).toBe(true);
      expect(result.winner).toBe("player2");
    });

    it("deve validar set em andamento 5-4", () => {
      const result = validateSetResult({ p1Games: 5, p2Games: 4 }, "BEST_OF_3");
      expect(result.isValid).toBe(true);
      expect(result.isPartial).toBe(true);
    });

    it("deve validar set em andamento 6-5", () => {
      const result = validateSetResult({ p1Games: 6, p2Games: 5 }, "BEST_OF_3");
      expect(result.isValid).toBe(true);
      expect(result.isPartial).toBe(true);
    });

    it("deve requerer tiebreak em 6-6", () => {
      const result = validateSetResult({ p1Games: 6, p2Games: 6 }, "BEST_OF_3");
      expect(result.isValid).toBe(false);
      expect(result.tiebreakRequired).toBe(true);
    });

    it("deve validar set com tiebreak 7-6", () => {
      const result = validateSetResult({ p1Games: 7, p2Games: 6 }, "BEST_OF_3");
      expect(result.isValid).toBe(true);
      expect(result.winner).toBe("player1");
      expect(result.hasTiebreak).toBe(true);
    });

    it("deve validar SHORT_SET 4-2", () => {
      const result = validateSetResult({ p1Games: 4, p2Games: 2 }, "SHORT_SET_2V2_NO_AD");
      expect(result.isValid).toBe(true);
      expect(result.winner).toBe("player1");
    });

    it("deve requerer tiebreak em 4-4 no SHORT_SET", () => {
      const result = validateSetResult({ p1Games: 4, p2Games: 4 }, "SHORT_SET_2V2_NO_AD");
      expect(result.isValid).toBe(false);
      expect(result.tiebreakRequired).toBe(true);
    });
  });
});