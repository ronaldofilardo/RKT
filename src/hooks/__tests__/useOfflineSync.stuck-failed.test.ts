/**
 * @jest-environment jsdom
 *
 * Regressão do bug de perda silenciosa de pontos anotados (ACE/dupla
 * falta/rally) presos na fila offline.
 *
 * Antes do fix: flush() só buscava ações com status 'PENDING'. Uma ação
 * que batesse 3 retries virava 'FAILED' e nunca mais era reprocessada —
 * ficava presa no IndexedDB do dispositivo para sempre, e nenhuma tela
 * mostrava isso ao usuário.
 *
 * Depois do fix: flush() também tenta reenviar ações 'FAILED' a cada
 * execução (reconexão, intervalo periódico), e o hook expõe
 * getFailedCount() para a UI poder alertar sobre pontos presos.
 */

import { renderHook, act, waitFor } from '@testing-library/react';

type FakeRecord = Record<string, any>;

function createFakeDb() {
  const store = new Map<string, FakeRecord>();

  return {
    __store: store,
    add: jest.fn(async (_storeName: string, value: FakeRecord) => {
      store.set(value.id, value);
    }),
    put: jest.fn(async (_storeName: string, value: FakeRecord) => {
      store.set(value.id, value);
    }),
    delete: jest.fn(async (_storeName: string, id: string) => {
      store.delete(id);
    }),
    getAllFromIndex: jest.fn(async (_storeName: string, _index: string, value: string) => {
      return Array.from(store.values()).filter((v) => v.status === value);
    }),
  };
}

let fakeDb: ReturnType<typeof createFakeDb>;

jest.mock('idb', () => ({
  openDB: jest.fn(async () => fakeDb),
}));

jest.mock('@/lib/logger', () => ({
  logger: { error: jest.fn(), warn: jest.fn(), log: jest.fn() },
}));

import { useOfflineSync } from '../useOfflineSync';

describe('useOfflineSync — regressão de ações FAILED presas na fila', () => {
  beforeEach(() => {
    fakeDb = createFakeDb();
    global.fetch = jest.fn();
  });

  it('reenvia uma ação FAILED quando flush roda de novo (em vez de ignorá-la para sempre)', async () => {
    fakeDb.__store.set('action-failed-1', {
      id: 'action-failed-1',
      matchId: 'match-1',
      type: 'POINT',
      payload: {
        winnerId: 'p1',
        type: 'ACE',
        rallyDetails: { tipo: 'winner' },
        clientEventId: 'evt-1',
      },
      timestamp: 1000,
      status: 'FAILED',
      retries: 3,
    });

    (global.fetch as jest.Mock).mockImplementation((url: string) => {
      if (url === '/api/matches/match-1') {
        return Promise.resolve({
          ok: true,
          json: async () => ({ version: 5 }),
        });
      }
      // POST do ponto — agora a rede se recuperou e o servidor aceita.
      return Promise.resolve({ ok: true, json: async () => ({}) });
    });

    const { result } = renderHook(() => useOfflineSync());

    await act(async () => {
      await result.current.flush('token-123');
    });

    // A ação FAILED deve ter sido tentada (e removida da fila ao suceder),
    // não simplesmente ignorada.
    expect(fakeDb.__store.has('action-failed-1')).toBe(false);
    expect(
      (global.fetch as jest.Mock).mock.calls.some(([url]) => url === '/api/matches/match-1/point'),
    ).toBe(true);
  });

  it('getFailedCount reporta ações presas para a UI poder alertar o usuário', async () => {
    fakeDb.__store.set('action-failed-1', {
      id: 'action-failed-1',
      matchId: 'match-1',
      type: 'POINT',
      payload: { winnerId: 'p1', type: 'DOUBLE_FAULT' },
      timestamp: 1000,
      status: 'FAILED',
      retries: 3,
    });
    fakeDb.__store.set('action-pending-1', {
      id: 'action-pending-1',
      matchId: 'match-1',
      type: 'POINT',
      payload: { winnerId: 'p1', type: 'WINNER' },
      timestamp: 2000,
      status: 'PENDING',
      retries: 0,
    });

    const { result } = renderHook(() => useOfflineSync());

    let count = -1;
    await act(async () => {
      count = await result.current.getFailedCount();
    });

    expect(count).toBe(1);
  });

  it('dispara o evento offline-sync-stuck quando ainda restam ações FAILED após o flush', async () => {
    fakeDb.__store.set('action-failed-1', {
      id: 'action-failed-1',
      matchId: 'match-1',
      type: 'POINT',
      payload: { winnerId: 'p1', type: 'ACE' },
      timestamp: 1000,
      status: 'FAILED',
      retries: 3,
    });

    // Servidor continua indisponível — a ação segue falhando.
    (global.fetch as jest.Mock).mockImplementation((url: string) => {
      if (url === '/api/matches/match-1') {
        return Promise.resolve({ ok: true, json: async () => ({ version: 5 }) });
      }
      return Promise.resolve({ ok: false, json: async () => ({}) });
    });

    const listener = jest.fn();
    window.addEventListener('offline-sync-stuck', listener);

    const { result } = renderHook(() => useOfflineSync());

    await act(async () => {
      await result.current.flush('token-123');
    });

    await waitFor(() => {
      expect(listener).toHaveBeenCalled();
    });

    window.removeEventListener('offline-sync-stuck', listener);
  });
});
