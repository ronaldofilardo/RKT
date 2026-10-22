/**
 * @jest-environment jsdom
 *
 * Characterization (R-15) de useCommentOfflineSync pré-unificação de getDb
 * (débito S3 #8): congela enqueue PENDING/retries=0, flush com POST, retry e
 * FAILED na 3ª falha.
 */

import { renderHook, act, waitFor } from '@testing-library/react';

type FakeRecord = Record<string, unknown>;
function createFakeDb() {
  const store = new Map<string, FakeRecord>();
  return {
    __store: store,
    add: jest.fn(async (_s: string, v: FakeRecord) => { store.set(String(v.id), v); }),
    put: jest.fn(async (_s: string, v: FakeRecord) => { store.set(String(v.id), v); }),
    delete: jest.fn(async (_s: string, id: string) => { store.delete(id); }),
    getAllFromIndex: jest.fn(async (_s: string, _i: string, value: string) =>
      Array.from(store.values()).filter((v) => v.status === value)),
  };
}
const fakeDb = createFakeDb();
jest.mock('idb', () => ({ openDB: jest.fn(async () => fakeDb) }));

import { useCommentOfflineSync } from '../useCommentOfflineSync';

const STORE = 'optimistic-comment-queue';
const oneItem = () => Array.from(fakeDb.__store.values())[0];
const enqueue = async (result: { current: ReturnType<typeof useCommentOfflineSync> }) => {
  await act(async () => {
    await result.current.enqueueComment({ matchId: 'm1', type: 'COMMENT', payload: { content: 'x' }, timestamp: 1000 });
  });
};

describe('useCommentOfflineSync — characterization (pré-unificação de getDb)', () => {
  beforeEach(() => {
    fakeDb.__store.clear();
    jest.clearAllMocks();
    global.fetch = jest.fn();
  });

  it('enqueueComment grava PENDING/retries=0 com id UUID', async () => {
    const { result } = renderHook(() => useCommentOfflineSync());
    await enqueue(result);
    expect(fakeDb.add).toHaveBeenCalledWith(STORE, expect.objectContaining({ matchId: 'm1' }));
    expect(oneItem()).toMatchObject({ status: 'PENDING', retries: 0, matchId: 'm1' });
    expect(oneItem().id).toBeTruthy();
  });

  it('flushComments envia o comentário, remove da fila e dispara offline-sync-complete', async () => {
    const dispatched: string[] = [];
    window.addEventListener('offline-sync-complete', (e) => dispatched.push((e as CustomEvent).detail.type));
    (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, json: async () => ({ id: 'c1' }) });
    const { result } = renderHook(() => useCommentOfflineSync());
    await enqueue(result);
    await act(async () => { await result.current.flushComments('token-123'); });
    await waitFor(() => expect(dispatched).toEqual(['comment']));
    expect(global.fetch).toHaveBeenCalledWith('/api/matches/m1/comments', expect.objectContaining({ method: 'POST' }));
    expect(fakeDb.__store.size).toBe(0);
  });

  it('falha no POST: retries incrementa (PENDING) e 3ª falha vira FAILED', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({ ok: false });
    const { result } = renderHook(() => useCommentOfflineSync());
    await enqueue(result);
    for (let i = 0; i < 3; i++) {
      // eslint-disable-next-line no-await-in-loop
      await act(async () => { await result.current.flushComments('token-123'); });
      if (i === 0) expect(oneItem()).toMatchObject({ retries: 1, status: 'PENDING' });
    }
    expect(oneItem()).toMatchObject({ retries: 3, status: 'FAILED' });
  });
});
