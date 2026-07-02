import { emitMatchEvent, subscribeMatch } from '@/lib/match-events';

describe('match-events', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('deve emitir e receber evento via subscribe', () => {
    const handler = jest.fn();
    subscribeMatch('match-1', handler);

    emitMatchEvent('match-1', 'point_scored', { score: '15-0' });

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'point_scored',
        matchId: 'match-1',
        data: { score: '15-0' },
      })
    );
  });

  it('deve incluir timestamp no evento', () => {
    const handler = jest.fn();
    subscribeMatch('match-1', handler);
    emitMatchEvent('match-1', 'state_changed', {});

    const event = handler.mock.calls[0][0];
    expect(event.timestamp).toBeGreaterThan(0);
  });

  it('deve isolar eventos por matchId', () => {
    const handler1 = jest.fn();
    const handler2 = jest.fn();
    subscribeMatch('match-1', handler1);
    subscribeMatch('match-2', handler2);

    emitMatchEvent('match-1', 'point_scored', {});

    expect(handler1).toHaveBeenCalledTimes(1);
    expect(handler2).not.toHaveBeenCalled();
  });

  it('deve parar de receber após cleanup', () => {
    const handler = jest.fn();
    const cleanup = subscribeMatch('match-1', handler);
    cleanup();

    emitMatchEvent('match-1', 'point_scored', {});

    expect(handler).not.toHaveBeenCalled();
  });
});
