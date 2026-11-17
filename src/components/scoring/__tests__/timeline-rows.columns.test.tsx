/**
 * @jest-environment jsdom
 */
// Split de timeline-rows.test.tsx — describe "PointRow — colunas no., SAC, Venc
// (sem coluna SET)": cores das colunas, ausência da coluna SET, iniciais e GAMES.
// Asserções 1:1 (o describe original é coberto por este arquivo).
import { screen } from '@testing-library/react';
import { getPlayerInitials } from '../timeline-rows';
import { baseProps, makePoint, renderRow } from './timelineRowsTestKit';

describe('PointRow — colunas no., SAC, Venc (sem coluna SET)', () => {
  it('SAC e Venc usam a cor do atleta (sem provider → branco canônico)', () => {
    const cells = renderRow(makePoint({ server: 'player2', winner: 'PLAYER_1' })).querySelectorAll('td');
    // [1]=SAC (P2, sem vencedor → neutro), [2]=Venc (P1, neutro)
    expect(cells[1]?.className).toContain('text-telemetry-text-primary');
    expect(cells[2]?.className).toContain('text-telemetry-text-primary');
    expect(cells[1]?.className).not.toContain('text-telemetry-volt');
    expect(cells[2]?.className).not.toContain('text-telemetry-volt');
  });

  it('não renderiza mais nenhuma coluna/label "SET N" — no. é a 1a coluna', () => {
    const container = renderRow(makePoint({ server: 'player1', pointNumber: 5 }));
    expect(screen.queryByText('SET 1')).not.toBeInTheDocument();
    const cells = container.querySelectorAll('td');
    // [0] agora é "no." (antes era a célula do rótulo SET)
    expect(cells[0]?.textContent).toBe('5');
  });

  it('mostra as iniciais do ganhador do ponto na coluna Venc (não mais "1"/"2")', () => {
    const cells = renderRow(makePoint({ server: 'player1', winner: 'PLAYER_1' })).querySelectorAll('td');
    // [0]=no., [1]=SAC, [2]=Venc(winner)
    expect(cells[2]?.textContent).toBe(getPlayerInitials(baseProps.player1Name));
  });

  it('mostra as iniciais do sacador na coluna SAC (não mais "1"/"2")', () => {
    const cells = renderRow(makePoint({ server: 'player2', winner: 'PLAYER_2' })).querySelectorAll('td');
    // [1]=SAC
    expect(cells[1]?.textContent).toBe(getPlayerInitials(baseProps.player2Name));
  });

  it('GAMES mostra placar apenas no 1º ponto do game (demais = "–")', () => {
    const cells1 = renderRow(makePoint({ pointNumber: 1 }), { isLast: false, isFirstPointOfGame: true }).querySelectorAll('td');
    // [3]=GAMES (número do game), [4]=PONTOS
    expect(cells1[3]?.textContent).toBe('1');
    expect(cells1[4]?.textContent).toBe('0-0');

    const cells = renderRow(makePoint({ pointNumber: 2 }), { isLast: false, isFirstPointOfGame: false }).querySelectorAll('td');
    expect(cells[3]?.textContent).toBe('–');
  });
});
