const store: Record<string, any> = {};

function createMockIDB() {
  const mockDB = {
    objectStoreNames: { contains: () => true },
    createObjectStore: jest.fn(),
    transaction: jest.fn((_storeName: string, mode: string) => {
      const objectStore = {
        put: jest.fn((data: any) => {
          store[data.tempId] = { ...data };
          return { onsuccess: null as (() => void) | null, onerror: null as (() => void) | null, result: undefined };
        }),
        getAll: jest.fn(() => {
          const req = {
            result: Object.values(store),
            onsuccess: null as (() => void) | null,
            onerror: null as (() => void) | null,
          };
          setTimeout(() => {
            if (req.onsuccess) req.onsuccess();
          }, 0);
          return req;
        }),
        delete: jest.fn((key: string) => {
          delete store[key];
          return { onsuccess: null as (() => void) | null, onerror: null as (() => void) | null };
        }),
        get: jest.fn((key: string) => {
          const req = {
            result: store[key] || null,
            onsuccess: null as (() => void) | null,
            onerror: null as (() => void) | null,
          };
          setTimeout(() => {
            if (req.onsuccess) req.onsuccess();
          }, 0);
          return req;
        }),
      };

      const tx: any = {
        objectStore: () => objectStore,
        oncomplete: null as (() => void) | null,
        onerror: null as (() => void) | null,
      };

      setTimeout(() => {
        if (tx.oncomplete) tx.oncomplete();
      }, 0);

      return tx;
    }),
  };

  const openRequest: any = {
    result: mockDB,
    onupgradeneeded: null,
    onsuccess: null,
    onerror: null,
    error: null,
  };

  setTimeout(() => {
    if (openRequest.onupgradeneeded) openRequest.onupgradeneeded();
    if (openRequest.onsuccess) openRequest.onsuccess();
  }, 0);

  return { mockDB, openRequest };
}

describe('offlineDb', () => {
  let origIndexedDB: any;

  beforeEach(() => {
    jest.resetModules();
    origIndexedDB = (global as any).indexedDB;
    for (const key of Object.keys(store)) delete store[key];
  });

  afterEach(() => {
    (global as any).indexedDB = origIndexedDB;
  });

  function setupMock() {
    const { mockDB, openRequest } = createMockIDB();
    (global as any).indexedDB = {
      open: jest.fn(() => {
        setTimeout(() => {
          if (openRequest.onupgradeneeded) openRequest.onupgradeneeded();
          if (openRequest.onsuccess) openRequest.onsuccess();
        }, 0);
        return openRequest;
      }),
    };
    // Reset the openRequest to use the latest mockDB
    openRequest.result = mockDB;
    return { mockDB, openRequest };
  }

  describe('savePendingMatch', () => {
    it('deve salvar partida pendente no IndexedDB', async () => {
      setupMock();
      const { savePendingMatch } = await import('@/lib/offlineDb');

      await savePendingMatch({
        tempId: 'temp-1',
        matchData: { player1Id: 'p1', player2Id: 'p2' },
        syncStatus: 'PENDING',
        createdAt: Date.now(),
      });
    });
  });

  describe('getPendingMatches', () => {
    it('deve retornar partidas pendentes', async () => {
      setupMock();
      const { savePendingMatch, getPendingMatches } = await import('@/lib/offlineDb');

      await savePendingMatch({
        tempId: 'temp-a',
        matchData: { player1Id: 'p1' },
        syncStatus: 'PENDING',
        createdAt: 1000,
      });

      const results = await getPendingMatches();
      expect(results).toHaveLength(1);
      expect(results[0].tempId).toBe('temp-a');
    });
  });

  describe('deletePendingMatch', () => {
    it('deve deletar partida pendente', async () => {
      setupMock();
      const { savePendingMatch, deletePendingMatch, getPendingMatches } = await import('@/lib/offlineDb');

      await savePendingMatch({
        tempId: 'temp-del',
        matchData: {},
        syncStatus: 'PENDING',
        createdAt: 2000,
      });

      await deletePendingMatch('temp-del');

      const results = await getPendingMatches();
      expect(results.find((r: any) => r.tempId === 'temp-del')).toBeUndefined();
    });
  });

  describe('updatePendingMatchStatus', () => {
    it('deve atualizar status de partida existente', async () => {
      setupMock();
      const { savePendingMatch, updatePendingMatchStatus, getPendingMatches } = await import('@/lib/offlineDb');

      await savePendingMatch({
        tempId: 'temp-upd',
        matchData: {},
        syncStatus: 'PENDING',
        createdAt: 3000,
      });

      await updatePendingMatchStatus('temp-upd', 'SYNCING');

      const results = await getPendingMatches();
      const updated = results.find((r: any) => r.tempId === 'temp-upd');
      expect(updated?.syncStatus).toBe('SYNCING');
    });

    it('não deve falhar ao atualizar partida inexistente', async () => {
      setupMock();
      const { updatePendingMatchStatus } = await import('@/lib/offlineDb');

      await expect(updatePendingMatchStatus('nonexistent', 'FAILED')).resolves.toBeUndefined();
    });
  });
});
