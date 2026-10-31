/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import type { SpectatorMarker, SpectatorPoint } from '@/core/spectate';
import { SpectatorTimeline } from '../SpectatorTimeline';

function point(seq: number): SpectatorPoint {
  return {
    id: `p${seq}`,
    seq,
    setNumber: 1,
    gameNumber: seq,
    scoreAfter: '',
    winnerSide: 'side1',
    serverSide: 'side1',
    type: 'ACE',
    details: null,
    isBreakPoint: false,
    receivedLate: false,
  } as SpectatorPoint;
}

describe('SpectatorTimeline — aviso de ajuste de placar no momento exato', () => {
  const marker: SpectatorMarker = {
    kind: 'SCORE_EDIT',
    at: '2026-10-30T12:00:00.000Z',
    description: 'Placar ajustado manualmente',
    afterSeq: 2,
    from: '3-3 · game 0-0',
    to: '3-5 · game 0-40',
  };

  it('intercala o aviso entre o ponto 2 e o ponto 3 (lista do mais novo para o mais antigo)', () => {
    const { container } = render(
      <SpectatorTimeline points={[point(1), point(2), point(3)]} side1Label="Ana" side2Label="Bia" markers={[marker]} />,
    );
    const items = Array.from((container.firstChild as HTMLElement).children);
    // ordem exibida: ponto 3, AVISO, ponto 2, ponto 1
    expect(items).toHaveLength(4);
    expect(items[1]).toHaveAttribute('data-testid', 'timeline-marker');
    expect(screen.getByText(/3-3 · game 0-0/)).toBeInTheDocument();
    expect(screen.getByText(/3-5 · game 0-40/)).toBeInTheDocument();
  });

  it('cada ajuste vira um aviso próprio na posição em que ocorreu', () => {
    const second: SpectatorMarker = { ...marker, at: '2026-10-30T12:05:00.000Z', afterSeq: 3, from: '3-5', to: '4-5' };
    render(
      <SpectatorTimeline points={[point(1), point(2), point(3)]} side1Label="Ana" side2Label="Bia" markers={[marker, second]} />,
    );
    expect(screen.getAllByTestId('timeline-marker')).toHaveLength(2);
  });
});
