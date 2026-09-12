/**
 * Testes Canônicos de Formatos de Jogo e Motor de Pontuação
 * 
 * Atualizado pós-correção P0 (2026-09-11):
 * - TD-048: No-Ad Sudden Death (Ponto Decisivo após 40-40)
 * - TD-049: Tiebreak em 6x6 para BEST_OF_3_NO_AD
 * - TD-050: Gatilho de Tiebreak em 8 games para PRO_SET_8
 */

import { ScoringEngine } from "@/core/scoring/engine";
import { shouldStartTiebreak } from "@/core/scoring/tiebreak";
import { getTiebreakAtForFormat, usesNoAd, createEmptySetForFormat } from "@/core/scoring/format-rules";

describe("Scoring Formats Specification Tests", () => {
  const defaultPlayer1 = "player-1";
  const defaultPlayer2 = "player-2";

  describe("Formato: BEST_OF_3_NO_AD", () => {
    it("deve confirmar que usesNoAd é true para BEST_OF_3_NO_AD", () => {
      const config = {
        format: "BEST_OF_3_NO_AD" as const,
        player1Id: defaultPlayer1,
        player2Id: defaultPlayer2,
      };
      expect(usesNoAd(config)).toBe(true);
    });

    it("TD-048 Corrigido: No-Ad vai para Ponto Decisivo (Deuce) no 40-40 (3-3) e decide no ponto seguinte", () => {
      const engine = new ScoringEngine({
        format: "BEST_OF_3_NO_AD",
        player1Id: defaultPlayer1,
        player2Id: defaultPlayer2,
        initialServerId: defaultPlayer1,
      });

      // No início, nenhum game completado
      expect(engine.getState().sets.length).toBe(0);

      // P1 faz 3 pontos (40-0)
      engine.applyPoint({ winnerId: defaultPlayer1 }); // 15-0 (1-0)
      engine.applyPoint({ winnerId: defaultPlayer1 }); // 30-0 (2-0)
      engine.applyPoint({ winnerId: defaultPlayer1 }); // 40-0 (3-0)

      // P2 faz 2 pontos (40-30)
      engine.applyPoint({ winnerId: defaultPlayer2 }); // 40-15 (3-1)
      engine.applyPoint({ winnerId: defaultPlayer2 }); // 40-30 (3-2)

      expect(engine.getState().currentGame.player1).toBe(3);
      expect(engine.getState().currentGame.player2).toBe(2);
      expect(engine.getState().sets.length).toBe(0);

      // P2 faz o ponto de empate (40-40, 3-3)
      // REGRA CORRETA: O game NÃO encerra aqui. Entra em Deuce (Ponto Decisivo).
      engine.applyPoint({ winnerId: defaultPlayer2 });

      expect(engine.getState().currentGame.isDeuce).toBe(true);
      expect(engine.getState().currentGame.player1).toBe(3);
      expect(engine.getState().currentGame.player2).toBe(3);
      expect(engine.getState().sets.length).toBe(0); // Ainda 0 games completados!

      // Próximo ponto: Ponto de Ouro / Sudden Death
      // Quem fizer esse ponto ganha o game
      engine.applyPoint({ winnerId: defaultPlayer2 });

      expect(engine.getState().sets.length).toBe(1);
      expect(engine.getState().sets[0].player2).toBe(1);
      expect(engine.getState().currentGame.player1).toBe(0);
      expect(engine.getState().currentGame.player2).toBe(0);
    });

    it("TD-049 Corrigido: Em BEST_OF_3_NO_AD o tiebreak NÃO dispara em 4x4, apenas em 6x6", () => {
      const config = {
        format: "BEST_OF_3_NO_AD" as const,
        player1Id: defaultPlayer1,
        player2Id: defaultPlayer2,
      };

      const setAt4x4 = {
        player1: 4,
        player2: 4,
        isTiebreak: false,
        tiebreakScore: null,
      };

      const dummyState = {
        sets: [setAt4x4],
        currentGame: { player1: 0, player2: 0, isDeuce: false },
        setsWon: { player1: 0, player2: 0 },
        server: "player1" as const,
        isFinished: false,
        winner: null,
      };

      // REGRA CORRETA: Em 4x4 o tiebreak NÃO deve começar
      expect(shouldStartTiebreak(setAt4x4, dummyState as any, config)).toBe(false);

      // Em 6x6 o tiebreak deve começar
      const setAt6x6 = {
        player1: 6,
        player2: 6,
        isTiebreak: false,
        tiebreakScore: null,
      };
      expect(shouldStartTiebreak(setAt6x6, dummyState as any, config)).toBe(true);
    });
  });

  describe("Formato: SHORT_SET_2V2_NO_AD", () => {
    it("deve confirmar que createEmptySetForFormat inicia os games em 2x2", () => {
      const emptySet = createEmptySetForFormat("SHORT_SET_2V2_NO_AD");
      expect(emptySet.player1).toBe(2);
      expect(emptySet.player2).toBe(2);
    });

    it("deve criar o primeiro set iniciando em 2x2 após o primeiro game ser ganho", () => {
      const engine = new ScoringEngine({
        format: "SHORT_SET_2V2_NO_AD",
        player1Id: defaultPlayer1,
        player2Id: defaultPlayer2,
        initialServerId: defaultPlayer1,
      });

      // P1 ganha 4 pontos seguidos para fechar o primeiro game
      engine.applyPoint({ winnerId: defaultPlayer1 });
      engine.applyPoint({ winnerId: defaultPlayer1 });
      engine.applyPoint({ winnerId: defaultPlayer1 });
      engine.applyPoint({ winnerId: defaultPlayer1 });

      const state = engine.getState();
      expect(state.sets.length).toBe(1);
      expect(state.sets[0].player1).toBe(3);
      expect(state.sets[0].player2).toBe(2);
    });

    it("deve ativar tiebreak em 4x4 para SHORT_SET_2V2_NO_AD", () => {
      const config = {
        format: "SHORT_SET_2V2_NO_AD" as const,
        player1Id: defaultPlayer1,
        player2Id: defaultPlayer2,
      };

      const setAt4x4 = {
        player1: 4,
        player2: 4,
        isTiebreak: false,
        tiebreakScore: null,
      };

      const dummyState = {
        sets: [setAt4x4],
        currentGame: { player1: 0, player2: 0, isDeuce: false },
        setsWon: { player1: 0, player2: 0 },
        server: "player1" as const,
        isFinished: false,
        winner: null,
      };

      expect(shouldStartTiebreak(setAt4x4, dummyState as any, config)).toBe(true);
    });
  });

  describe("Formato: PRO_SET_8", () => {
    it("deve confirmar que getTiebreakAtForFormat retorna 9 para PRO_SET_8", () => {
      // No ecossistema RKT, PRO_SET_8 joga até 9x9 antes do tiebreak (fechando em 10-9)
      const tbGames = getTiebreakAtForFormat("PRO_SET_8");
      expect(tbGames).toBe(9);
    });
  });
});
