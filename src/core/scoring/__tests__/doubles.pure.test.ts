import {
  sideOfPlayer,
  membersOf,
  otherMember,
  courtSide,
  getServingMemberId,
  advanceServeIndex,
  getReceiverMemberId,
  isNoAdDecidingPoint,
  deriveArrangementFromGames,
  validateDoublesArrangement,
} from '../doubles';
import type { DoublesConfig, ScoringState } from '../types';

describe('src/core/scoring/doubles.ts — Funções Puras de Duplas', () => {
  const config: DoublesConfig = {
    members: {
      player1: ['p1_titular', 'p1_parceiro'],
      player2: ['p2_titular', 'p2_parceiro'],
    },
    initial: {
      serveOrder: {
        player1: ['p1_titular', 'p1_parceiro'],
        player2: ['p2_titular', 'p2_parceiro'],
      },
      receiveDeuce: {
        player1: 'p1_titular',
        player2: 'p2_titular',
      },
    },
  };

  const createBaseState = (overrides: Partial<ScoringState> = {}): ScoringState => ({
    sets: [{ player1: 0, player2: 0, isTiebreak: false, tiebreakScore: null }],
    currentGame: { player1: 0, player2: 0, isDeuce: false, advantage: null, secondServe: false },
    server: 'player1',
    isFinished: false,
    winner: null,
    setsWon: { player1: 0, player2: 0 },
    startedAt: 1700000000000,
    secondServe: false,
    doubles: {
      serveOrder: {
        player1: ['p1_titular', 'p1_parceiro'],
        player2: ['p2_titular', 'p2_parceiro'],
      },
      serveIndex: { player1: 0, player2: 0 },
      receiveDeuce: {
        player1: 'p1_titular',
        player2: 'p2_titular',
      },
    },
    ...overrides,
  });

  describe('sideOfPlayer, membersOf, otherMember', () => {
    it('identifica corretamente o lado para titular e parceiro', () => {
      expect(sideOfPlayer(config, 'p1_titular')).toBe('player1');
      expect(sideOfPlayer(config, 'p1_parceiro')).toBe('player1');
      expect(sideOfPlayer(config, 'p2_titular')).toBe('player2');
      expect(sideOfPlayer(config, 'p2_parceiro')).toBe('player2');
      expect(sideOfPlayer(config, 'desconhecido')).toBeNull();
    });

    it('retorna os membros de um lado', () => {
      expect(membersOf(config, 'player1')).toEqual(['p1_titular', 'p1_parceiro']);
      expect(membersOf(config, 'player2')).toEqual(['p2_titular', 'p2_parceiro']);
    });

    it('retorna o outro parceiro da dupla', () => {
      expect(otherMember(config, 'player1', 'p1_titular')).toBe('p1_parceiro');
      expect(otherMember(config, 'player1', 'p1_parceiro')).toBe('p1_titular');
      expect(otherMember(config, 'player2', 'p2_titular')).toBe('p2_parceiro');
    });
  });

  describe('courtSide (lado da quadra)', () => {
    it('determina quadra em game normal por contagem de pontos', () => {
      const state = createBaseState();
      expect(courtSide(state)).toBe('deuce'); // 0-0

      state.currentGame.player1 = 1;
      expect(courtSide(state)).toBe('ad'); // 15-0 (1 ponto)

      state.currentGame.player2 = 1;
      expect(courtSide(state)).toBe('deuce'); // 15-15 (2 pontos)

      state.currentGame.player1 = 3;
      state.currentGame.player2 = 2;
      expect(courtSide(state)).toBe('ad'); // 40-30 (5 pontos)
    });

    it('em deuce/vantagem, 40-40 é deuce e vantagem é ad', () => {
      const state = createBaseState({
        currentGame: { player1: 3, player2: 3, isDeuce: true, advantage: null, secondServe: false },
      });
      expect(courtSide(state)).toBe('deuce');

      state.currentGame.advantage = 'player1';
      expect(courtSide(state)).toBe('ad');

      state.currentGame.advantage = null;
      expect(courtSide(state)).toBe('deuce');
    });

    it('em tiebreak, alterna a cada ponto jogado', () => {
      const state = createBaseState({
        sets: [{
          player1: 6,
          player2: 6,
          isTiebreak: true,
          tiebreakScore: { player1: 0, player2: 0 },
        }],
      });
      expect(courtSide(state)).toBe('deuce'); // Ponto 1 (0 jogados)

      state.sets[0].tiebreakScore = { player1: 1, player2: 0 };
      expect(courtSide(state)).toBe('ad'); // Ponto 2 (1 jogado)

      state.sets[0].tiebreakScore = { player1: 1, player2: 1 };
      expect(courtSide(state)).toBe('deuce'); // Ponto 3 (2 jogados)
    });
  });

  describe('getServingMemberId', () => {
    it('em game normal, retorna o sacador corrente pelo serveIndex da dupla', () => {
      const state = createBaseState({ server: 'player1' });
      expect(getServingMemberId(state, config)).toBe('p1_titular');

      state.doubles!.serveIndex.player1 = 1;
      expect(getServingMemberId(state, config)).toBe('p1_parceiro');

      state.server = 'player2';
      expect(getServingMemberId(state, config)).toBe('p2_titular');
    });

    it('no tiebreak, segue rotação canônica 1, 2, 2, 2... entre os 4 atletas', () => {
      // Dupla 1 (p1_titular, p1_parceiro), Dupla 2 (p2_titular, p2_parceiro)
      // Ordem esperada:
      // Ponto 1 (t=0): Dupla 1, p1_titular
      // Ponto 2 (t=1): Dupla 2, p2_titular
      // Ponto 3 (t=2): Dupla 2, p2_titular
      // Ponto 4 (t=3): Dupla 1, p1_parceiro
      // Ponto 5 (t=4): Dupla 1, p1_parceiro
      // Ponto 6 (t=5): Dupla 2, p2_parceiro
      // Ponto 7 (t=6): Dupla 2, p2_parceiro
      // Ponto 8 (t=7): Dupla 1, p1_titular
      const expectedServers = [
        'p1_titular',  // t=0
        'p2_titular',  // t=1
        'p2_titular',  // t=2
        'p1_parceiro', // t=3
        'p1_parceiro', // t=4
        'p2_parceiro', // t=5
        'p2_parceiro', // t=6
        'p1_titular',  // t=7
      ];

      const state = createBaseState({
        server: 'player1',
        sets: [{
          player1: 6,
          player2: 6,
          isTiebreak: true,
          tiebreakScore: { player1: 0, player2: 0 },
        }],
      });

      for (let t = 0; t < expectedServers.length; t++) {
        // Simula a contagem de pontos acumulada t
        state.sets[0].tiebreakScore = { player1: t, player2: 0 };
        // No tiebreak do RKT, server alterna conforme a fórmula do tiebreak:
        // total % 2 === 0 ? server : (server === 'player1' ? 'player2' : 'player1')
        // Vamos computar qual lado está sacando no ponto t:
        const block = Math.floor((t + 1) / 2);
        state.server = block % 2 === 0 ? 'player1' : 'player2';

        const serverId = getServingMemberId(state, config);
        expect(serverId).toBe(expectedServers[t]);
      }
    });
  });

  describe('advanceServeIndex', () => {
    it('alterna o índice da dupla que sacou entre 0 e 1', () => {
      const state = createBaseState();
      expect(state.doubles!.serveIndex.player1).toBe(0);

      advanceServeIndex(state, 'player1');
      expect(state.doubles!.serveIndex.player1).toBe(1);

      advanceServeIndex(state, 'player1');
      expect(state.doubles!.serveIndex.player1).toBe(0);

      // Dupla 2 não foi afetada
      expect(state.doubles!.serveIndex.player2).toBe(0);
    });
  });

  describe('getReceiverMemberId', () => {
    it('retorna o atleta de iguais quando quadra é deuce e parceiro quando é ad', () => {
      const state = createBaseState({ server: 'player1' }); // player2 recebe
      // 0-0 -> deuce -> p2_titular
      expect(getReceiverMemberId(state, config)).toBe('p2_titular');

      // 15-0 -> ad -> p2_parceiro
      state.currentGame.player1 = 1;
      expect(getReceiverMemberId(state, config)).toBe('p2_parceiro');
    });

    it('respeita override quando válido para a dupla receptora', () => {
      const state = createBaseState({ server: 'player1' });
      // Mesmo em quadra deuce, override para p2_parceiro é aceito
      expect(getReceiverMemberId(state, config, 'p2_parceiro')).toBe('p2_parceiro');
    });
  });

  describe('isNoAdDecidingPoint', () => {
    it('identifica corretamente ponto decisivo em formatos no-ad', () => {
      const state = createBaseState();
      expect(isNoAdDecidingPoint(state, 'BEST_OF_3_NO_AD')).toBe(false);

      state.currentGame = { player1: 3, player2: 3, isDeuce: true, advantage: null, secondServe: false };
      expect(isNoAdDecidingPoint(state, 'BEST_OF_3_NO_AD')).toBe(true);

      // Em formato tradicional com vantagem, não é ponto decisivo
      expect(isNoAdDecidingPoint(state, 'BEST_OF_3')).toBe(false);
    });
  });

  describe('deriveArrangementFromGames e validateDoublesArrangement', () => {
    it('deriva arranjo coerente com paridade de games', () => {
      const arr = deriveArrangementFromGames(3, config.initial);
      expect(arr.serveIndex.player1).toBe(0); // ceil(3/2) = 2 -> 2 % 2 = 0
      expect(arr.serveIndex.player2).toBe(1); // floor(3/2) = 1 -> 1 % 2 = 1
    });

    it('valida arranjo correto e rejeita arranjo inválido', () => {
      const valid = createBaseState().doubles!;
      expect(validateDoublesArrangement(config, valid)).toBe(true);

      const invalidMembers = {
        ...valid,
        serveOrder: {
          ...valid.serveOrder,
          player1: ['outro_id', 'p1_parceiro'] as [string, string],
        },
      };
      expect(validateDoublesArrangement(config, invalidMembers)).toBe(false);
    });
  });
});
