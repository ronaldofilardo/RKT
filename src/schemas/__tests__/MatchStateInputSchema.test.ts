/**
 * MatchStateInputSchema — union envelope ({state, history}) vs plano (MatchScoreStateSchema)
 *
 * Propósito: Garantir que o schema aceita ambos os formatos de `scoreState` enviados
 * pelo cliente `persistStateWithRetry` (src/hooks/useScoringHandlers.persistence.ts:73):
 *   - estado plano (legado): { sets, currentGame, server, isFinished, winner, ... }
 *   - envelope com history:  { state: {...plano...}, history: [...] }
 *
 * Causa raiz: commit e8a8f17 introduziu o envelope quando `history` está disponível,
 * mas apenas `MatchScoreStateSchema` (plano) era aceito, gerando VALIDATION_ERROR
 * com 5× "Required" (sets, currentGame, server, isFinished, winner) em produção.
 * Fix: union([MatchScoreStateEnvelopeSchema, MatchScoreStateSchema]) — ver contracts.ts.
 *
 * Owner: @qa
 * Data: 2026-08-13
 */

import { describe, it, expect } from "@jest/globals";
import { MatchStateInputSchema } from "../contracts";

const baseScoreState = {
  sets: [{ player1: 6, player2: 4, isTiebreak: false, tiebreakScore: null }],
  currentGame: { player1: 0, player2: 0, isDeuce: false, advantage: null, secondServe: false },
  server: "player1",
  isFinished: false,
  winner: null,
  setsWon: { player1: 1, player2: 0 },
  startedAt: null,
  secondServe: false,
};

const baseBody = {
  state: "IN_PROGRESS" as const,
  version: 1,
  allowScoreEdit: true,
};

describe("MatchStateInputSchema — scoreState union (envelope vs plano)", () => {
  describe("formato plano (legado)", () => {
    it("deve aceitar scoreState plano (sem envelope)", () => {
      const result = MatchStateInputSchema.safeParse({
        ...baseBody,
        scoreState: baseScoreState,
      });
      expect(result.success).toBe(true);
    });

    it("deve aceitar scoreState plano com history inline (campo opcional)", () => {
      const result = MatchStateInputSchema.safeParse({
        ...baseBody,
        scoreState: {
          ...baseScoreState,
          history: [{ stateBefore: { foo: 1 }, point: { bar: 2 } }],
        },
      });
      expect(result.success).toBe(true);
    });

    it("deve rejeitar scoreState plano sem campos obrigatórios (sets/currentGame/server/isFinished/winner)", () => {
      const result = MatchStateInputSchema.safeParse({
        ...baseBody,
        scoreState: { startedAt: null },
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const fieldErrors = result.error.flatten().fieldErrors;
        // Corresponde ao erro de produção: 5× "Required" em sets, currentGame,
        // server, isFinished, winner.
        expect(fieldErrors.scoreState).toBeDefined();
      }
    });

    it("deve manter `scoreState` opcional quando não enviado", () => {
      const result = MatchStateInputSchema.safeParse({
        ...baseBody,
        // scoreState omitido
      });
      expect(result.success).toBe(true);
    });
  });

  describe("envelope {state, history} (novo fluxo edit-score com history)", () => {
    it("deve aceitar envelope {state, history}", () => {
      const result = MatchStateInputSchema.safeParse({
        ...baseBody,
        scoreState: {
          state: baseScoreState,
          history: [{ stateBefore: { foo: 1 }, point: { bar: 2 } }],
        },
      });
      expect(result.success).toBe(true);
    });

    it("deve aceitar envelope sem history (apenas {state})", () => {
      // MatchScoreStateEnvelopeSchema.history é opcional
      const result = MatchStateInputSchema.safeParse({
        ...baseBody,
        scoreState: { state: baseScoreState },
      });
      expect(result.success).toBe(true);
    });

    it("deve rejeitar envelope com `state` inválido (sem sets/currentGame/server/isFinished/winner)", () => {
      const result = MatchStateInputSchema.safeParse({
        ...baseBody,
        scoreState: {
          state: { startedAt: null }, // faltam 5 campos
          history: [],
        },
      });
      expect(result.success).toBe(false);
    });

    it("deve rejeitar envelope onde `state` não é objeto (não segue MatchScoreStateSchema)", () => {
      const result = MatchStateInputSchema.safeParse({
        ...baseBody,
        scoreState: { state: "not-an-object", history: [] },
      });
      expect(result.success).toBe(false);
    });

    it("deve aceitar envelope com history vazio []", () => {
      const result = MatchStateInputSchema.safeParse({
        ...baseBody,
        scoreState: { state: baseScoreState, history: [] },
      });
      expect(result.success).toBe(true);
    });

    it("deve aceitar envelope com history tendo múltiplas entradas", () => {
      const result = MatchStateInputSchema.safeParse({
        ...baseBody,
        scoreState: {
          state: baseScoreState,
          history: [
            { stateBefore: { v: 1 }, point: { id: "p1" } },
            { stateBefore: { v: 2 }, point: { id: "p2" } },
            { stateBefore: { v: 3 }, point: { id: "p3" } },
          ],
        },
      });
      expect(result.success).toBe(true);
    });
  });

  describe("precedência union (envelope vs plano)", () => {
    it("não deve confundir envelope com state plano mesmo se state tiver history inline", () => {
      // Caso ambíguo: state plano com `state` campo (não faz parte de MatchScoreStateSchema
      // então seria aceito como plano; envelope exige `state` ser MatchScoreState).
      // Aqui testamos que union escolhe o envelope quando presente e válido.
      const result = MatchStateInputSchema.safeParse({
        ...baseBody,
        scoreState: {
          state: baseScoreState,
          history: [],
          // campos extras NÃO presentes em MatchScoreStateSchema:
          unknownField: "should be ignored by zod",
        },
      });
      // zod por padrão strip keys desconhecidas — ainda valida.
      expect(result.success).toBe(true);
    });
  });

  describe("regras gerais do MatchStateInputSchema", () => {
    it("deve rejeitar transição para SCHEDULED (regra de domínio)", () => {
      const result = MatchStateInputSchema.safeParse({
        state: "SCHEDULED",
        scoreState: baseScoreState,
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("SCHEDULED");
      }
    });

    it("deve aceitar state IN_PROGRESS sem scoreState (transição inicial admit)", () => {
      const result = MatchStateInputSchema.safeParse({
        state: "IN_PROGRESS",
        initialServerId: "player-1",
      });
      expect(result.success).toBe(true);
    });
  });
});
