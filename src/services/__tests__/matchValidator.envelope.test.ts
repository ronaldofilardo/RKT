/**
 * matchValidator — ScoreStateEnvelope unwrap (regressão)
 *
 * Propósito: Garantir que `validateTransitionState` aplica corretamente a
 * verificação de SCORE_REGRESSION quando o cliente envia `scoreState` como
 * envelope `{state, history}` (commit e8a8f17) em vez de plano.
 *
 * Causa raiz: antes do fix, o validator lia `newState_`/`oldState` direto
 * do envelope sem extrair `.state`, resultando em `setsWon=undefined` e
 * bypass silencioso das checagens de regressão. O fix adiciona
 * `unwrapScoreState` em src/services/matchValidator.ts.
 *
 * Owner: @qa
 * Data: 2026-08-13
 * Refs: src/hooks/useScoringHandlers.persistence.ts:73, src/schemas/contracts.ts (union)
 */

import { describe, it, expect } from "@jest/globals";
import { validateTransitionState } from "../matchValidator";

const matchData = {
  format: "BEST_OF_3_MATCH_TB" as const,
  player1Id: "player-1",
  player2Id: "player-2",
  initialServerId: "player-1",
  state: "IN_PROGRESS" as const,
};

const baseScoreState = {
  sets: [
    { player1: 6, player2: 4, isTiebreak: false, tiebreakScore: null },
    { player1: 3, player2: 6, isTiebreak: false, tiebreakScore: null },
  ],
  setsWon: { player1: 1, player2: 1 },
  currentGame: { player1: 0, player2: 0, isDeuce: false, advantage: null, secondServe: false },
  server: "player1" as const,
  isFinished: false,
  winner: null,
  startedAt: Date.now(),
  secondServe: false,
};

describe("validateTransitionState — ScoreStateEnvelope unwrap", () => {
  describe("comparação old↔new com envelope", () => {
    it("deve permitir edição quando setsWon é igual (envelope → envelope)", () => {
      const oldEnvelope = { state: baseScoreState, history: [] };
      const newEnvelope = { state: { ...baseScoreState }, history: [] };

      const result = validateTransitionState(
        { ...matchData, scoreState: oldEnvelope },
        "IN_PROGRESS",
        newEnvelope,
        { allowScoreEdit: true },
      );

      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it("deve bloquear regressão de setsWon quando NOVO é envelope e VELHO é plano", () => {
      const oldPlano = { ...baseScoreState };
      const newEnvelope = {
        state: {
          ...baseScoreState,
          setsWon: { player1: 0, player2: 1 }, // p1 regrediu 1→0
        },
        history: [],
      };

      const result = validateTransitionState(
        { ...matchData, scoreState: oldPlano },
        "IN_PROGRESS",
        newEnvelope,
        { allowScoreEdit: false }, // sem bypass
      );

      expect(result.valid).toBe(false);
      expect(result.error).toContain("SCORE_REGRESSION");
    });

    it("deve bloquear regressão de setsWon quando NOVO é plano e VELHO é envelope", () => {
      const oldEnvelope = { state: baseScoreState, history: [] };
      const newPlano = {
        ...baseScoreState,
        setsWon: { player1: 0, player2: 1 }, // p1 regrediu 1→0
      };

      const result = validateTransitionState(
        { ...matchData, scoreState: oldEnvelope },
        "IN_PROGRESS",
        newPlano,
        { allowScoreEdit: false },
      );

      expect(result.valid).toBe(false);
      expect(result.error).toContain("SCORE_REGRESSION");
    });

    it("deve bloquear regressão quando ambos (old e new) são envelopes", () => {
      const oldEnvelope = { state: baseScoreState, history: [] };
      const newEnvelope = {
        state: {
          ...baseScoreState,
          setsWon: { player1: 0, player2: 2 }, // p1 regrediu 1→0, p2 avançou 1→2
        },
        history: [],
      };

      const result = validateTransitionState(
        { ...matchData, scoreState: oldEnvelope },
        "IN_PROGRESS",
        newEnvelope,
        { allowScoreEdit: false },
      );

      expect(result.valid).toBe(false);
      expect(result.error).toContain("SCORE_REGRESSION");
    });

    it("deve permitir mesmo setsWon com history diferente (sem regressão)", () => {
      const oldEnvelope = {
        state: baseScoreState,
        history: [{ stateBefore: {}, point: { id: "p1" } }],
      };
      const newEnvelope = {
        state: { ...baseScoreState },
        history: [
          { stateBefore: {}, point: { id: "p1" } },
          { stateBefore: {}, point: { id: "p2" } },
        ],
      };

      const result = validateTransitionState(
        { ...matchData, scoreState: oldEnvelope },
        "IN_PROGRESS",
        newEnvelope,
        { allowScoreEdit: false },
      );

      // setsWon igual entre old.state e new.state → não regrediu
      expect(result.valid).toBe(true);
    });
  });

  describe("regressão de currentGame com envelope", () => {
    it("deve detectar regressão de currentGame quando allowScoreEdit=false e setsWon igual", () => {
      const oldEnvelope = {
        state: {
          ...baseScoreState,
          currentGame: { player1: 30, player2: 15, isDeuce: false, advantage: null, secondServe: false },
        },
        history: [],
      };
      const newEnvelope = {
        state: {
          ...baseScoreState,
          currentGame: { player1: 0, player2: 15, isDeuce: false, advantage: null, secondServe: false },
        },
        history: [],
      };

      const result = validateTransitionState(
        { ...matchData, scoreState: oldEnvelope },
        "IN_PROGRESS",
        newEnvelope,
        { allowScoreEdit: false },
      );

      // 30→0 com p2 mesmo (15) → currentGame regredindo
      expect(result.valid).toBe(false);
      expect(result.error).toContain("SCORE_REGRESSION");
    });

    it("NÃO deve detectar regressão quando allowScoreEdit=true (fluxo edit-score)", () => {
      const oldEnvelope = {
        state: {
          ...baseScoreState,
          currentGame: { player1: 30, player2: 15, isDeuce: false, advantage: null, secondServe: false },
        },
        history: [],
      };
      const newEnvelope = {
        state: {
          ...baseScoreState,
          currentGame: { player1: 0, player2: 15, isDeuce: false, advantage: null, secondServe: false },
        },
        history: [],
      };

      const result = validateTransitionState(
        { ...matchData, scoreState: oldEnvelope },
        "IN_PROGRESS",
        newEnvelope,
        { allowScoreEdit: true },
      );

      // permitido — edit-score tem bypass
      expect(result.valid).toBe(true);
    });
  });

  describe("transição para FINISHED com envelope", () => {
    it("deve validar via ScoringEngine.fromSerialized (aceita envelope) e retornar válido quando isFinished", () => {
      const envelope = {
        state: {
          ...baseScoreState,
          sets: [
            ...baseScoreState.sets,
            { player1: 0, player2: 0, isTiebreak: true, tiebreakScore: { player1: 10, player2: 8 } },
          ],
          setsWon: { player1: 1, player2: 2 },
          isFinished: true,
          winner: "player2" as const,
        },
        history: [],
      };

      const result = validateTransitionState(
        { ...matchData, scoreState: null },
        "FINISHED",
        envelope,
      );

      expect(result.valid).toBe(true);
    });

    it("deve rejeitar FINISHED com envelope cujo state.isFinished é false", () => {
      const envelope = {
        state: { ...baseScoreState, isFinished: false, winner: null },
        history: [],
      };

      const result = validateTransitionState(
        { ...matchData, scoreState: null },
        "FINISHED",
        envelope,
      );

      expect(result.valid).toBe(false);
      expect(result.error).toContain("CANNOT_FINISH");
    });
  });
});
