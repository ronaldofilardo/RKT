import { buildEngineConfig } from '../engine-config';

describe('buildEngineConfig', () => {
  it('constrói configuração de simples padrão a partir de dados planos', () => {
    const config = buildEngineConfig({
      format: 'BEST_OF_3',
      player1Id: 'p1',
      player2Id: 'p2',
      initialServerId: 'p1',
    });

    expect(config).toEqual({
      format: 'BEST_OF_3',
      player1Id: 'p1',
      player2Id: 'p2',
      initialServerId: 'p1',
    });
    expect(config.doubles).toBeUndefined();
  });

  it('constrói configuração de simples a partir de objetos aninhados player1 e player2', () => {
    const config = buildEngineConfig({
      format: 'MATCH_TB_10',
      player1: { id: 'p1', name: 'Player 1' },
      player2: { id: 'p2', name: 'Player 2' },
      initialServerId: null,
    });

    expect(config).toEqual({
      format: 'MATCH_TB_10',
      player1Id: 'p1',
      player2Id: 'p2',
      initialServerId: 'p1',
    });
  });

  it('constrói configuração de duplas quando parceiros e setup estão presentes', () => {
    const config = buildEngineConfig({
      matchType: 'DOUBLES',
      format: 'BEST_OF_3',
      player1Id: 'p1',
      player2Id: 'p2',
      player1PartnerId: 'p1_partner',
      player2PartnerId: 'p2_partner',
      initialServerId: 'p1',
      doublesSetup: {
        serveOrder: {
          player1: ['p1', 'p1_partner'],
          player2: ['p2', 'p2_partner'],
        },
        receiveDeuce: {
          player1: 'p1',
          player2: 'p2',
        },
      },
    });

    expect(config.doubles).toBeDefined();
    expect(config.doubles?.members).toEqual({
      player1: ['p1', 'p1_partner'],
      player2: ['p2', 'p2_partner'],
    });
    expect(config.doubles?.initial.serveOrder.player1).toEqual(['p1', 'p1_partner']);
  });
});
