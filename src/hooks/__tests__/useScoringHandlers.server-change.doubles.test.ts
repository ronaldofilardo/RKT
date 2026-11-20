import { createServerChangeService } from '../useScoringHandlers.server-change.service';

describe('createServerChangeService - Duplas doublesSetup persistence', () => {
  it('envia doublesSetup atualizado no payload do persistState para partidas DOUBLES', async () => {
    const mockState = {
      isFinished: false,
      doubles: {
        serveOrder: {
          player1: ['p1p', 'p1'],
          player2: ['p2', 'p2p'],
        },
        receiveDeuce: {
          player1: 'p1',
          player2: 'p2',
        },
      },
    };

    const mockEngine = {
      setGameServer: jest.fn(),
      getState: jest.fn().mockReturnValue(mockState),
    };

    const mockMatch = {
      id: 'm-doubles-1',
      matchType: 'DOUBLES',
      format: 'BEST_OF_3',
      player1Id: 'p1',
      player2Id: 'p2',
      player1PartnerId: 'p1p',
      player2PartnerId: 'p2p',
      doublesSetup: {
        serveOrder: { player1: ['p1', 'p1p'], player2: ['p2', 'p2p'] },
        receiveDeuce: { player1: 'p1', player2: 'p2' },
        changes: [],
      },
    } as any;

    const persistState = jest.fn().mockResolvedValue({ success: true });
    const fetchMatch = jest.fn().mockResolvedValue(undefined);

    const service = createServerChangeService({
      match: mockMatch,
      engineRef: { current: mockEngine as any },
      persistState,
      fetchMatch,
    });

    const result = await service.changeGameServer('p1p');

    expect(result.success).toBe(true);
    expect(mockEngine.setGameServer).toHaveBeenCalledWith('p1p');
    expect(persistState).toHaveBeenCalledWith(
      mockState,
      'server-change',
      expect.objectContaining({
        isManualScoreEdit: true,
        doublesSetup: {
          serveOrder: { player1: ['p1p', 'p1'], player2: ['p2', 'p2p'] },
          receiveDeuce: { player1: 'p1', player2: 'p2' },
          changes: [],
        },
      })
    );
    expect(fetchMatch).toHaveBeenCalledWith(true);
  });
});
