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
          setLabel="SET 1"
          isFirstPointOfGame={true}
          isFirstPointOfSet={true}
          {...overrides}
        />
      </tbody>
    </table>
  );
}

describe('PointRow — novo layout (23 colunas)', () => {
  it('ACE na coluna 1º saque: exibe ACE, efeito e direção', () => {
    const p = makePoint({
      type: 'ACE',
      firstServeOutcome: 'ace',
      serveEffect: 'topspin',
      serveDirection: 'aberto',
      rallyDetails: {
        vencedor: 'sacador',
        situacao: 'saque',
        golpe: 'saque',
        efeito: 'topspin',
        direcao: 'aberto',
      } as any,
    });
    renderRow(p);
    const text = (document.querySelector('tbody') as HTMLElement).textContent ?? '';
    expect(text).toContain('ACE');
    expect(text).toContain('topspin');
    expect(text).toContain('aberto');
  });

  it('coluna RALLY mostra a faixa de duração (enum duracao), não o número cru', () => {
    const p = makePoint({
      rallyLength: 8,
      rallyDetails: { vencedor: 'sacador', situacao: 'fundo', tipo: 'winner', golpe: 'fh', duracao: 'opcao_2' } as any,
    });
    renderRow(p);
    expect(screen.getByText('7-10')).toBeInTheDocument();
    expect(screen.queryByText('8')).not.toBeInTheDocument();
  });

  it('OBSERVAÇÃO exibe a nota completa, sem truncar', () => {
    const longNote = 'Ronaldo hesitou no segundo saque, mudou o efeito de topspin para slice e perdeu confiança no restante do game.';
    const p = makePoint({ note: longNote });
    renderRow(p);
    expect(screen.getByText(new RegExp(longNote))).toBeInTheDocument();
  });

  it('coluna SET exibe o pointNumber no primeiro ponto do set', () => {
    const p = makePoint({ server: 'player1', pointNumber: 3 });
    renderRow(p);
    expect(screen.getByText('SET 1')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('coluna P/ mostra o ganhador do ponto (1 ou 2)', () => {
    const p = makePoint({ server: 'player1', winner: 'PLAYER_2' });
    renderRow(p);
    const text = (document.querySelector('tbody') as HTMLElement).textContent ?? '';
    expect(text).toContain('2'); // PLAYER_2 ganhou
  });

  it('coluna GAMES só mostra o placar no 1º ponto do game (demais = –)', () => {
    const p = makePoint({
      setNumber: 1,
      pointNumber: 1,
      gamesScore: { player1: 0, player2: 0 },
      gameScore: { player1: 0, player2: 0 },
    });
    renderRow(p, { isFirstPointOfGame: true });
    const text = (document.querySelector('tbody') as HTMLElement).textContent ?? '';
    expect(text).toContain('1'); // game number

    const p2 = makePoint({
      setNumber: 1,
      pointNumber: 2,
      gamesScore: { player1: 0, player2: 0 },
      gameScore: { player1: 1, player2: 0 },
    });
    const { container } = renderRow(p2, { isFirstPointOfGame: false });
    const cells = container.querySelectorAll('td');
    // [4]=GAMES, [5]=PONTOS
    expect(cells[4]?.textContent).toBe('–');
    expect(cells[5]?.textContent).toBe('15-0');
  });
});
