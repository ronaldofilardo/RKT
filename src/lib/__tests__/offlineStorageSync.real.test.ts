/**
 * @jest-environment jsdom
 */

import {
  acquireLocalStorageLock,
  releaseLocalStorageLock,
  withLocalStorageLock,
  readPendingMatchSyncs,
} from '../offlineStorageSync';

describe('offlineStorageSync - Regressoes Reais', () => {
  beforeEach(() => {
    localStorage.clear();
    releaseLocalStorageLock();
  });

  it('deve adquirir e liberar lock com sucesso', () => {
    const acquiredFirst = acquireLocalStorageLock();
    expect(acquiredFirst).toBe(true);

    // Segunda tentativa consecutiva dentro do TTL deve falhar
    const acquiredSecond = acquireLocalStorageLock();
    expect(acquiredSecond).toBe(false);

    releaseLocalStorageLock();

    // Apos liberar, deve conseguir adquirir novamente
    const acquiredThird = acquireLocalStorageLock();
    expect(acquiredThird).toBe(true);
    releaseLocalStorageLock();
  });

  it('deve executar fn com withLocalStorageLock e liberar o lock no finally', async () => {
    let executed = false;
    const result = await withLocalStorageLock(async () => {
      executed = true;
      return 'ok';
    });

    expect(executed).toBe(true);
    expect(result).toBe('ok');

    // O lock deve ter sido liberado
    expect(acquireLocalStorageLock()).toBe(true);
    releaseLocalStorageLock();
  });

  it('deve retornar array vazio se pendingMatchSyncs nao estiver definido ou for invalido', () => {
    expect(readPendingMatchSyncs()).toEqual([]);

    localStorage.setItem('pendingMatchSyncs', 'invalid-json');
    expect(readPendingMatchSyncs()).toEqual([]);
  });
});
