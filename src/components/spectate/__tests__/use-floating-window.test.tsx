/**
 * @jest-environment jsdom
 */
import { renderHook } from '@testing-library/react';
import { PANEL_WIDTH, useDraggablePosition } from '../use-floating-window';

function setViewport(width: number, height: number) {
  Object.defineProperty(window, 'innerWidth', { configurable: true, value: width });
  Object.defineProperty(window, 'innerHeight', { configurable: true, value: height });
}

describe('useDraggablePosition', () => {
  it('posiciona a 1ª janela no canto superior direito, dentro da tela', () => {
    setViewport(1400, 900);
    const { result } = renderHook(() => useDraggablePosition(0));
    expect(result.current.pos).toEqual({ x: 1400 - PANEL_WIDTH - 24, y: 72 });
  });

  it('escalona janelas seguintes (-32px em x, +32px em y)', () => {
    setViewport(1400, 900);
    const { result } = renderHook(() => useDraggablePosition(2));
    expect(result.current.pos).toEqual({ x: 1400 - PANEL_WIDTH - 24 - 64, y: 72 + 64 });
  });

  it('nunca deixa a janela sair pela esquerda em telas estreitas', () => {
    setViewport(420, 800);
    const { result } = renderHook(() => useDraggablePosition(0));
    expect(result.current.pos.x).toBeGreaterThanOrEqual(0);
  });
});
