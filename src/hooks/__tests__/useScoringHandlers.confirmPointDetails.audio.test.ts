/** @jest-environment jsdom */
jest.mock('@/core/scoring/engine', () => mockEngineModule());
jest.mock('react', () => mockReactModule());

import { audioCtx, flushAsyncTicks, mockEngineModule, mockFetch, mockReactModule } from './scoringHandlersTestKit';
import { act, renderHook } from '@testing-library/react';
import { useScoringHandlers } from '@/hooks/useScoringHandlers';

describe('useScoringHandlers › confirmPointDetails › nota de áudio (regressão TDZ)', () => {
  it('renderiza o hook e chama confirmPointDetails sem ReferenceError de TDZ', () => {
    const ctx = audioCtx();
    expect(() => renderHook(() => useScoringHandlers(ctx))).not.toThrow();
    const { result } = renderHook(() => useScoringHandlers(ctx));
    expect(() =>
      result.current.confirmPointDetails(
        { tipo: 'winner' as const, previewBalls: 5 },
        { blob: new Blob(['x']), durationMs: 1234 },
      ),
    ).not.toThrow();
  });

  it('dispara POST /api/matches/{id}/point ao confirmar detalhes', async () => {
    const { result } = renderHook(() => useScoringHandlers(audioCtx()));
    result.current.confirmPointDetails({ tipo: 'winner' as const, previewBalls: 5 });
    await act(async () => { await flushAsyncTicks(); });
    const calls = mockFetch.mock.calls.filter(([url]) => String(url) === '/api/matches/match-1/point');
    expect(calls).toHaveLength(1);
  });
});
