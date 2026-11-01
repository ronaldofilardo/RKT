/**
 * @jest-environment jsdom
 */

import { renderHook } from '@testing-library/react';
import { useWakeLock } from '../use-wake-lock';

describe('useWakeLock', () => {
  let releaseMock: jest.Mock;
  let requestMock: jest.Mock;
  const originalWakeLock = navigator.wakeLock;

  beforeEach(() => {
    releaseMock = jest.fn().mockResolvedValue(undefined);
    requestMock = jest.fn().mockResolvedValue({
      release: releaseMock,
      addEventListener: jest.fn(),
    });

    Object.defineProperty(navigator, 'wakeLock', {
      value: { request: requestMock },
      configurable: true,
      writable: true,
    });
  });

  afterEach(() => {
    Object.defineProperty(navigator, 'wakeLock', {
      value: originalWakeLock,
      configurable: true,
      writable: true,
    });
  });

  it('não requisita wake lock quando desabilitado', () => {
    renderHook(() => useWakeLock(false));
    expect(requestMock).not.toHaveBeenCalled();
  });

  it('requisita wake lock de tela quando habilitado', async () => {
    renderHook(() => useWakeLock(true));
    expect(requestMock).toHaveBeenCalledWith('screen');
  });

  it('libera o wake lock ao desmontar', async () => {
    const { unmount } = renderHook(() => useWakeLock(true));
    await Promise.resolve(); // aguarda a promise do request
    unmount();
    expect(releaseMock).toHaveBeenCalled();
  });

  it('funciona silenciosamente sem erro quando navigator.wakeLock não existe', () => {
    Object.defineProperty(navigator, 'wakeLock', {
      value: undefined,
      configurable: true,
      writable: true,
    });

    expect(() => {
      renderHook(() => useWakeLock(true));
    }).not.toThrow();
  });

  it('trata rejeição de permissão do wake lock sem quebrar a tela', async () => {
    requestMock.mockRejectedValue(new Error('WakeLock not allowed'));
    expect(() => {
      renderHook(() => useWakeLock(true));
    }).not.toThrow();
  });
});
