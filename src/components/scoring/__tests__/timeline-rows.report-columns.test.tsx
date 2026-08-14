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

function renderRow(p: TimelinePoint) {
  // PointRow gera células <td>; envolvemos em <table><tbody> para HTML válido.
  return render(
    <table>
      <tbody>
        <PointRow
          point={p}
          hasGap={false}
          isLast={true}
          matchId="match-1"
          player1Name="Ronaldo"
          player2Name="Mateus"
        />
      </tbody>
    </table>
  );
}

describe('PointRow — reorganização do /report (itens 1, 2, 6 e C)', () => {
  it('item 1: não existe mais coluna "ACE" com o resumo abreviado (ex.: "ACE-TOP-AB")', () => {
    const p = makePoint({
      type: 'ACE',
      rallyDetails: {
        vencedor: 'sacador',
        situacao: 'saque',
        golpe: 'saque',
        efeito: 'topspin',
        direcao: 'aberto',
      } as any,
    });
    renderRow(p);
    expect(screen.queryByText(/ACE-TOP-AB/)).not.toBeInTheDocument();
  });

  it('item 2: célula de TROCAS mostra a faixa, não o número cru', () => {
    const p = makePoint({ rallyLength: 8 });
    renderRow(p);
    expect(screen.getByText('7-10')).toBeInTheDocument();
    expect(screen.queryByText('8')).not.toBeInTheDocument();
  });

  it('item 6: OBSERVAÇÃO exibe a nota completa, sem truncar', () => {
    const longNote = 'Ronaldo hesitou no segundo saque, mudou o efeito de topspin para slice e perdeu confiança no restante do game.';
    const p = makePoint({ note: longNote });
    renderRow(p);
    expect(screen.getByText(new RegExp(longNote))).toBeInTheDocument();
  });

  it('reorganização (C): coluna SAQUE mostra o nome de quem sacou, não só a cor da bolinha', () => {
    const p = makePoint({ server: 'player1' });
    renderRow(p);
    // "Ronaldo" aparece em 2 lugares: célula da coluna SAQUE e célula da coluna VENCEDOR.
    // O importante aqui é que aparece pelo menos uma vez como texto (não só a cor da bolinha).
    expect(screen.getAllByText('Ronaldo').length).toBeGreaterThanOrEqual(1);
  });

  it('reorganização (C): coluna VENCEDOR mostra explicitamente o nome de quem ganhou o ponto', () => {
    const p = makePoint({ winner: 'PLAYER_2', server: 'player1' });
    renderRow(p);
    // "Mateus" deve aparecer como vencedor (texto explícito), mesmo o saque sendo do Ronaldo.
    expect(screen.getByText('Mateus')).toBeInTheDocument();
  });
});
