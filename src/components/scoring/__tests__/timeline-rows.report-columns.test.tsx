/**
 * @jest-environment jsdom
 */
import { render, screen } from '@testing-library/react';
import { PointRow } from '../timeline-rows';
import type { TimelinePoint } from '@/core/scoring/types';

function makePoint(overrides: Partial<TimelinePoint>): TimelinePoint {
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
    pointDetails: {} as any,
    isTiebreak: false,
    gameIsDeuce: false,
    gameAdvantage: null,
    firstFault: undefined,
    ...overrides,
  } as TimelinePoint;
}

function renderRow(p: TimelinePoint, overrides: Partial<React.ComponentProps<typeof PointRow>> = {}) {
  return render(
    <table>
      <tbody>
        <PointRow
          point={p}
          hasGap={false}
          isLast={true}
          matchId="match-1"
          isFirstPointOfGame={true}
          player1Name="Rafael Nadal"
          player2Name="Djokovic"
          {...overrides}
        />
      </tbody>
    </table>
  );
}

describe('PointRow — novo layout (25 colunas, sem coluna SET)', () => {
  it('coluna RALLY mostra a faixa de duração (enum duracao), não o número cru', () => {
    const p = makePoint({
      rallyLength: 8,
      rallyDetails: { vencedor: 'sacador', situacao: 'fundo', tipo: 'winner', golpe: 'fh', duracao: 'opcao_2' } as any,
    });
    renderRow(p);
    expect(screen.getByText('7-10')).toBeInTheDocument();
    expect(screen.queryByText('8')).not.toBeInTheDocument();
  });

  it('OBSERVAÇÃO não exibe rótulos de set (SET 1, SET 2, etc.)', () => {
    const p = makePoint({ note: 'SET 1' });
    const { container } = renderRow(p);
    expect(screen.queryByText(/SET 1/)).not.toBeInTheDocument();
    const obsCell = container.querySelectorAll('td')[24];
    expect(obsCell?.textContent).toBe('–');
  });

  it('OBSERVAÇÃO exibe a nota completa, sem truncar', () => {
    const longNote = 'Ronaldo hesitou no segundo saque, mudou o efeito de topspin para slice e perdeu confiança no restante do game.';
    const p = makePoint({ note: longNote });
    renderRow(p);
    expect(screen.getByText(new RegExp(longNote))).toBeInTheDocument();
  });

  it('coluna GAMES só mostra o placar no 1º ponto do game (demais = –)', () => {
    const p = makePoint({
      setNumber: 1,
      pointNumber: 1,
      gamesScore: { player1: 0, player2: 0 },
      gameScore: { player1: 0, player2: 0 },
    });
    const { container: c1 } = renderRow(p, { isFirstPointOfGame: true });
    const cells1 = c1.querySelectorAll('td');
    // [0]=no., [1]=P/, [2]=SAC, [3]=GAMES, [4]=PONTOS
    expect(cells1[3]?.textContent).toBe('1');

    const p2 = makePoint({
      setNumber: 1,
      pointNumber: 2,
      gamesScore: { player1: 0, player2: 0 },
      gameScore: { player1: 1, player2: 0 },
    });
    const { container } = renderRow(p2, { isFirstPointOfGame: false });
    const cells = container.querySelectorAll('td');
    expect(cells[3]?.textContent).toBe('–');
    expect(cells[4]?.textContent).toBe('15-0');
  });
});
