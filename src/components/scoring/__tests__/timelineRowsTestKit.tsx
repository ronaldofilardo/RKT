/**
 * Kit de testes do PointRow (timeline-rows).
 *
 * Concentra o arrange das suites `timeline-rows.*.test.tsx`:
 * - makePoint(): builder de TimelinePoint com defaults de um ponto neutro;
 * - baseProps(): props comuns de toda linha (matchId/nomes/isFirstPointOfGame);
 * - renderRow()/renderRowCells()/rowCells(): render de `<table><tbody><PointRow/></tbody></table>`
 *   e extração das células `td` (mesmo caminho de render do arquivo original);
 * - renderRowWithColors(): mesmo render envolvido em PlayerColorProvider (testes de borda).
 *
 * Os testes mantêm asserções 1:1 com o arquivo original; apenas o arrange é delegado aqui.
 * Fora da coleta do Jest (excluído por collectCoverageFrom) e não limitado a 80L.
 */
import { render } from '@testing-library/react';
import { PointRow } from '../timeline-rows';
import type { PointRowProps } from '../timeline-row.logic';
import type { TimelinePoint } from '@/core/scoring/types';
import { PlayerColorProvider, resolvePlayerColors } from '@/components/ui/player-color.context';

/** Defaults de um ponto neutro; `overrides` é aplicado por último (spread do original). */
export function makePoint(overrides: Partial<TimelinePoint>): TimelinePoint {
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

export const baseProps = {
  matchId: 'match-1',
  isFirstPointOfGame: true,
  player1Name: 'Rafael Nadal',
  player2Name: 'Djokovic',
};

type RowExtra = Partial<Pick<PointRowProps, 'hasGap' | 'isLast' | 'isFirstPointOfGame'>>;

function rowTable(point: TimelinePoint, extra: RowExtra = {}) {
  return (
    <table>
      <tbody>
        <PointRow {...baseProps} point={point} hasGap={false} isLast={true} {...extra} />
      </tbody>
    </table>
  );
}

/** Render padrão da linha; retorna o container (para textContent/querySelector). */
export function renderRow(point: TimelinePoint, extra: RowExtra = {}): HTMLElement {
  const { container } = render(rowTable(point, extra));
  return container;
}

/** Render da linha e devolve o texto de cada célula `td` (ordem das 25 colunas). */
export function renderRowCells(point: TimelinePoint, extra: RowExtra = {}): (string | null)[] {
  return Array.from(renderRow(point, extra).querySelectorAll('td')).map((td) => td.textContent);
}

/** Render da linha envolvido em PlayerColorProvider (testes de borda por cor do atleta). */
export function renderRowWithColors(
  colors: ReturnType<typeof resolvePlayerColors>,
  point: TimelinePoint,
): HTMLElement {
  const { container } = render(
    <PlayerColorProvider colors={colors}>{rowTable(point)}</PlayerColorProvider>,
  );
  return container;
}
