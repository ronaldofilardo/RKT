/**
 * @jest-environment jsdom
 */
import { act, renderHook } from '@testing-library/react';
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

  it('reposiciona dentro da tela quando a janela é redimensionada (zoom)', () => {
    setViewport(1400, 900);
    const { result } = renderHook(() => useDraggablePosition(0));
    act(() => {
      setViewport(800, 600);
      window.dispatchEvent(new Event('resize'));
    });
    expect(result.current.pos.x + PANEL_WIDTH).toBeLessThanOrEqual(800);
    expect(result.current.pos.y).toBeLessThanOrEqual(600 - 48);
  });

  it('em tela mais estreita que o painel, a janela cabe com margem (sem sair pela direita)', () => {
    setViewport(380, 700);
    const { result } = renderHook(() => useDraggablePosition(0));
    expect(result.current.pos.x).toBe(0);
  });
});
