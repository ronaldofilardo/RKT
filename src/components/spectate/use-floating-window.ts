'use client';

import { useEffect, useRef, useState, type PointerEvent } from 'react';

// 400px: o placar (nome 120 + ✓ 24 + 3 sets x 48 + Pts 48 = 336px) precisa caber com padding e barra de rolagem.
export const PANEL_WIDTH = 400;
const DESKTOP_QUERY = '(min-width: 768px)';

/** true em telas >= 768px (popup arrastável); false no celular (bottom-sheet). */
export function useIsDesktop(): boolean {
  const [isDesktop, setIsDesktop] = useState(false);
  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return;
    const mq = window.matchMedia(DESKTOP_QUERY);
    const update = () => setIsDesktop(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);
  return isDesktop;
}

function clampToViewport(x: number, y: number) {
  const maxX = Math.max(0, window.innerWidth - PANEL_WIDTH);
  const maxY = Math.max(0, window.innerHeight - 48);
  return { x: Math.min(Math.max(0, x), maxX), y: Math.min(Math.max(0, y), maxY) };
}

/** Posição inicial escalonada (canto superior direito, cada janela um pouco deslocada). */
function initialPosition(index: number) {
  if (typeof window === 'undefined') return { x: 16, y: 72 };
  return clampToViewport(window.innerWidth - PANEL_WIDTH - 24 - index * 32, 72 + index * 32);
}

/** Arrastar pela barra de título (ignora cliques em botões). */
export function useDraggablePosition(index: number) {
  const [pos, setPos] = useState(() => initialPosition(index));
  const drag = useRef<{ dx: number; dy: number } | null>(null);

  const onPointerDown = (e: PointerEvent<HTMLElement>) => {
    if ((e.target as HTMLElement).closest('button')) return;
    drag.current = { dx: e.clientX - pos.x, dy: e.clientY - pos.y };
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };
  const onPointerMove = (e: PointerEvent<HTMLElement>) => {
    if (!drag.current) return;
    setPos(clampToViewport(e.clientX - drag.current.dx, e.clientY - drag.current.dy));
  };
  const onPointerUp = (e: PointerEvent<HTMLElement>) => {
    drag.current = null;
    e.currentTarget.releasePointerCapture?.(e.pointerId);
  };

  return { pos, handlers: { onPointerDown, onPointerMove, onPointerUp, onPointerCancel: onPointerUp } };
}
