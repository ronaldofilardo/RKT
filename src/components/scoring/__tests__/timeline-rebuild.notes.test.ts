/**
 * @jest-environment jsdom
 */
/**
 * Testes do contrato de extração de `note` na coluna OBSERVAÇÃO do /report.
 * A `note` é extraída EXCLUSIVAMENTE das `annotations` persistidas no PointLog;
 * o `p.note` do history (TimelinePoint) NUNCA é usado como fallback — ele pode
 * ser residual de um ponto anterior do engine, causando "troca" de observações.
 *
 * Caminhos suportados:
 *   1. annotations.note         (campo raiz — path moderno)
 *   2. annotations.rallyDetails.note (path legado)
 *   3. sem annotations           → undefined (OBS fica vazia)
 */
import { rebuildTimelineFromPointLogs, type PointLogRow } from '@/components/scoring/timeline-rebuild';
import type { TimelinePoint } from '@/core/scoring/types';

function makeHistory(): TimelinePoint[] {
  return [
    {
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
      isTiebreak: false,
      gameIsDeuce: false,
      gameAdvantage: null,
    } as TimelinePoint,
  ];
}

function makeLog(overrides: Partial<PointLogRow>): PointLogRow {
  return {
    id: 'log-1',
    winnerId: 'p1',
    type: 'WINNER',
    serverId: 'p1',
    timestamp: new Date('2026-08-14T12:00:00Z'),
    annotations: null,
    audioNote: null,
    audioNoteDuration: null,
    ...overrides,
  };
}

describe('timeline-rebuild: extração e isolamento de notas textuais na OBS (/report)', () => {
  it('extrai note de annotations.note (caminho primário)', () => {
    const history = makeHistory();
    const logs: PointLogRow[] = [
      makeLog({
        annotations: {
          note: 'sacador errou bola fácil na paralela',
          rallyDetails: null,
          rallyLength: 3,
          isFirstServe: true,
        },
      }),
    ];
    const out = rebuildTimelineFromPointLogs(history, logs, 'p1', 'p2', 'p1');
    expect(out[0]?.note).toBe('sacador errou bola fácil na paralela');
  });

  it('extrai note de rallyDetails.note quando annotations.note é undefined', () => {
    const history = makeHistory();
    const logs: PointLogRow[] = [
      makeLog({
        annotations: {
          rallyDetails: { note: 'pressão no fundo' } as any,
          rallyLength: 3,
          isFirstServe: true,
        },
      }),
    ];
    const out = rebuildTimelineFromPointLogs(history, logs, 'p1', 'p2', 'p1');
    expect(out[0]?.note).toBe('pressão no fundo');
  });

  it('annotations com note e rallyDetails ausente → undefined (sem fallback para p.note)', () => {
    // Garante que, quando annotations existe mas não tem nota alguma,
    // a OBS fique vazia — não vaza a nota de um ponto adjacente do history.
    const history = makeHistory();
    (history[0] as any).note = 'nota antiga no histórico';
    const logs: PointLogRow[] = [
      makeLog({
        annotations: { rallyDetails: null, rallyLength: 3 },
      }),
    ];
    const out = rebuildTimelineFromPointLogs(history, logs, 'p1', 'p2', 'p1');
    // annotations existe mas não tem note → undefined (não usa p.note do history)
    expect(out[0]?.note).toBeUndefined();
  });

  it('annotations = null → undefined (sem fallback para p.note do history)', () => {
    // Caso crítico: ponto sem anotação alguma. A OBS deve ficar vazia,
    // não herdar a nota de um ponto anterior via p.note do history.
    const history = makeHistory();
    (history[0] as any).note = 'vindo só do history';
    const logs: PointLogRow[] = [makeLog({ annotations: null })];
    const out = rebuildTimelineFromPointLogs(history, logs, 'p1', 'p2', 'p1');
    expect(out[0]?.note).toBeUndefined();
  });
});
