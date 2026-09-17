/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MatchTimelineView } from '../MatchTimelineView';
import type { TimelinePoint } from '@/core/scoring/types';

function makePoint(overrides: Partial<TimelinePoint> = {}): TimelinePoint {
  return {
    pointNumber: 1,
    winner: 'PLAYER_1',
    type: 'WINNER',
    server: 'player1',
    isFirstServe: true,
    isSecondServe: false,
    gameScore: { player1: 0, player2: 0 },
    gamesScore: { player1: 0, player2: 0 },
    setNumber: 1,
    isBreakPoint: false,
    isGameBall: false,
    isSetBall: false,
    rallyLength: 1,
    rallyDetails: null,
    pointDetails: {
      winnerId: 'p1',
      type: 'WINNER',
      isFirstServe: true,
      isSecondServe: false,
      isLet: false,
      serverId: 'p1',
      timestamp: Date.now(),
      rallyDetails: null,
      rallyLength: 1,
      firstFaultDetail: null,
    },
    ...overrides,
  } as TimelinePoint;
}

const defaultProps = {
  points: [] as TimelinePoint[],
  player1Name: 'Carlos Alcaraz',
  player2Name: 'Novak Djokovic',
  matchId: 'match-1',
};

describe('MatchTimelineView — empty state', () => {
  it('exibe mensagem quando não há pontos', () => {
    render(<MatchTimelineView {...defaultProps} />);
    expect(
      screen.getByText('Esta sessão não possui pontos detalhados registrados.'),
    ).toBeInTheDocument();
  });
});

describe('MatchTimelineView — point counts', () => {
  it('mostra contagem total de pontos sem filtros', () => {
    const points = [
      makePoint({ pointNumber: 1, setNumber: 1 }),
      makePoint({ pointNumber: 2, setNumber: 1, winner: 'PLAYER_2' }),
    ];
    render(<MatchTimelineView {...defaultProps} points={points} />);
    expect(screen.getByText('2 pontos')).toBeInTheDocument();
  });

  it('mostra "X de Y pontos" quando filtros estão ativos', () => {
    const points = [
      makePoint({ pointNumber: 1, setNumber: 1, winner: 'PLAYER_1' }),
      makePoint({ pointNumber: 2, setNumber: 1, winner: 'PLAYER_2' }),
    ];
    render(<MatchTimelineView {...defaultProps} points={points} />);
    fireEvent.click(screen.getByText(/P1 · Carlos Alcaraz/));
    expect(screen.getByText('1 de 2 pontos')).toBeInTheDocument();
  });
});

describe('MatchTimelineView — filter toggles', () => {
  it('ativa filtro p1 ao clicar no chip do jogador 1', () => {
    const points = [
      makePoint({ pointNumber: 1, setNumber: 1, winner: 'PLAYER_1' }),
      makePoint({ pointNumber: 2, setNumber: 1, winner: 'PLAYER_2' }),
    ];
    render(<MatchTimelineView {...defaultProps} points={points} />);
    fireEvent.click(screen.getByText(/P1 · Carlos Alcaraz/));
    expect(screen.getByText('1 de 2 pontos')).toBeInTheDocument();
  });

  it('desativa filtro ao clicar novamente', () => {
    const points = [
      makePoint({ pointNumber: 1, setNumber: 1, winner: 'PLAYER_1' }),
      makePoint({ pointNumber: 2, setNumber: 1, winner: 'PLAYER_2' }),
    ];
    render(<MatchTimelineView {...defaultProps} points={points} />);
    fireEvent.click(screen.getByText(/P1 · Carlos Alcaraz/));
    fireEvent.click(screen.getByText(/P1 · Carlos Alcaraz/));
    expect(screen.getByText('2 pontos')).toBeInTheDocument();
  });

  it('mostra mensagem quando filtros não retornam resultados', () => {
    const points = [
      makePoint({ pointNumber: 1, setNumber: 1, winner: 'PLAYER_1' }),
    ];
    render(<MatchTimelineView {...defaultProps} points={points} />);
    fireEvent.click(screen.getByText(/P2 · Novak Djokovic/));
    expect(
      screen.getByText('Nenhum ponto corresponde aos filtros selecionados.'),
    ).toBeInTheDocument();
  });
});

describe('MatchTimelineView — grouping by set', () => {
  it('renderiza grupos de set corretamente', () => {
    const points = [
      makePoint({ pointNumber: 1, setNumber: 1 }),
      makePoint({ pointNumber: 2, setNumber: 1 }),
      makePoint({ pointNumber: 3, setNumber: 2 }),
    ];
    render(<MatchTimelineView {...defaultProps} points={points} />);
    expect(screen.getByText('3 pontos')).toBeInTheDocument();
  });

  it('lida com setNumber repetido sem warning de chave duplicada', () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    const points = [
      makePoint({ pointNumber: 1, setNumber: 1 }),
      makePoint({ pointNumber: 2, setNumber: 2 }),
      makePoint({ pointNumber: 3, setNumber: 1 }),
    ];
    render(<MatchTimelineView {...defaultProps} points={points} />);
    expect(consoleError).not.toHaveBeenCalledWith(
      expect.stringMatching(/Encountered two children with the same key/i),
    );
    consoleError.mockRestore();
  });
});

describe('MatchTimelineView — edge cases', () => {
  it('renderiza sem erros com 1 ponto', () => {
    const points = [makePoint({ pointNumber: 1, setNumber: 1 })];
    render(<MatchTimelineView {...defaultProps} points={points} />);
    expect(screen.getByText('1 pontos')).toBeInTheDocument();
  });

  it('mostra legenda da tabela', () => {
    const points = [makePoint({ pointNumber: 1, setNumber: 1 })];
    render(<MatchTimelineView {...defaultProps} points={points} />);
    expect(screen.getByText('Como ler esta tabela')).toBeInTheDocument();
  });

  it('renderiza cabeçalho da tabela', () => {
    const points = [makePoint({ pointNumber: 1, setNumber: 1 })];
    render(<MatchTimelineView {...defaultProps} points={points} />);
    expect(screen.getByText('SET')).toBeInTheDocument();
    expect(screen.getByText('PLACAR')).toBeInTheDocument();
    expect(screen.getByText('1º Saque')).toBeInTheDocument();
    expect(screen.getByText('2º Saque')).toBeInTheDocument();
  });
});
