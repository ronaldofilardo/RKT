/**
 * @jest-environment jsdom
 */
import { purgeOfflineCaches } from '../offline-storage-purge';

describe('offline-storage-purge.ts', () => {
  it('executa sem lançar exceção em ambiente com IndexedDB mockado', async () => {
    await expect(purgeOfflineCaches()).resolves.not.toThrow();
  });
});

