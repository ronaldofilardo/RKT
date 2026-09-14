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

const baseProps = {
  matchId: 'match-1',
  setLabel: 'SET 1',
  isFirstPointOfGame: true,
  isFirstPointOfSet: true,
};

describe('PointRow — regressão do novo layout (23 colunas)', () => {
  it('ACE: exibe ACE na coluna 1º saque, efeito e direção', () => {
    const p = makePoint({
      type: 'ACE',
      isFirstServe: true,
      firstServeOutcome: 'ace',
      serveEffect: 'flat',
      serveDirection: 'fechado',
      rallyDetails: {
        vencedor: 'sacador',
        situacao: 'saque',
        tipo: 'winner',
        golpe: 'saque',
        efeito: 'flat',
        direcao: 'fechado',
        previewBalls: 1,
      } as any,
    });
    const { container } = render(<table><tbody><PointRow {...baseProps} point={p} hasGap={false} isLast={true} /></tbody></table>);
    const text = container.textContent ?? '';
    expect(text).toContain('ACE');
    expect(text).toContain('flat');
    expect(text).toContain('fechado');
    expect(text).toContain('Saque');
  });

  it('Double Fault: exibe OUT/NET nos saques, badge DF', () => {
    const p = makePoint({
      type: 'DOUBLE_FAULT',
      isFirstServe: false,
      isSecondServe: true,
      firstServeOutcome: 'out',
      secondServeOutcome: 'net',
      firstFault: {
        errorType: 'out',
        serveEffect: 'topspin',
        direction: 'aberto',
      },
      rallyDetails: {
        vencedor: 'devolvedor',
        situacao: 'saque',
        tipo: 'dupla_falta',
        golpe: 'saque',
        subtipo2: 'net',
        efeito: 'flat',
        direcao: 'fechado',
        previewBalls: 1,
      } as any,
    });
    const { container } = render(<table><tbody><PointRow {...baseProps} point={p} hasGap={false} isLast={true} /></tbody></table>);
    const text = container.textContent ?? '';
    expect(text).toContain('DF');
    expect(text).toContain('OUT');
    expect(text).toContain('NET');
    expect(text).toContain('topspin');
    expect(text).toContain('aberto');
  });

  it('Winner em rally: exibe golpe, efeito, direção, badge Winner', () => {
    const p = makePoint({
      type: 'WINNER',
      rallyLength: 4,
      rallyDetails: {
        vencedor: 'sacador',
        situacao: 'fundo',
        tipo: 'winner',
        golpe: 'fh',
        efeito: 'topspin',
        direcao: 'cruzada',
        previewBalls: 4,
      } as any,
    });
    const { container } = render(<table><tbody><PointRow {...baseProps} point={p} hasGap={false} isLast={true} /></tbody></table>);
    const text = container.textContent ?? '';
    expect(text).toContain('Winner');
    expect(text).toContain('Fundo');
    expect(text).toContain('FH');
    expect(text).toContain('topspin');
    expect(text).toContain('cruzada');
  });

  it('Erro não forçado em rally: badge ENF', () => {
    const p = makePoint({
      type: 'UNFORCED_ERROR',
      rallyLength: 2,
      rallyDetails: {
        vencedor: 'devolvedor',
        situacao: 'fundo',
        tipo: 'erro_nao_forcado',
        golpe: 'bh',
        subtipo2: 'net',
        previewBalls: 2,
      } as any,
    });
    const { container } = render(<table><tbody><PointRow {...baseProps} point={p} hasGap={false} isLast={true} /></tbody></table>);
    const text = container.textContent ?? '';
    expect(text).toContain('ENF');
    expect(text).toContain('BH');
  });

  it('Ponto sem rallyDetails: badge TIPO mostra –', () => {
    const p = makePoint({
      type: 'WINNER',
      rallyDetails: null,
      firstFault: undefined,
    });
    const { container } = render(<table><tbody><PointRow {...baseProps} point={p} hasGap={false} isLast={true} /></tbody></table>);
    const text = container.textContent ?? '';
    expect(text).toContain('–');
  });

  it('hasGap renderiza linha separadora "marcação interrompida"', () => {
    const p = makePoint({});
    render(<table><tbody><PointRow {...baseProps} point={p} hasGap={true} isLast={true} /></tbody></table>);
    expect(screen.getByText('marcação interrompida')).toBeInTheDocument();
  });

  it('vencedor PLAYER_2 usa borda vermelha, PLAYER_1 usa borda azul', () => {
    const p1 = makePoint({ winner: 'PLAYER_1' });
    const p2 = makePoint({ winner: 'PLAYER_2' });
    const { container: c1 } = render(<table><tbody><PointRow {...baseProps} point={p1} hasGap={false} isLast={true} /></tbody></table>);
    const row1 = c1.querySelector('tr');
    expect(row1?.className).toContain('border-l-blue-500');

    const { container: c2 } = render(<table><tbody><PointRow {...baseProps} point={p2} hasGap={false} isLast={true} /></tbody></table>);
    const row2 = c2.querySelector('tr');
    expect(row2?.className).toContain('border-l-red-500');
  });
});

describe('PointRow — colunas SET, PONTO P/, SACADOR', () => {
  it('mostra "SET N" + pointNumber no primeiro ponto do set', () => {
    const p = makePoint({ server: 'player1', pointNumber: 5 });
    render(<table><tbody><PointRow {...baseProps} point={p} hasGap={false} isLast={true} /></tbody></table>);
    expect(screen.getByText('SET 1')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('mostra ganhador do ponto na coluna P/ (1 ou 2)', () => {
    const p = makePoint({ server: 'player1', winner: 'PLAYER_1' });
    const { container } = render(<table><tbody><PointRow {...baseProps} point={p} hasGap={false} isLast={true} /></tbody></table>);
    const cells = container.querySelectorAll('td');
    // [0]=SET, [1]=no., [2]=P/(winner)
    expect(cells[2]?.textContent).toBe('1');
  });

  it('mostra sacador na coluna SAC (1 ou 2)', () => {
    const p = makePoint({ server: 'player2', winner: 'PLAYER_2' });
    const { container } = render(<table><tbody><PointRow {...baseProps} point={p} hasGap={false} isLast={true} /></tbody></table>);
    const cells = container.querySelectorAll('td');
    // [3]=SAC
    expect(cells[3]?.textContent).toBe('2');
  });

  it('GAMES mostra placar apenas no 1º ponto do game (demais = "–")', () => {
    const p1 = makePoint({ pointNumber: 1 });
    const p2 = makePoint({ pointNumber: 2 });
    const { container: c1 } = render(
      <table>
        <tbody>
          <PointRow {...baseProps} point={p1} hasGap={false} isLast={false} isFirstPointOfGame={true} />
        </tbody>
      </table>
    );
    const cells1 = c1.querySelectorAll('td');
    // [4]=GAMES (número do game), [5]=PONTOS
    expect(cells1[4]?.textContent).toBe('1');
    expect(cells1[5]?.textContent).toBe('0-0');

    const { container: c2 } = render(
      <table>
        <tbody>
          <PointRow {...baseProps} point={p2} hasGap={false} isLast={false} isFirstPointOfGame={false} />
        </tbody>
      </table>
    );
    const cells = c2.querySelectorAll('td');
    expect(cells[4]?.textContent).toBe('–');
  });
});
