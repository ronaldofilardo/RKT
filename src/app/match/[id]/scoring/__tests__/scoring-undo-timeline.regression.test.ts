/**
 * @jest-environment jsdom
 */
import { renderHook } from '@testing-library/react';
import { useScoringPageHandlersBridge } from '../useScoringPageHandlersBridge';
import { useScoringHandlers } from '@/hooks/useScoringHandlers';
import type { ScoringPageState } from '../useScoringPageState';

// O bridge só monta os callbacks; devolvemos os próprios args para inspecioná-los.
jest.mock('@/hooks/useScoringHandlers', () => ({
  useScoringHandlers: jest.fn((args: unknown) => args),
}));

type BridgeCallbacks = {
  onUndoComplete: () => void;
  onPointProcessed: () => void;
};

function renderBridge(overrides: Record<string, unknown> = {}) {
  const fetchTimelinePoints = jest.fn();
  const setEngineTick = jest.fn();
  const state = {
    fetchTimelinePoints,
    fetchPointLogAudioMeta: jest.fn(),
    setEngineTick,
    ...overrides,
  } as unknown as ScoringPageState;
  const hook = renderHook(() => useScoringPageHandlersBridge(state));
  return { ...hook, fetchTimelinePoints, setEngineTick, callbacks: hook.result.current as unknown as BridgeCallbacks };
}

describe('scoring: timeline do servidor após undo e sync offline', () => {
  it('undo concluído revalida a timeline do servidor e atualiza o engineTick', () => {
    const { callbacks, fetchTimelinePoints, setEngineTick } = renderBridge();

    callbacks.onUndoComplete();

    expect(fetchTimelinePoints).toHaveBeenCalledTimes(1);
    expect(setEngineTick).toHaveBeenCalledTimes(1);
  });

  it('undo não quebra quando fetchTimelinePoints não está disponível', () => {
    const { callbacks, setEngineTick } = renderBridge({ fetchTimelinePoints: undefined });

    expect(() => callbacks.onUndoComplete()).not.toThrow();
    expect(setEngineTick).toHaveBeenCalledTimes(1);
  });

  it('ponto processado NÃO dispara refetch (apenas o engineTick)', () => {
    const { callbacks, fetchTimelinePoints, setEngineTick } = renderBridge();

    callbacks.onPointProcessed();

    expect(fetchTimelinePoints).not.toHaveBeenCalled();
    expect(setEngineTick).toHaveBeenCalledTimes(1);
  });

  it('fim do flush offline ("offline-sync-complete") revalida a timeline', () => {
    const { fetchTimelinePoints } = renderBridge();

    window.dispatchEvent(new CustomEvent('offline-sync-complete'));

    expect(fetchTimelinePoints).toHaveBeenCalledTimes(1);
  });

  it('remove o listener de sync ao desmontar', () => {
    const { fetchTimelinePoints, unmount } = renderBridge();

    unmount();
    window.dispatchEvent(new CustomEvent('offline-sync-complete'));

    expect(fetchTimelinePoints).not.toHaveBeenCalled();
    expect(useScoringHandlers).toHaveBeenCalled();
  });
});
