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
    const { container } = render(<PointRow point={p} hasGap={false} isLast={true} />);
    const text = container.textContent ?? '';
    // Bug B (regressão): direção do ACe deve aparecer
    expect(text).toContain('fechado');
    // Efeito deve aparecer
    expect(text).toContain('flat');
    // SAQUE 1ª
    expect(text).toContain('1ª');
    // Coluna ACE/DF mostra formato detalhado (Bug A)
    expect(text).toContain('ACE-FLA-FEC');
    // Situação e golpe também preenchidos (não mais suprimidos por isServeFinish)
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
    const { container } = render(<PointRow point={p} hasGap={false} isLast={true} />);
    const text = container.textContent ?? '';
    // Badge DF (Bug D)
    expect(text).toContain('DF');
    // 1ª falta com todas as três partes (Bug "1ª falta perdida")
    expect(text).toContain('out • topspin • aberto');
    // 2ª falta: net + flat + fechado
    expect(text).toContain('net • flat • fechado');
    // subtipo2 (net) aparece em ONDE ERROU (Bug C)
    expect(text).toContain('net');
    // Coluna ACE/DF mostra formato detalhado (Bug A)
    expect(text).toContain('DF:');
    // Direção appearing — não mais vazia para saque
    expect(text).toContain('fechado');
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
    const { container } = render(<PointRow point={p} hasGap={false} isLast={true} />);
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
    const { container } = render(<PointRow point={p} hasGap={false} isLast={true} />);
    const text = container.textContent ?? '';
    expect(text).toContain('ENF');
    expect(text).toContain('net');
    expect(text).toContain('BH');
  });

  it('Ponto sem rallyDetails: badge TIPO mostra –, SAQUE continua visível', () => {
    const p = makePoint({
      type: 'WINNER',
      rallyDetails: null,
      firstFault: undefined,
    });
    const { container } = render(<PointRow point={p} hasGap={false} isLast={true} />);
    const tds = container.querySelectorAll('td');
    const text = container.textContent ?? '';
    // Badge TIPO vazio quando não há rd (mostra –)
    expect(text).toContain('–');
    // SAQUE 1ª continua mostrando — não depende de rallyDetails
    expect(text).toContain('1ª');
  });

  it('Break point: tag BP visível ao lado da bola', () => {
    const p = makePoint({ isBreakPoint: true });
    const { container } = render(<PointRow point={p} hasGap={false} isLast={true} />);
    expect(screen.getByText('BP')).toBeInTheDocument();
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('hasGap renderiza linha separadora "marcação interrompida"', () => {
    const p = makePoint({});
    const { container } = render(<PointRow point={p} hasGap={true} isLast={true} />);
    expect(screen.getByText('marcação interrompida')).toBeInTheDocument();
  });

  it('vencedor PLAYER_2 usa borda vermelha, PLAYER_1 usa borda azul', () => {
    const p1 = makePoint({ winner: 'PLAYER_1' });
    const p2 = makePoint({ winner: 'PLAYER_2' });
    const { container: c1 } = render(<PointRow point={p1} hasGap={false} isLast={true} />);
    const row1 = c1.querySelector('tr');
    expect(row1?.className).toContain('border-l-blue-500');

    const { container: c2 } = render(<PointRow point={p2} hasGap={false} isLast={true} />);
    const row2 = c2.querySelector('tr');
    expect(row2?.className).toContain('border-l-red-500');
  });
});
