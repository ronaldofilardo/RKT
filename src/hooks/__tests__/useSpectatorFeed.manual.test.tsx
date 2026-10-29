/**
 * @jest-environment jsdom
 */
import { renderHook, act } from '@testing-library/react';
import { useSpectatorFeed } from '../useSpectatorFeed';

const feedResponse = () => ({
  ok: true,
  status: 200,
  json: async () => ({
    status: 'LIVE', rev: 'r1', nextPollInMs: 1000, signal: { ageSeconds: 1 }, rhythm: null,
  }),
});

let fetchMock: jest.Mock;

beforeEach(() => {
  jest.useFakeTimers();
  fetchMock = jest.fn().mockResolvedValue(feedResponse());
  (global as unknown as { fetch: jest.Mock }).fetch = fetchMock;
});
afterEach(() => { jest.useRealTimers(); });

const advance = (ms: number) => act(async () => { await jest.advanceTimersByTimeAsync(ms); });
const flush = () => advance(0);

describe('useSpectatorFeed — modo manual (autoPoll: false)', () => {
  it('busca ao montar e NÃO agenda novo polling', async () => {
    renderHook(() => useSpectatorFeed('m1', { autoPoll: false }));
    await flush();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    await advance(120_000);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('refresh() busca de novo enviando o rev anterior', async () => {
    const { result } = renderHook(() => useSpectatorFeed('m1', { autoPoll: false }));
    await flush();
    await act(async () => { await result.current.refresh(); });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[1][0]).toContain('rev=r1');
    expect(result.current.isRefreshing).toBe(false);
  });
});

describe('useSpectatorFeed — modo automático', () => {
  it('padrão (sem opções): continua com polling no ritmo do servidor', async () => {
    renderHook(() => useSpectatorFeed('m1'));
    await flush();
    await advance(1000);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('minPollMs impõe um piso ao intervalo', async () => {
    renderHook(() => useSpectatorFeed('m1', { autoPoll: true, minPollMs: 15_000 }));
    await flush();
    await advance(14_000);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    await advance(1_000);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
