import { ScoringEngine } from '../engine';
import { getPointWinnerDetails } from '@/components/scoring/point-details-modal.helpers';
import { buildTransitionUpdateData } from '@/services/matchService.operations.helpers';

describe('Regression Tests: Server Resolution & Point Winner Role (Issue cmv3oofu3000617f2o0qfowit)', () => {
  const p1Id = 'cmv3oofu3000617f2o0qfowit_p1'; // Théo Ferreira
  const p2Id = 'cmv3oofu3000617f2o0qfowit_p2'; // Bruno Sormani
  const config = {
    format: 'BEST_OF_3' as const,
    player1Id: p1Id,
    player2Id: p2Id,
    initialServerId: p2Id, // Bruno é o sacador inicial
  };

  describe('1. ScoringEngine.fromSerialized saneamento de server', () => {
    it('corrige state.server quando salvo com o CUID do jogador 2', () => {
      const corruptedSerialized = JSON.stringify({
        state: {
          sets: [{ player1: 0, player2: 0, isTiebreak: false, tiebreakScore: null }],
          currentGame: { player1: 0, player2: 40, isDeuce: false, advantage: null, secondServe: false },
          server: p2Id, // Corrompido com ID do Bruno em vez de 'player2'
          isFinished: false,
          winner: null,
          setsWon: { player1: 0, player2: 0 },
        },
        history: [],
      });

      const engine = ScoringEngine.fromSerialized(config, corruptedSerialized);
      expect(engine.getServer()).toBe('player2');
    });

    it('corrige state.server no Game 1 quando o servidor inicial é player2 mas state veio com player1 por default antigo', () => {
      const desyncedSerialized = JSON.stringify({
        state: {
          sets: [{ player1: 0, player2: 0, isTiebreak: false, tiebreakScore: null }],
          currentGame: { player1: 0, player2: 40, isDeuce: false, advantage: null, secondServe: false },
          server: 'player1', // Estava como player1 por fallback de criação
          isFinished: false,
          winner: null,
          setsWon: { player1: 0, player2: 0 },
        },
        history: [],
      });

      const engine = ScoringEngine.fromSerialized(config, desyncedSerialized);
      // Como 0 games foram concluídos no set 1 e initialServerId é p2, o sacador do game 1 DEVE ser player2
      expect(engine.getServer()).toBe('player2');
    });
  });

  describe('2. Modal de Detalhes do Ponto (getPointWinnerDetails)', () => {
    it('identifica Bruno (player2) como SACADOR quando Bruno é o sacador atual e ganha o ponto', () => {
      const { vencedor, winnerName } = getPointWinnerDetails(
        'player2', // Bruno marcou o ponto
        'player2', // Bruno é o sacador atual
        'Théo Ferreira',
        'Bruno Sormani'
      );

      expect(vencedor).toBe('sacador');
      expect(winnerName).toBe('Bruno Sormani');
    });

    it('identifica Théo (player1) como DEVOLVEDOR quando Bruno está sacando e Théo ganha o ponto', () => {
      const { vencedor, winnerName } = getPointWinnerDetails(
        'player1', // Théo marcou o ponto
        'player2', // Bruno é o sacador atual
        'Théo Ferreira',
        'Bruno Sormani'
      );

      expect(vencedor).toBe('devolvedor');
      expect(winnerName).toBe('Théo Ferreira');
    });
  });

  describe('3. buildTransitionUpdateData sincronização de server com initialServerId', () => {
    it('atualiza scoreState.server para player2 quando initialServerId é player2 e nenhum scoreState explícito é fornecido', () => {
      const existingMatch = {
        player1Id: p1Id,
        player2Id: p2Id,
        scoreState: {
          sets: [],
          currentGame: { player1: 0, player2: 0 },
          server: 'player1', // Padrão antes do setup
        },
      };

      const updateData = buildTransitionUpdateData('IN_PROGRESS', p2Id, undefined, existingMatch);
      expect(updateData.initialServerId).toBe(p2Id);
      expect((updateData.scoreState as any).server).toBe('player2');
    });
  });
});
