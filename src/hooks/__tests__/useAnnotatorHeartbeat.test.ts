/** @jest-environment jsdom */
import { renderHook } from '@testing-library/react';
import { useAnnotatorHeartbeat, HEARTBEAT_INTERVAL_MS } from '../useAnnotatorHeartbeat';

describe('useAnnotatorHeartbeat', () => {
  const originalFetch = global.fetch;
  let mockFetch: jest.Mock;

  beforeEach(() => {
    jest.useFakeTimers();
    mockFetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({}) });
    global.fetch = mockFetch;
    Object.defineProperty(navigator, 'onLine', { value: true, configurable: true });
    Object.defineProperty(document, 'hidden', { value: false, configurable: true });
  });

  afterEach(() => {
    jest.useRealTimers();
    global.fetch = originalFetch;
  });

  it('não dispara quando sessionId é nulo ou vazio', () => {
    renderHook(() => useAnnotatorHeartbeat({ matchId: 'm1', sessionId: null }));
    jest.advanceTimersByTime(HEARTBEAT_INTERVAL_MS * 2);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('dispara imediatamente e a cada 20s quando ativo', async () => {
    renderHook(() => useAnnotatorHeartbeat({ matchId: 'm1', sessionId: 's1', isActive: true }));
    expect(mockFetch).toHaveBeenCalledTimes(1);

    await Promise.resolve(); // flush microtasks
    jest.advanceTimersByTime(HEARTBEAT_INTERVAL_MS);
    await Promise.resolve();
    expect(mockFetch).toHaveBeenCalledTimes(2);

    jest.advanceTimersByTime(HEARTBEAT_INTERVAL_MS);
    await Promise.resolve();
    expect(mockFetch).toHaveBeenCalledTimes(3);
  });

  it('pausa disparos quando a aba está oculta (document.hidden === true)', () => {
    Object.defineProperty(document, 'hidden', { value: true, configurable: true });
    renderHook(() => useAnnotatorHeartbeat({ matchId: 'm1', sessionId: 's1', isActive: true }));

    jest.advanceTimersByTime(HEARTBEAT_INTERVAL_MS * 2);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('pausa disparos quando offline (navigator.onLine === false)', () => {
    Object.defineProperty(navigator, 'onLine', { value: false, configurable: true });
    renderHook(() => useAnnotatorHeartbeat({ matchId: 'm1', sessionId: 's1', isActive: true }));

    jest.advanceTimersByTime(HEARTBEAT_INTERVAL_MS * 2);
    expect(mockFetch).not.toHaveBeenCalled();
  });
});
