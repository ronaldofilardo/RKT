/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { PlayerCard } from '../PlayerCard';
import { GAME_POINTS } from '@/core/scoring/point-utils';

const basePlayer = { id: 'p1', name: 'Jogador A' };
const baseState = {
  sets: [{ player1: 3, player2: 2, isTiebreak: false, tiebreakScore: null }],
  currentGame: { player1: 0, player2: 0, isDeuce: false, advantage: null },
  server: 'player1' as const,
  isFinished: false,
  winner: null,
  setsWon: { player1: 0, player2: 0 },
};

function renderPlayerCard(overrides: Partial<React.ComponentProps<typeof PlayerCard>> = {}) {
  const defaultProps = {
    player: basePlayer,
    side: 'player1' as const,
    scoreState: baseState,
    isServing: false,
    isSetPoint: false,
    isBreakPoint: false,
    isWinner: false,
    onPoint: jest.fn(),
    onSwipeDown: jest.fn(),
    ...overrides,
  };
  return { ...render(<PlayerCard {...defaultProps} />), props: defaultProps };
}

describe('PlayerCard — formatScore', () => {
  it('retorna 0 quando scoreState é null', () => {
    renderPlayerCard({ scoreState: null });
    expect(screen.getByText('0')).toBeInTheDocument();
  });

  it('retorna GAME_POINTS[0] para player1 com 0 pontos', () => {
    renderPlayerCard({ side: 'player1' });
    expect(screen.getByText(GAME_POINTS[0])).toBeInTheDocument();
  });

  it('retorna GAME_POINTS[1] (15) para player1 com 1 ponto', () => {
    renderPlayerCard({
      scoreState: {
        ...baseState,
        currentGame: { ...baseState.currentGame, player1: 1 },
      },
    });
    expect(screen.getByText('15')).toBeInTheDocument();
  });

  it('retorna GAME_POINTS[2] (30) para player1 com 2 pontos', () => {
    renderPlayerCard({
      scoreState: {
        ...baseState,
        currentGame: { ...baseState.currentGame, player1: 2 },
      },
    });
    expect(screen.getByText('30')).toBeInTheDocument();
  });

  it('retorna GAME_POINTS[3] (40) para player1 com 3 pontos', () => {
    renderPlayerCard({
      scoreState: {
        ...baseState,
        currentGame: { ...baseState.currentGame, player1: 3 },
      },
    });
    expect(screen.getByText('40')).toBeInTheDocument();
  });

  it('retorna ADV quando player1 tem vantagem no deuce', () => {
    renderPlayerCard({
      scoreState: {
        ...baseState,
        currentGame: { player1: 0, player2: 0, isDeuce: true, advantage: 'player1' },
      },
    });
    expect(screen.getByText('ADV')).toBeInTheDocument();
  });

  it('retorna 40 quando player1 está em deuce sem vantagem', () => {
    renderPlayerCard({
      scoreState: {
        ...baseState,
        currentGame: { player1: 0, player2: 0, isDeuce: true, advantage: null },
      },
    });
    expect(screen.getByText('40')).toBeInTheDocument();
  });

  it('retorna 40 quando player1 está em deuce mas vantagem é do adversário', () => {
    renderPlayerCard({
      scoreState: {
        ...baseState,
        currentGame: { player1: 0, player2: 0, isDeuce: true, advantage: 'player2' },
      },
    });
    expect(screen.getByText('40')).toBeInTheDocument();
  });

  it('retorna pontos do tiebreak para player1', () => {
    renderPlayerCard({
      scoreState: {
        ...baseState,
        sets: [
          { player1: 6, player2: 6, isTiebreak: true, tiebreakScore: { player1: 5, player2: 3 } },
        ],
        currentGame: { player1: 0, player2: 0, isDeuce: false, advantage: null },
      },
    });
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('retorna pontos do tiebreak para player2', () => {
    renderPlayerCard({
      side: 'player2',
      scoreState: {
        ...baseState,
        sets: [
          { player1: 6, player2: 6, isTiebreak: true, tiebreakScore: { player1: 5, player2: 3 } },
        ],
        currentGame: { player1: 0, player2: 0, isDeuce: false, advantage: null },
      },
    });
    expect(screen.getByText('3')).toBeInTheDocument();
  });
});

describe('PlayerCard — getGameProgress', () => {
  it('retorna 0 para scoreState null', () => {
    const { container } = render(
      <PlayerCard
        player={basePlayer}
        side="player1"
        scoreState={null}
        isServing={false}
        isSetPoint={false}
        isBreakPoint={false}
        isWinner={false}
        onPoint={jest.fn()}
        onSwipeDown={jest.fn()}
      />,
    );
    const bar = container.querySelector('[style*="width: 0%"]');
    expect(bar).toBeInTheDocument();
  });

  it('retorna progresso de 75% quando está em deuce sem vantagem', () => {
    const { container } = render(
      <PlayerCard
        player={basePlayer}
        side="player1"
        scoreState={{
          ...baseState,
          currentGame: { player1: 0, player2: 0, isDeuce: true, advantage: null },
        }}
        isServing={false}
        isSetPoint={false}
        isBreakPoint={false}
        isWinner={false}
        onPoint={jest.fn()}
        onSwipeDown={jest.fn()}
      />,
    );
    const bar = container.querySelector('[style*="width: 75%"]');
    expect(bar).toBeInTheDocument();
  });

  it('retorna progresso de 100% quando tem vantagem', () => {
    const { container } = render(
      <PlayerCard
        player={basePlayer}
        side="player1"
        scoreState={{
          ...baseState,
          currentGame: { player1: 0, player2: 0, isDeuce: true, advantage: 'player1' },
        }}
        isServing={false}
        isSetPoint={false}
        isBreakPoint={false}
        isWinner={false}
        onPoint={jest.fn()}
        onSwipeDown={jest.fn()}
      />,
    );
    const bar = container.querySelector('[style*="width: 100%"]');
    expect(bar).toBeInTheDocument();
  });

  it('retorna progresso baseado no índice do ponto para game normal', () => {
    const { container } = render(
      <PlayerCard
        player={basePlayer}
        side="player1"
        scoreState={{
          ...baseState,
          currentGame: { player1: 2, player2: 0, isDeuce: false, advantage: null },
        }}
        isServing={false}
        isSetPoint={false}
        isBreakPoint={false}
        isWinner={false}
        onPoint={jest.fn()}
        onSwipeDown={jest.fn()}
      />,
    );
    const bar = container.querySelector('[style*="width: 50%"]');
    expect(bar).toBeInTheDocument();
  });
});

describe('PlayerCard — interações', () => {
  it('chama onPoint ao clicar', () => {
    const { props } = renderPlayerCard();
    fireEvent.click(screen.getByRole('button'));
    expect(props.onPoint).toHaveBeenCalledTimes(1);
  });

  it('chama onSwipeDown quando swipe down > 80px', () => {
    const { props, container } = renderPlayerCard();
    const button = container.querySelector('button')!;
    fireEvent.touchStart(button, { touches: [{ clientY: 100 }] });
    fireEvent.touchEnd(button, { changedTouches: [{ clientY: 200 }] });
    expect(props.onSwipeDown).toHaveBeenCalledTimes(1);
  });

  it('chama onPoint quando swipe down < 80px', () => {
    const { props, container } = renderPlayerCard();
    const button = container.querySelector('button')!;
    fireEvent.touchStart(button, { touches: [{ clientY: 100 }] });
    fireEvent.touchEnd(button, { changedTouches: [{ clientY: 150 }] });
    expect(props.onPoint).toHaveBeenCalledTimes(1);
  });

  it('não duplica ponto quando touch seguido de click', () => {
    const { props, container } = renderPlayerCard();
    const button = container.querySelector('button')!;
    fireEvent.touchStart(button, { touches: [{ clientY: 100 }] });
    fireEvent.touchEnd(button, { changedTouches: [{ clientY: 150 }] });
    fireEvent.click(button);
    expect(props.onPoint).toHaveBeenCalledTimes(1);
  });

  it('desabilita o botão quando disabled', () => {
    renderPlayerCard({ disabled: true });
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('não mostra "Toque para marcar ponto" quando disabled', () => {
    renderPlayerCard({ disabled: true });
    expect(screen.queryByText('Toque para marcar ponto')).not.toBeInTheDocument();
  });

  it('não mostra "Toque para marcar ponto" quando isWinner', () => {
    renderPlayerCard({ isWinner: true });
    expect(screen.queryByText('Toque para marcar ponto')).not.toBeInTheDocument();
  });
});

describe('PlayerCard — setsWon', () => {
  it('renderiza bolinhas de sets ganhos', () => {
    renderPlayerCard({
      scoreState: {
        ...baseState,
        setsWon: { player1: 2, player2: 1 },
      },
    });
    const dots = screen.getAllByRole('button')[0].querySelectorAll('.rounded-full.bg-gray-900');
    expect(dots.length).toBe(2);
  });

  it('mostra 0 bolinhas quando setsWon é 0', () => {
    renderPlayerCard({
      scoreState: {
        ...baseState,
        setsWon: { player1: 0, player2: 0 },
      },
    });
    const dots = screen.getAllByRole('button')[0].querySelectorAll('.rounded-full.bg-gray-900');
    expect(dots.length).toBe(0);
  });
});

describe('PlayerCard — aria-label', () => {
  it('tem aria-label correto com nome do jogador', () => {
    renderPlayerCard();
    expect(screen.getByRole('button')).toHaveAttribute('aria-label', '+ Ponto Jogador A');
  });
});
