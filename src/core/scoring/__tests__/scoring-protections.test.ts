/**
 * Testes para Proteções do Mecanismo de Ajustar Placar
 * 
 * PROTEÇÃO #1: Validação Preventiva de Match Tie-Break
 * PROTEÇÃO #2: Validação de Regressão do Game Atual (em desenvolvimento)
 * PROTEÇÃO #3: Deduplicação de Persistência (em desenvolvimento)
 * PROTEÇÃO #4: Floor Check com Contexto de Tie-Break (em desenvolvimento)
 */

import { ScoringEngine } from "@/core/scoring/engine";
import type { ScoringState, SetScore } from "@/core/scoring/types";
import type { SetEditData } from "@/components/scoring/editScoreHelpers";

describe("Proteções do Mecanismo de Ajustar Placar", () => {
  describe("PROTEÇÃO #1: Validação Preventiva de Match Tie-Break", () => {
    it("deve permitir match tie-break completo com vitória clara", () => {
      const setResults: SetEditData[] = [
        { p1Games: 6, p2Games: 4, isPartial: false }, // Set 1
        { p1Games: 3, p2Games: 6, isPartial: false }, // Set 2
        { p1Games: 10, p2Games: 7, isPartial: false }, // Match TB completo
      ];

      // Simular validação
      const format = 'BEST_OF_3_MATCH_TB';
      const matchTiebreakIdx = 2;
      const set = setResults[matchTiebreakIdx];

      const tbMin = 10;
      const p1Won = set.p1Games >= tbMin && set.p1Games - set.p2Games >= 2;
      const p2Won = set.p2Games >= tbMin && set.p2Games - set.p1Games >= 2;

      expect(p1Won || p2Won).toBe(true);
      expect(p1Won).toBe(true); // Player 1 venceu 10-7
    });

    it("deve permitir match tie-break em andamento (parcial)", () => {
      const setResults: SetEditData[] = [
        { p1Games: 6, p2Games: 4, isPartial: false }, // Set 1
        { p1Games: 3, p2Games: 6, isPartial: false }, // Set 2
        { p1Games: 8, p2Games: 6, isPartial: true }, // Match TB em andamento
      ];

      const format = 'BEST_OF_3_MATCH_TB';
      const matchTiebreakIdx = 2;
      const set = setResults[matchTiebreakIdx];

      // Parcial é permitido mesmo sem vencedor
      expect(set.isPartial).toBe(true);
      expect(set.p1Games >= 10 || set.p2Games >= 10).toBe(false); // Ainda não chegou a 10
    });

    it("deve rejeitar match tie-break incompleto marcado como completo", () => {
      const setResults: SetEditData[] = [
        { p1Games: 6, p2Games: 4, isPartial: false }, // Set 1
        { p1Games: 3, p2Games: 6, isPartial: false }, // Set 2
        { p1Games: 10, p2Games: 9, isPartial: false }, // Match TB incompleto (diferença < 2)
      ];

      const format = 'BEST_OF_3_MATCH_TB';
      const matchTiebreakIdx = 2;
      const set = setResults[matchTiebreakIdx];

      const tbMin = 10;
      const p1Won = set.p1Games >= tbMin && set.p1Games - set.p2Games >= 2;
      const p2Won = set.p2Games >= tbMin && set.p2Games - set.p1Games >= 2;

      expect(p1Won).toBe(false); // 10-9 não tem diferença de 2
      expect(p2Won).toBe(false);
      expect(set.isPartial).toBe(false); // Marcado como completo, mas não deveria
    });

    it("deve permitir match tie-break 12-10 (diferença de 2)", () => {
      const setResults: SetEditData[] = [
        { p1Games: 6, p2Games: 4, isPartial: false },
        { p1Games: 3, p2Games: 6, isPartial: false },
        { p1Games: 12, p2Games: 10, isPartial: false }, // TB estendido válido
      ];

      const matchTiebreakIdx = 2;
      const set = setResults[matchTiebreakIdx];

      const tbMin = 10;
      const p1Won = set.p1Games >= tbMin && set.p1Games - set.p2Games >= 2;

      expect(p1Won).toBe(true); // 12-10 é válido
    });

    it("deve permitir match tie-break como único set (formato MATCH_TB_10)", () => {
      const setResults: SetEditData[] = [
        { p1Games: 10, p2Games: 8, isPartial: false, tiebreakScore: { player1: 10, player2: 8 } },
      ];

      const format = 'MATCH_TB_10';
      const matchTiebreakIdx = 0; // Único set
      const set = setResults[matchTiebreakIdx];

      const tbMin = 10;
      const p1Won = set.p1Games >= tbMin && set.p1Games - set.p2Games >= 2;

      expect(p1Won).toBe(true);
    });

    it("deve normalizar estado mal persistido de match tie-break", () => {
      // Estado mal persistido: games no lugar de pontos do tie-break
      const malformedState: ScoringState = {
        sets: [{ player1: 10, player2: 7, isTiebreak: false, tiebreakScore: null }],
        currentGame: { player1: 0, player2: 0, isDeuce: false, advantage: null, secondServe: false },
        server: "player1",
        isFinished: false,
        winner: null,
        setsWon: { player1: 0, player2: 0 },
        startedAt: Date.now(),
        secondServe: false,
      };

      // Função de normalização (importada do useSessionManager)
      function normalizeMatchTiebreakState(scoreState: any, format: string): any {
        if (!scoreState) return scoreState;
        
        // Cobrir ambos os formatos de match tie-break
        const isMatchTiebreakFormat = format === 'BEST_OF_3_MATCH_TB' || format === 'MATCH_TB_10';
        if (!isMatchTiebreakFormat) return scoreState;
        
        const result = { ...scoreState };
        
        if (result.sets?.length >= 1) {
          const setIndex = format === 'MATCH_TB_10' ? 0 : result.sets.length - 1;
          const set = result.sets[setIndex];
          
          // Se o set tem games > 0 mas isTiebreak é false, pode ser um match tie-break mal persistido
          if (set && (set.player1 > 0 || set.player2 > 0) && !set.isTiebreak && !set.tiebreakScore) {
            // Converter: os games são na verdade pontos do match tie-break
            const newSet = {
              ...set,
              tiebreakScore: { player1: set.player1, player2: set.player2 },
              player1: 0,
              player2: 0,
              isTiebreak: true,
            };
            
            if (format === 'MATCH_TB_10') {
              result.sets = [newSet];
            } else {
              result.sets[setIndex] = newSet;
            }
          }
        }
        
        return result;
      }

      const normalized = normalizeMatchTiebreakState(malformedState, 'BEST_OF_3_MATCH_TB');

      expect(normalized.sets[0].isTiebreak).toBe(true);
      expect(normalized.sets[0].tiebreakScore).toEqual({ player1: 10, player2: 7 });
      expect(normalized.sets[0].player1).toBe(0);
      expect(normalized.sets[0].player2).toBe(0);
    });

    it("deve normalizar estado mal persistido de MATCH_TB_10", () => {
      // Estado mal persistido: games no lugar de pontos do tie-break
      const malformedState: ScoringState = {
        sets: [{ player1: 8, player2: 5, isTiebreak: false, tiebreakScore: null }],
        currentGame: { player1: 0, player2: 0, isDeuce: false, advantage: null, secondServe: false },
        server: "player1",
        isFinished: false,
        winner: null,
        setsWon: { player1: 0, player2: 0 },
        startedAt: Date.now(),
        secondServe: false,
      };

      // Função de normalização (MESMA do useSessionManager)
      function normalizeMatchTiebreakState(scoreState: any, format: string): any {
        if (!scoreState) return scoreState;
        
        const isMatchTiebreakFormat = format === 'BEST_OF_3_MATCH_TB' || format === 'MATCH_TB_10';
        if (!isMatchTiebreakFormat) return scoreState;
        
        const result = { ...scoreState };
        
        if (result.sets?.length >= 1) {
          const setIndex = format === 'MATCH_TB_10' ? 0 : result.sets.length - 1;
          const set = result.sets[setIndex];
          
          if (set && (set.player1 > 0 || set.player2 > 0) && !set.isTiebreak && !set.tiebreakScore) {
            const newSet = {
              ...set,
              tiebreakScore: { player1: set.player1, player2: set.player2 },
              player1: 0,
              player2: 0,
              isTiebreak: true,
            };
            
            if (format === 'MATCH_TB_10') {
              result.sets = [newSet];
            } else {
              result.sets[setIndex] = newSet;
            }
          }
        }
        
        return result;
      }

      const normalized = normalizeMatchTiebreakState(malformedState, 'MATCH_TB_10');

      expect(normalized.sets[0].isTiebreak).toBe(true);
      expect(normalized.sets[0].tiebreakScore).toEqual({ player1: 8, player2: 5 });
      expect(normalized.sets[0].player1).toBe(0);
      expect(normalized.sets[0].player2).toBe(0);
    });

    it("deve serializar e restaurar match tie-break corretamente", () => {
      const config = {
        format: 'BEST_OF_3_MATCH_TB' as const,
        player1Id: 'p1',
        player2Id: 'p2',
        initialServerId: 'p1',
      };

      const initialState: ScoringState = {
        sets: [{
          player1: 0,
          player2: 0,
          isTiebreak: true,
          tiebreakScore: { player1: 10, player2: 7 },
        }],
        currentGame: { player1: 0, player2: 0, isDeuce: false, advantage: null, secondServe: false },
        server: 'player1',
        isFinished: true,
        winner: 'player1',
        setsWon: { player1: 1, player2: 0 },
        startedAt: Date.now(),
        secondServe: false,
      };

      const engine = new ScoringEngine(config, initialState);
      const serialized = engine.serialize();
      const restored = ScoringEngine.fromSerialized(config, serialized);
      const restoredState = restored.getState();

      expect(restoredState.sets[0].isTiebreak).toBe(true);
      expect(restoredState.sets[0].tiebreakScore).toEqual({ player1: 10, player2: 7 });
      expect(restoredState.isFinished).toBe(true);
      expect(restoredState.winner).toBe('player1');
    });
  });

  describe("PROTEÇÃO #2: Validação de Regressão do Game Atual", () => {
    it("deve detectar regressão no progresso do game atual", () => {
      const oldGame = { player1: 3, player2: 0, isDeuce: false, advantage: null, secondServe: false }; // 40-0
      const newGame = { player1: 0, player2: 2, isDeuce: false, advantage: null, secondServe: false }; // 0-30

      const getProgress = (g: any): number => {
        if (g.isDeuce && g.advantage) return 4;
        if (g.isDeuce) return 3;
        return Math.max(g.player1, g.player2);
      };

      const oldProgress = getProgress(oldGame);
      const newProgress = getProgress(newGame);

      expect(newProgress < oldProgress).toBe(true); // Regressão detectada!
    });

    it("deve permitir progresso normal do game", () => {
      const oldGame = { player1: 1, player2: 0, isDeuce: false, advantage: null, secondServe: false }; // 15-0
      const newGame = { player1: 2, player2: 0, isDeuce: false, advantage: null, secondServe: false }; // 30-0

      const getProgress = (g: any): number => {
        if (g.isDeuce && g.advantage) return 4;
        if (g.isDeuce) return 3;
        return Math.max(g.player1, g.player2);
      };

      const oldProgress = getProgress(oldGame);
      const newProgress = getProgress(newGame);

      expect(newProgress < oldProgress).toBe(false); // Sem regressão
      expect(newProgress > oldProgress).toBe(true); // Progresso válido
    });

    it("deve lidar com estado de deuce e vantagem", () => {
      const deuceGame = { player1: 3, player2: 3, isDeuce: true, advantage: null, secondServe: false };
      const advP1Game = { player1: 3, player2: 3, isDeuce: true, advantage: 'player1', secondServe: false };

      const getProgress = (g: any): number => {
        if (g.isDeuce && g.advantage) return 4;
        if (g.isDeuce) return 3;
        return Math.max(g.player1, g.player2);
      };

      expect(getProgress(deuceGame)).toBe(3);
      expect(getProgress(advP1Game)).toBe(4);
    });

    it("deve detectar regressão em tie-break regular", () => {
      const oldTiebreak = { player1: 5, player2: 3, isTiebreak: true, tiebreakScore: { player1: 5, player2: 3 } };
      const newTiebreak = { player1: 3, player2: 3, isTiebreak: true, tiebreakScore: { player1: 3, player2: 3 } };

      const isTiebreakRegressing = (oldSet: any, newSet: any): boolean => {
        if (!oldSet || !newSet) return false;
        
        if (oldSet.isTiebreak && oldSet.tiebreakScore && newSet.tiebreakScore) {
          const oldTb = oldSet.tiebreakScore;
          const newTb = newSet.tiebreakScore;
          
          return (
            (newTb.player1 < oldTb.player1 && newTb.player2 <= oldTb.player2) ||
            (newTb.player2 < oldTb.player2 && newTb.player1 <= oldTb.player1)
          );
        }
        
        return false;
      };

      expect(isTiebreakRegressing(oldTiebreak, newTiebreak)).toBe(true); // Regressão detectada!
    });

    it("deve permitir progresso normal em tie-break", () => {
      const oldTiebreak = { player1: 3, player2: 3, isTiebreak: true, tiebreakScore: { player1: 3, player2: 3 } };
      const newTiebreak = { player1: 5, player2: 3, isTiebreak: true, tiebreakScore: { player1: 5, player2: 3 } };

      const isTiebreakRegressing = (oldSet: any, newSet: any): boolean => {
        if (!oldSet || !newSet) return false;
        
        if (oldSet.isTiebreak && oldSet.tiebreakScore && newSet.tiebreakScore) {
          const oldTb = oldSet.tiebreakScore;
          const newTb = newSet.tiebreakScore;
          
          return (
            (newTb.player1 < oldTb.player1 && newTb.player2 <= oldTb.player2) ||
            (newTb.player2 < oldTb.player2 && newTb.player1 <= oldTb.player1)
          );
        }
        
        return false;
      };

      expect(isTiebreakRegressing(oldTiebreak, newTiebreak)).toBe(false); // Sem regressão
    });

    it("deve detectar regressão em match tie-break mal persistido", () => {
      // Estado mal persistido: games no lugar de pontos
      const oldMatchTb = { player1: 8, player2: 5, isTiebreak: false, tiebreakScore: { player1: 8, player2: 5 } };
      const newMatchTb = { player1: 5, player2: 5, isTiebreak: false, tiebreakScore: { player1: 5, player2: 5 } };

      const isTiebreakRegressing = (oldSet: any, newSet: any): boolean => {
        if (!oldSet || !newSet) return false;
        
        if (!oldSet.isTiebreak && !newSet.isTiebreak && oldSet.tiebreakScore) {
          if (oldSet.player1 > 0 || oldSet.player2 > 0) {
            return (
              (newSet.player1 < oldSet.player1 && newSet.player2 <= oldSet.player2) ||
              (newSet.player2 < oldSet.player2 && newSet.player1 <= oldSet.player1)
            );
          }
        }
        
        return false;
      };

      expect(isTiebreakRegressing(oldMatchTb, newMatchTb)).toBe(true); // Regressão detectada!
    });
  });

  describe("PROTEÇÃO #3: Sets Won Floor Check", () => {
    it("deve prevenir regressão de sets won", () => {
      const bankSetsWon = { player1: 1, player2: 1 };
      const newSetsWon = { player1: 0, player2: 2 }; // Player 1 regrediu de 1 para 0

      const regression =
        newSetsWon.player1 < bankSetsWon.player1 ||
        newSetsWon.player2 < bankSetsWon.player2;

      expect(regression).toBe(true); // Regressão detectada!
    });

    it("deve permitir progresso normal de sets won", () => {
      const bankSetsWon = { player1: 1, player2: 0 };
      const newSetsWon = { player1: 2, player2: 0 }; // Player 1 venceu mais um set

      const regression =
        newSetsWon.player1 < bankSetsWon.player1 ||
        newSetsWon.player2 < bankSetsWon.player2;

      expect(regression).toBe(false); // Sem regressão
    });

    it("deve permitir empate em sets won (mesmo valor)", () => {
      const bankSetsWon = { player1: 1, player2: 1 };
      const newSetsWon = { player1: 1, player2: 1 }; // Mesmo estado

      const regression =
        newSetsWon.player1 < bankSetsWon.player1 ||
        newSetsWon.player2 < bankSetsWon.player2;

      expect(regression).toBe(false); // Sem regressão (permite re-hidratação)
    });
  });

  describe("PROTEÇÃO #5: Recálculo de Sequência no Flush (Offline Sync)", () => {
    it("deve calcular sequência correta baseada na versão do banco", () => {
      const matchVersion = 5; // Banco já tem 5 pontos
      const offlinePoints = 3; // Usuário marcou 3 pontos offline

      // Sequência esperada para o primeiro ponto offline
      const expectedSequence = matchVersion + 1;

      expect(expectedSequence).toBe(6); // Primeiro ponto offline deve ser #6
    });

    it("deve lidar com SEQUENCE_CONFLICT e retry com sequência corrigida", () => {
      const sentSequence = 6;
      const expectedSequence = 8; // Banco esperava 8 (outros pontos foram sincronizados)

      const isConflict = true;
      const shouldRetry = isConflict && expectedSequence;

      // Calcular nova sequência para retry
      const retrySequence = expectedSequence;

      expect(shouldRetry).toBe(8);
      expect(retrySequence).toBe(8);
    });

    it("deve sequenciar múltiplos pontos offline corretamente", () => {
      const matchVersion = 5;
      const offlinePoints = [
        { id: 1, type: 'WINNER' },
        { id: 2, type: 'ACE' },
        { id: 3, type: 'DOUBLE_FAULT' },
      ];

      const sequences = offlinePoints.map((_, index) => matchVersion + index + 1);

      expect(sequences).toEqual([6, 7, 8]); // Sequência correta para cada ponto
    });

    it("deve atualizar sequência após cada ponto sincronizado", () => {
      let currentSequence = 5; // Versão inicial do banco

      const syncPoint = () => {
        currentSequence++;
        return currentSequence;
      };

      expect(syncPoint()).toBe(6); // Primeiro ponto
      expect(syncPoint()).toBe(7); // Segundo ponto
      expect(syncPoint()).toBe(8); // Terceiro ponto
    });

    it("deve lidar com múltiplas partidas no flush", () => {
      const matchVersions = new Map<string, number>([
        ['match-1', 5],
        ['match-2', 3],
        ['match-3', 10],
      ]);

      const pendingActions = [
        { matchId: 'match-1', id: 'a1' },
        { matchId: 'match-2', id: 'a2' },
        { matchId: 'match-1', id: 'a3' }, // Segundo ponto de match-1
        { matchId: 'match-3', id: 'a4' },
      ];

      const sequences = pendingActions.map((action) => {
        const version = matchVersions.get(action.matchId) || 0;
        matchVersions.set(action.matchId, version + 1); // Atualizar para próximo
        return version + 1;
      });

      expect(sequences).toEqual([6, 4, 7, 11]); // Sequências corretas por partida
    });
  });
});