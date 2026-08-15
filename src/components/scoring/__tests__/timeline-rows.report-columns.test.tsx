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
          setLabel="SET 1"
          serverLabel="Ronaldo"
          serverHasFixed={true}
          isFirstPointOfGame={true}
          isFirstPointOfSet={true}
          {...overrides}
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

  it('reorganização (C): coluna lateral SET exibe o sacador com [S] no primeiro ponto do set', () => {
    const p = makePoint({ server: 'player1' });
    renderRow(p);
    // SET 1 + nome do sacador + [S]
    expect(screen.getByText('SET 1')).toBeInTheDocument();
    // SET lateral contém o nome; VENCEDOR também. Validamos pelo menos 2
    // ocorrências de "Ronaldo" (sacador lateral + vencedor do ponto).
    expect(screen.getAllByText('Ronaldo').length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText('[S]')).toBeInTheDocument();
  });

  it('reorganização (C): coluna GAMES só mostra o placar no 1º ponto do game (demais = –)', () => {
    const p = makePoint({
      setNumber: 1,
      pointNumber: 1,
      gamesScore: { player1: 0, player2: 0 },
      gameScore: { player1: 0, player2: 0 },
    });
    renderRow(p, { isFirstPointOfGame: true });
    // GAMES e PONTOS mostram "0-0" no 1º ponto do game
    expect(screen.getAllByText('0-0').length).toBeGreaterThanOrEqual(2);

    // Segundo ponto do mesmo game: GAMES = –, PONTOS = "15-0"
    const p2 = makePoint({
      setNumber: 1,
      pointNumber: 2,
      gamesScore: { player1: 0, player2: 0 },
      gameScore: { player1: 1, player2: 0 },
    });
    const { container } = renderRow(p2, { isFirstPointOfGame: false });
    // Cells: [0]=SET, [1]=GAMES, [2]=PONTOS
    const cells = container.querySelectorAll('td');
    expect(cells[1]?.textContent).toBe('–');
    expect(cells[2]?.textContent).toBe('15-0');
  });

  it('reorganização (C): coluna VENCEDOR mostra explicitamente o nome de quem ganhou o ponto', () => {
    const p = makePoint({ winner: 'PLAYER_2', server: 'player1' });
    renderRow(p);
    expect(screen.getByText('Mateus')).toBeInTheDocument();
  });

  it('quando o set tem alternância de sacador, coluna SET mostra "sacador alterna"', () => {
    const p = makePoint({ server: 'player1' });
    renderRow(p, { serverHasFixed: false });
    expect(screen.getByText(/sacador alterna/i)).toBeInTheDocument();
  });
});
