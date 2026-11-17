/** @jest-environment jsdom */
jest.mock('@/core/scoring/engine', () => mockUndoEngineModule());
jest.mock('react', () => mockReactModule());

import {
  createUndoContext,
  mockReactModule,
  mockUndoEngineModule,
  undoEngine,
  undoTestSetup,
  undoTestTeardown,
} from './scoringHandlersUndoTestKit';
import { renderHook } from '@testing-library/react';
import { useScoringHandlers } from '@/hooks/useScoringHandlers';

describe('useScoringHandlers - undoLastPoint (persistência PATCH /state)', () => {
  beforeEach(undoTestSetup);
  afterEach(undoTestTeardown);

  it('deve enviar voidPointLogId no PATCH /state atomicamente e NAO fazer chamada avulsa a DELETE', async () => {
    let capturedUrl = '';
    let capturedMethod = '';
    let capturedBody: any = null;

    global.fetch = jest.fn().mockImplementation(async (url: string, init?: RequestInit) => {
      capturedUrl = url;
      capturedMethod = init?.method ?? 'GET';
      capturedBody = init?.body ? JSON.parse(init.body as string) : null;
      return { ok: true, status: 200, json: async () => ({ version: 2 }) };
    });

    const engine = undoEngine({ undoResult: { point: { type: 'WINNER', winnerId: 'p1' } } });
    const ctx = createUndoContext({ engineRef: { current: engine } });

    const { result } = renderHook(() => useScoringHandlers(ctx));
    await result.current.undoLastPoint();

    // Verifica que NÃO houve nenhuma chamada a DELETE /point/
    const deleteCalls = (global.fetch as jest.Mock).mock.calls.filter(
      ([, init]) => init?.method === 'DELETE',
    );
    expect(deleteCalls).toHaveLength(0);

    // Verifica que o PATCH foi feito para a rota de state
    expect(capturedUrl).toContain('/api/matches/match-1/state');
    expect(capturedMethod).toBe('PATCH');
    expect(capturedBody).toHaveProperty('allowScoreEdit', true);
  });
});
