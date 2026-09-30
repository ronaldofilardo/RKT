/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { SetGroup } from '../timeline-rows';
import { getGameEndInfo } from '../timeline-utils';
import type { TimelinePoint } from '@/core/scoring/types';

describe('getGameEndInfo (helper unit tests)', () => {
  const basePoint: TimelinePoint = {
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
    rallyLength: 3,
    rallyDetails: null,
    pointDetails: {} as any,
  };

  it('retorna null quando o próximo ponto pertence ao mesmo game', () => {
    const current = { ...basePoint, pointNumber: 1, gameScore: { player1: 0, player2: 0 } };
    const next = { ...basePoint, pointNumber: 2, gameScore: { player1: 1, player2: 0 } };
    const result = getGameEndInfo(current, next, false);
    expect(result).toBeNull();
  });

  it('detecta fim de game quando gamesScore muda no próximo ponto', () => {
    const current = {
      ...basePoint,
      pointNumber: 4,
      server: 'player1' as const,
      winner: 'PLAYER_1' as const,
      gameScore: { player1: 3, player2: 0 },
      gamesScore: { player1: 0, player2: 0 },
    };
    const next = {
      ...basePoint,
      pointNumber: 5,
      server: 'player2' as const,
      gameScore: { player1: 0, player2: 0 },
      gamesScore: { player1: 1, player2: 0 },
    };
    const result = getGameEndInfo(current, next, false);
    expect(result).not.toBeNull();
    expect(result?.isGameEnd).toBe(true);
    expect(result?.gameFinalScore).toEqual({ player1: 1, player2: 0 });
    expect(result?.winner).toBe('PLAYER_1');
    expect(result?.isBreak).toBe(false);
  });

  it('detecta quebra de serviço quando o receptor vence o game', () => {
    const current = {
      ...basePoint,
      pointNumber: 4,
      server: 'player1' as const,
      winner: 'PLAYER_2' as const,
      gameScore: { player1: 0, player2: 3 },
      gamesScore: { player1: 0, player2: 0 },
    };
    const next = {
      ...basePoint,
      pointNumber: 5,
      server: 'player2' as const,
      gameScore: { player1: 0, player2: 0 },
      gamesScore: { player1: 0, player2: 1 },
    };
    const result = getGameEndInfo(current, next, false);
    expect(result).not.toBeNull();
    expect(result?.isBreak).toBe(true);
    expect(result?.winner).toBe('PLAYER_2');
    expect(result?.gameFinalScore).toEqual({ player1: 0, player2: 1 });
  });

  it('detecta fim de game no último ponto do set', () => {
    const current = {
      ...basePoint,
      pointNumber: 40,
      server: 'player1' as const,
      winner: 'PLAYER_1' as const,
      gameScore: { player1: 3, player2: 1 },
      gamesScore: { player1: 5, player2: 4 },
      isSetBall: true,
    };
    const result = getGameEndInfo(current, null, true);
    expect(result).not.toBeNull();
    expect(result?.isGameEnd).toBe(true);
    expect(result?.gameFinalScore).toEqual({ player1: 6, player2: 4 });
    expect(result?.winner).toBe('PLAYER_1');
  });
});

describe('SetGroup — exibição do placar final após finalizar o game', () => {
  const makePoint = (overrides: Partial<TimelinePoint>): TimelinePoint => ({
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
    rallyLength: 3,
    rallyDetails: null,
    pointDetails: {} as any,
    ...overrides,
  });

  it('renderiza linha de término de game com placar final e detalhes', () => {
    const p1 = makePoint({ pointNumber: 1, gameScore: { player1: 0, player2: 0 }, gamesScore: { player1: 0, player2: 0 } });
    const p2 = makePoint({ pointNumber: 2, gameScore: { player1: 1, player2: 0 }, gamesScore: { player1: 0, player2: 0 } });
    const p3 = makePoint({ pointNumber: 3, gameScore: { player1: 2, player2: 0 }, gamesScore: { player1: 0, player2: 0 } });
    const p4 = makePoint({
      pointNumber: 4,
      gameScore: { player1: 3, player2: 0 },
      gamesScore: { player1: 0, player2: 0 },
      winner: 'PLAYER_1',
      server: 'player1',
    });
    // Próximo ponto inicia novo game (gamesScore = 1-0)
    const p5 = makePoint({ pointNumber: 5, gameScore: { player1: 0, player2: 0 }, gamesScore: { player1: 1, player2: 0 } });

    render(
      <table>
        <tbody>
          <SetGroup
            setNumber={1}
            points={[p1, p2, p3, p4, p5]}
            allPoints={[p1, p2, p3, p4, p5]}
            hasActiveFilters={false}
            isLast={false}
            matchId="m1"
            player1Name="Carlos Alcaraz"
            player2Name="Jannik Sinner"
          />
        </tbody>
      </table>
    );

    // Linha de fim do game deve existir para o ponto 4
    const gameEndRow = screen.getByTestId('game-end-1-4');
    expect(gameEndRow).toBeInTheDocument();
    expect(gameEndRow.textContent).toContain('Fim do Game');
    expect(gameEndRow.textContent).toContain('1x0');
    expect(gameEndRow.textContent).toContain('Carlos Alcaraz');
    expect(gameEndRow.textContent).toContain('Confirmou o saque');
  });

  it('renderiza quebra de saque na linha de fim de game quando aplicável', () => {
    const p1 = makePoint({
      pointNumber: 4,
      server: 'player1',
      winner: 'PLAYER_2',
      gameScore: { player1: 0, player2: 3 },
      gamesScore: { player1: 0, player2: 0 },
    });
    const p2 = makePoint({
      pointNumber: 5,
      server: 'player2',
      winner: 'PLAYER_2',
      gameScore: { player1: 0, player2: 0 },
      gamesScore: { player1: 0, player2: 1 },
    });

    render(
      <table>
        <tbody>
          <SetGroup
            setNumber={1}
            points={[p1, p2]}
            allPoints={[p1, p2]}
            hasActiveFilters={false}
            isLast={false}
            matchId="m1"
            player1Name="Carlos Alcaraz"
            player2Name="Jannik Sinner"
          />
        </tbody>
      </table>
    );

    const gameEndRow = screen.getByTestId('game-end-1-4');
    expect(gameEndRow.textContent).toContain('Quebra de saque');
    expect(gameEndRow.textContent).toContain('0x1');
    expect(gameEndRow.textContent).toContain('Jannik Sinner');
  });
});
