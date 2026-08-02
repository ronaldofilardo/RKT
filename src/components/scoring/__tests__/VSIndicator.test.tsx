/**
 * @jest-environment jsdom
 */
import { describe, it, expect } from '@jest/globals';
import { render } from '@testing-library/react';
import { VSIndicator } from '../VSIndicator';
import type { ScoreState } from '@/core/scoring/types';

function makeScoreState(
  sets: Array<{ player1: number; player2: number; isTiebreak: boolean; tiebreakScore: { player1: number; player2: number } | null }>,
  currentGame: { player1: number; player2: number; isDeuce: boolean; advantage: 'player1' | 'player2' | null }
): ScoreState {
  return {
    sets: sets as any,
    currentGame: currentGame as any,
  };
}

describe('VSIndicator', () => {
  it('deve mostrar VS quando não está em tiebreak ou deuce', () => {
    const scoreState = makeScoreState(
      [{ player1: 2, player2: 1, isTiebreak: false, tiebreakScore: null }],
      { player1: 1, player2: 0, isDeuce: false, advantage: null }
    );

    const { container } = render(<VSIndicator scoreState={scoreState} />);
    expect(container.textContent).toContain('VS');
  });

  it('deve mostrar ícone de raio quando está em deuce', () => {
    const scoreState = makeScoreState(
      [{ player1: 3, player2: 3, isTiebreak: false, tiebreakScore: null }],
      { player1: 3, player2: 3, isDeuce: true, advantage: null }
    );

    const { container } = render(<VSIndicator scoreState={scoreState} />);
    expect(container.textContent).toContain('⚡');
  });

  it('deve mostrar TIE-BREAK quando está em tiebreak', () => {
    const scoreState = makeScoreState(
      [{ player1: 6, player2: 6, isTiebreak: true, tiebreakScore: { player1: 0, player2: 0 } }],
      { player1: 0, player2: 0, isDeuce: false, advantage: null }
    );

    const { container } = render(<VSIndicator scoreState={scoreState} />);
    expect(container.textContent).toContain('TIE-BREAK');
    expect(container.textContent).toContain('🎾');
  });

  it('deve mostrar indicador de troca de sacador no tiebreak', () => {
    const scoreState = makeScoreState(
      [{ player1: 6, player2: 6, isTiebreak: true, tiebreakScore: { player1: 1, player2: 0 } }],
      { player1: 0, player2: 0, isDeuce: false, advantage: null }
    );

    const { container } = render(<VSIndicator scoreState={scoreState} />);
    expect(container.textContent).toContain('Troca em 1pt');
  });

  it('deve mostrar TIE-BREAK no match tiebreak (super tiebreak)', () => {
    const scoreState = makeScoreState(
      [{ player1: 0, player2: 0, isTiebreak: true, tiebreakScore: { player1: 5, player2: 3 } }],
      { player1: 0, player2: 0, isDeuce: false, advantage: null }
    );

    const { container } = render(<VSIndicator scoreState={scoreState} />);
    expect(container.textContent).toContain('TIE-BREAK');
  });

  it('deve retornar VS quando scoreState é null', () => {
    const { container } = render(<VSIndicator scoreState={null} />);
    expect(container.textContent).toContain('VS');
  });
});