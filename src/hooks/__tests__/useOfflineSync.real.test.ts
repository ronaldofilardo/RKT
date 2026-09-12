/**
 * @jest-environment jsdom
 */

import { renderHook, act } from '@testing-library/react';
import { useOfflineSync } from '../useOfflineSync';

describe('useOfflineSync - Regressoes Reais', () => {
  it('deve inicializar com isOnline=true e reagir aos eventos de online/offline do navegador', () => {
    const { result } = renderHook(() => useOfflineSync());

    expect(result.current.isOnline).toBe(true);
    expect(result.current.isSyncing).toBe(false);
    expect(typeof result.current.enqueue).toBe('function');
    expect(typeof result.current.flush).toBe('function');

    act(() => {
      window.dispatchEvent(new Event('offline'));
    });

    expect(result.current.isOnline).toBe(false);

    act(() => {
      window.dispatchEvent(new Event('online'));
    });

    expect(result.current.isOnline).toBe(true);
  });
});
