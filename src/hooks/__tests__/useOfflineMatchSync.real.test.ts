/**
 * @jest-environment jsdom
 */

import { renderHook, act } from '@testing-library/react';
import { useOfflineMatchSync } from '../useOfflineMatchSync';

describe('useOfflineMatchSync - Regressoes Reais', () => {
  it('deve exportar funcao syncPendingMatches e executar com sucesso quando nao ha pendencias', async () => {
    const { result } = renderHook(() => useOfflineMatchSync());

    expect(typeof result.current.syncPendingMatches).toBe('function');

    await act(async () => {
      await result.current.syncPendingMatches();
    });
  });
});
