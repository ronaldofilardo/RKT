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
  player1Name: 'Ronaldo',
  player2Name: 'Mateus',
  setLabel: 'SET 1',
  serverLabel: 'Ronaldo',
  serverHasFixed: true,
  isFirstPointOfGame: true,
  isFirstPointOfSet: true,
};

describe('PointRow — regressão das divergência UI/payload', () => {
  it('ACe: exibe efeito, direção (aberto/fechado), saque 1ª, badge ACe', () => {
    const p = makePoint({
      type: 'ACE',
      isFirstServe: true,
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
    // Direção do ACe deve aparecer
    expect(text).toContain('fechado');
    // Efeito deve aparecer
    expect(text).toContain('flat');
    // Badge ACe
    expect(text).toContain('ACe');
    // Situação e golpe também preenchidos
    expect(text).toContain('Saque');
  });

  it('Double Fault: exibe 1ª e 2ª faltas, badge DF, subtipo2, ambas faltas', () => {
    const p = makePoint({
      type: 'DOUBLE_FAULT',
      isFirstServe: false,
      isSecondServe: true,
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
    // Badge DF
    expect(text).toContain('DF');
    // 1ª falta com todas as três partes
    expect(text).toContain('out • topspin • aberto');
    // 2ª falta: net + flat + fechado
    expect(text).toContain('net • flat • fechado');
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

  it('Erro não forçado em rally: badge ENF, subtipo2 (onde errou)', () => {
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
    expect(text).toContain('net');
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

describe('PointRow — coluna lateral SET', () => {
  it('mostra "SET N" + sacador + [S] no primeiro ponto do set (sacador fixo)', () => {
    const p = makePoint({ server: 'player1' });
    render(<table><tbody><PointRow {...baseProps} point={p} hasGap={false} isLast={true} /></tbody></table>);
    expect(screen.getByText('SET 1')).toBeInTheDocument();
    expect(screen.getByText('[S]')).toBeInTheDocument();
  });

  it('mostra "sacador alterna" quando o set tem mais de um sacador', () => {
    const p = makePoint({ server: 'player1' });
    render(<table><tbody><PointRow {...baseProps} point={p} hasGap={false} isLast={true} serverHasFixed={false} /></tbody></table>);
    expect(screen.getByText(/sacador alterna/i)).toBeInTheDocument();
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
    // GAMES e PONTOS mostram "0-0" no 1º ponto do game
    const cells1 = c1.querySelectorAll('td');
    expect(cells1[1]?.textContent).toBe('0-0');
    expect(cells1[2]?.textContent).toBe('0-0');

    const { container: c2 } = render(
      <table>
        <tbody>
          <PointRow {...baseProps} point={p2} hasGap={false} isLast={false} isFirstPointOfGame={false} />
        </tbody>
      </table>
    );
    // Cells: [0]=SET, [1]=GAMES, [2]=PONTOS
    const cells = c2.querySelectorAll('td');
    expect(cells[1]?.textContent).toBe('–');
  });
});
